from config import config_by_name
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from scrapers import get_all_scrapers, get_scraper, discover_scrapers
import os
import sys
import traceback

# Load environment variables from .env file
load_dotenv()

# Now you can access environment variables
UNGM_USERNAME = os.getenv('UNGM_USERNAME')
UNGM_PASSWORD = os.getenv('UNGM_PASSWORD')

# Add scrapers to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'scrapers'))

# Import config AFTER environment variables but BEFORE creating app

# Get environment
env = os.environ.get('FLASK_ENV', 'production')

# Create Flask app FIRST
app = Flask(__name__)

# Configure app using the config object
app.config.from_object(config_by_name[env])

# Enable CORS
CORS(app)

# Discover all scrapers on startup
scrapers = discover_scrapers()

# Store last scraped data - dynamic cache
cache = {}


@app.route('/')
def index():
    """Root endpoint - redirect to API documentation"""
    scraper_list = get_all_scrapers()
    endpoints = [
            {'path': '/api/health', 'method': 'GET', 'description': 'Health check'},
            {'path': '/api/scrapers', 'method': 'GET', 'description': 'List all available scrapers'},
            {'path': '/api/stats', 'method': 'GET', 'description': 'Scraper statistics'},
            {'path': '/api/scrape/all', 'method': 'GET', 'description': 'Run all scrapers'},
            ]

    # Add dynamic endpoints for each scraper
    for scraper_name, scraper_info in scraper_list.items():
        endpoints.append({
            'path': f'/api/scrape/{scraper_name}',
            'method': 'GET',
            'description': f'Run {scraper_info["display_name"]} scraper'
            })
        endpoints.append({
            'path': f'/api/data/{scraper_name}',
            'method': 'GET',
            'description': f'Get cached {scraper_info["display_name"]} data'
            })

    endpoints.extend([
        {'path': '/api/export/json', 'method': 'GET', 'description': 'Export all data as JSON'},
        {'path': '/api/export/csv', 'method': 'GET', 'description': 'Export all data as CSV'}
        ])

    return jsonify({
        'name': 'Tender Scraper API',
        'version': '1.0.0',
        'description': 'API for scraping tender data from various sources',
        'documentation': {
            'endpoints': endpoints,
            'usage': 'Add ?force=true to bypass cache and force fresh scraping'
            },
        'timestamp': datetime.now().isoformat()
        })


@app.route('/api/scrapers', methods=['GET'])
def list_scrapers():
    """List all available scrapers"""
    return jsonify(get_all_scrapers())


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'message': 'Tender Scraper API is running',
        'scrapers_loaded': len(scrapers),
        'environment': env,
        'debug': app.config['DEBUG']
        })


@app.route('/api/scrape/all', methods=['GET'])
def scrape_all():
    """Run all scrapers and return combined data"""
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


@app.route('/api/scrape/<source>', methods=['GET'])
def scrape_source(source):
    """Run specific scraper"""
    try:
        force_refresh = request.args.get('force', 'false').lower() == 'true'
        scraper_list = get_all_scrapers()

        if source not in scraper_list:
            return jsonify({
                'success': False,
                'error': f'Invalid source: {source}. Available: {list(scraper_list.keys())}'
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


@app.route('/api/data/<source>', methods=['GET'])
def get_cached_data(source):
    """Get cached data without scraping"""
    scraper_list = get_all_scrapers()

    if source not in scraper_list:
        return jsonify({
            'success': False,
            'error': f'Invalid source: {source}. Available: {list(scraper_list.keys())}'
            }), 400

    # Initialize cache if not exists
    if source not in cache:
        cache[source] = {'data': [], 'timestamp': None}

    return jsonify({
        'success': True,
        'data': cache[source]['data'],
        'timestamp': cache[source]['timestamp'],
        'source': source
        })


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get scraping statistics"""
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
    """Run specific scraper with caching"""
    # Initialize cache if not exists
    if source not in cache:
        cache[source] = {'data': [], 'timestamp': None}

    # Check cache first
    if not force_refresh and cache[source]['timestamp'] is not None:
        # Return cached data if less than 5 minutes old
        try:
            cache_time = datetime.fromisoformat(cache[source]['timestamp'])
            time_diff = datetime.now() - cache_time
            if time_diff.seconds < 300:  # 5 minutes
                print(f"📦 Returning cached data for {source}")
                return cache[source]['data']
        except ValueError as e:
            print(f"⚠️ Invalid timestamp format for {source}: {e}")
        except TypeError as e:
            print(f"⚠️ Invalid timestamp type for {source}: {e}")
        except Exception as e:
            print(f"⚠️ Unexpected error checking cache for {source}: {e}")

    # Run scraper
    print(f"🔍 Running {source} scraper...")

    scraper_class = get_scraper(source)
    if scraper_class:
        try:
            scraper = scraper_class()
            data = scraper.scrape()
        except Exception as e:
            print(f"❌ Error running {source} scraper: {e}")
            data = []
    else:
        data = []

    # Update cache
    cache[source]['data'] = data
    cache[source]['timestamp'] = datetime.now().isoformat()

    print(f"✅ Scraped {len(data)} items from {source}")
    return data


@app.route('/api/export/json', methods=['GET'])
def export_json():
    """Export all data as JSON"""
    try:
        # Combine all data
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


@app.route('/api/export/csv', methods=['GET'])
def export_csv():
    """Export all data as CSV (simple format)"""
    try:
        # Combine all data
        all_data = []
        for source in cache:
            for item in cache[source]['data']:
                item_copy = item.copy() if hasattr(item, 'copy') else dict(item)
                item_copy['source'] = source
                all_data.append(item_copy)

        # Create CSV manually without pandas
        if not all_data:
            csv_content = "No data available"
        else:
            # Get all unique keys
            keys = set()
            for item in all_data:
                keys.update(item.keys())
            keys = sorted(list(keys))

            # Create CSV header
            csv_content = ",".join([f'"{k}"' for k in keys]) + "\n"

            # Create CSV rows
            for item in all_data:
                row = []
                for key in keys:
                    value = item.get(key, "")
                    # Escape quotes and wrap in quotes
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
    print("📊 Tender Scraper API Server")
    print("=" * 60)
    print(f"✅ Loaded {len(scrapers)} scrapers:")
    for name, info in get_all_scrapers().items():
        print(f"   - {info['display_name']} ({name})")
    print("\n📱 Endpoints:")
    print("   GET /api/health - Health check")
    print("   GET /api/scrapers - List all scrapers")
    print("   GET /api/stats - Scraper statistics")
    print("   GET /api/scrape/all - Run all scrapers")
    for name in get_all_scrapers():
        print(f"   GET /api/scrape/{name} - Run {name} scraper")
    print("   GET /api/export/json - Export all data as JSON")
    print("   GET /api/export/csv - Export all data as CSV")
    print("=" * 60)

    # Get configuration from environment
    debug_mode = app.config['DEBUG']
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')

    print(f"\n🚀 Server starting on http://{host}:{port}")
    print(f"🔧 Debug mode: {'ON' if debug_mode else 'OFF'}")
    print(f"📁 Environment: {env}")
    print("=" * 60)

    # Start the server
    app.run(debug=debug_mode, host=host, port=port)

# finish
