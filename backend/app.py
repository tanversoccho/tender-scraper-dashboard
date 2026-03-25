from config import config_by_name
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from scrapers import get_all_scrapers, get_scraper, discover_scrapers
import os
import sys
import traceback

# load environment variables from .env file
load_dotenv()

# now you can access environment variables
ungm_username = os.getenv('ungm_username')
ungm_password = os.getenv('ungm_password')

# add scrapers to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'scrapers'))

# import config after environment variables but before creating app

# get environment
# env = os.environ.get('flask_env', 'production')
env = os.environ.get('flask_env', 'development')

# create flask app first
app = Flask(__name__)

# configure app using the config object
app.config.from_object(config_by_name[env])

# enable cors
CORS(app)

# discover all scrapers on startup
scrapers = discover_scrapers()

# store last scraped data - dynamic cache
cache = {}


@app.route('/')
def index():
    """root endpoint - redirect to api documentation"""
    scraper_list = get_all_scrapers()
    endpoints = [
            {'path': '/api/health', 'method': 'get', 'description': 'health check'},
            {'path': '/api/scrapers', 'method': 'get', 'description': 'list all available scrapers'},
            {'path': '/api/stats', 'method': 'get', 'description': 'scraper statistics'},
            {'path': '/api/scrape/all', 'method': 'get', 'description': 'run all scrapers'},
            ]

    # add dynamic endpoints for each scraper
    for scraper_name, scraper_info in scraper_list.items():
        endpoints.append({
            'path': f'/api/scrape/{scraper_name}',
            'method': 'get',
            'description': f'run {scraper_info["display_name"]} scraper'
            })
        endpoints.append({
            'path': f'/api/data/{scraper_name}',
            'method': 'get',
            'description': f'get cached {scraper_info["display_name"]} data'
            })

    endpoints.extend([
        {'path': '/api/export/json', 'method': 'get', 'description': 'export all data as json'},
        {'path': '/api/export/csv', 'method': 'get', 'description': 'export all data as csv'}
        ])

    return jsonify({
        'name': 'tender scraper api',
        'version': '1.0.0',
        'description': 'api for scraping tender data from various sources',
        'documentation': {
            'endpoints': endpoints,
            'usage': 'add ?force=true to bypass cache and force fresh scraping'
            },
        'timestamp': datetime.now().isoformat()
        })


@app.route('/api/scrapers', methods=['get'])
def list_scrapers():
    """list all available scrapers"""
    return jsonify(get_all_scrapers())


@app.route('/api/health', methods=['get'])
def health_check():
    """health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'message': 'tender scraper api is running',
        'scrapers_loaded': len(scrapers),
        'environment': env,
        'debug': app.config.get('DEBUG', True)
        })


@app.route('/api/scrape/all', methods=['get'])
def scrape_all():
    """run all scrapers and return combined data"""
    try:
        force_refresh = request.args.get('force', 'false').lower() == 'true'
        scraper_list = get_all_scrapers()

        results = {}
        for scraper_name in scraper_list:
            results[scraper_name] = run_scraper(scraper_name, force_refresh)

        return jsonify({
            'success': True,
            'data': results,
            'timestamp': datetime.now().isoformat()
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
            }), 500


@app.route('/api/scrape/<source>', methods=['get'])
def scrape_source(source):
    """run specific scraper"""
    try:
        force_refresh = request.args.get('force', 'false').lower() == 'true'
        scraper_list = get_all_scrapers()

        if source not in scraper_list:
            return jsonify({
                'success': False,
                'error': f'invalid source: {source}. available: {list(scraper_list.keys())}'
                }), 400

        data = run_scraper(source, force_refresh)

        return jsonify({
            'success': True,
            'data': data,
            'source': source,
            'timestamp': datetime.now().isoformat()
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'source': source,
            'traceback': traceback.format_exc()
            }), 500


@app.route('/api/data/<source>', methods=['get'])
def get_cached_data(source):
    """get cached data without scraping"""
    scraper_list = get_all_scrapers()

    if source not in scraper_list:
        return jsonify({
            'success': False,
            'error': f'invalid source: {source}. available: {list(scraper_list.keys())}'
            }), 400

    # initialize cache if not exists
    if source not in cache:
        cache[source] = {'data': [], 'timestamp': None}

    return jsonify({
        'success': True,
        'data': cache[source]['data'],
        'timestamp': cache[source]['timestamp'],
        'source': source
        })


@app.route('/api/stats', methods=['get'])
def get_stats():
    """get scraping statistics"""
    stats = {}
    scraper_list = get_all_scrapers()

    for source in scraper_list:
        if source in cache:
            stats[source] = {
                    'count': len(cache[source]['data']),
                    'last_updated': cache[source]['timestamp'],
                    'cached': cache[source]['timestamp'] is not None,
                    'display_name': scraper_list[source]['display_name']
                    }
        else:
            stats[source] = {
                    'count': 0,
                    'last_updated': None,
                    'cached': False,
                    'display_name': scraper_list[source]['display_name']
                    }

    return jsonify({
        'success': True,
        'stats': stats,
        'timestamp': datetime.now().isoformat()
        })


def run_scraper(source, force_refresh=False):
    """run specific scraper with caching"""
    # initialize cache if not exists
    if source not in cache:
        cache[source] = {'data': [], 'timestamp': None}

    # check cache first
    if not force_refresh and cache[source]['timestamp'] is not None:
        # return cached data if less than 5 minutes old
        try:
            cache_time = datetime.fromisoformat(cache[source]['timestamp'])
            time_diff = datetime.now() - cache_time
            if time_diff.seconds < 300:  # 5 minutes
                print(f"📦 returning cached data for {source}")
                return cache[source]['data']
        except ValueError as e:
            print(f"⚠️ invalid timestamp format for {source}: {e}")
        except TypeError as e:
            print(f"⚠️ invalid timestamp type for {source}: {e}")
        except Exception as e:
            print(f"⚠️ unexpected error checking cache for {source}: {e}")

    # run scraper
    print(f"🔍 running {source} scraper...")

    scraper_class = get_scraper(source)
    if scraper_class:
        try:
            scraper = scraper_class()
            data = scraper.scrape()
        except Exception as e:
            print(f"❌ error running {source} scraper: {e}")
            data = []
    else:
        data = []

    # update cache
    cache[source]['data'] = data
    cache[source]['timestamp'] = datetime.now().isoformat()

    print(f"✅ scraped {len(data)} items from {source}")
    return data


@app.route('/api/export/json', methods=['get'])
def export_json():
    """export all data as json"""
    try:
        # combine all data
        all_data = []
        for source in cache:
            for item in cache[source]['data']:
                item_copy = item.copy() if hasattr(item, 'copy') else dict(item)
                item_copy['source'] = source
                all_data.append(item_copy)

        return jsonify({
            'success': True,
            'data': all_data,
            'count': len(all_data),
            'timestamp': datetime.now().isoformat()
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
            }), 500


@app.route('/api/export/csv', methods=['get'])
def export_csv():
    """export all data as csv (simple format)"""
    try:
        # combine all data
        all_data = []
        for source in cache:
            for item in cache[source]['data']:
                item_copy = item.copy() if hasattr(item, 'copy') else dict(item)
                item_copy['source'] = source
                all_data.append(item_copy)

        # create csv manually without pandas
        if not all_data:
            csv_content = "no data available"
        else:
            # get all unique keys
            keys = set()
            for item in all_data:
                keys.update(item.keys())
            keys = sorted(list(keys))

            # create csv header
            csv_content = ",".join([f'"{k}"' for k in keys]) + "\n"

            # create csv rows
            for item in all_data:
                row = []
                for key in keys:
                    value = item.get(key, "")
                    # escape quotes and wrap in quotes
                    if isinstance(value, str):
                        value = value.replace('"', '""')
                        row.append(f'"{value}"')
                    else:
                        row.append(f'"{value}"')
                csv_content += ",".join(row) + "\n"

        return jsonify({
            'success': True,
            'data': csv_content,
            'count': len(all_data),
            'format': 'csv',
            'timestamp': datetime.now().isoformat()
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
            }), 500


if __name__ == '__main__':
    print("=" * 60)
    print("📊 tender scraper api server")
    print("=" * 60)
    print(f"✅ loaded {len(scrapers)} scrapers:")
    for name, info in get_all_scrapers().items():
        print(f"   - {info['display_name']} ({name})")
    print("\n📱 endpoints:")
    print("   get /api/health - health check")
    print("   get /api/scrapers - list all scrapers")
    print("   get /api/stats - scraper statistics")
    print("   get /api/scrape/all - run all scrapers")
    for name in get_all_scrapers():
        print(f"   get /api/scrape/{name} - run {name} scraper")
    print("   get /api/export/json - export all data as json")
    print("   get /api/export/csv - export all data as csv")
    print("=" * 60)

    # get configuration from environment
    debug_mode = True
    port = int(os.environ.get('port', 5000))
    host = os.environ.get('host', '0.0.0.0')

    print(f"\n🚀 server starting on http://{host}:{port}")
    print(f"🔧 debug mode: {'on' if debug_mode else 'off'}")
    print(f"📁 environment: {env}")
    print("=" * 60)

    # start the server
    app.run(debug=debug_mode, host=host, port=port)

# finish
