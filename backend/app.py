from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
import sys
from datetime import datetime
import traceback

# Add scrapers to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'scrapers'))

from scrapers.bdjobs import BDJobsScraper
from scrapers.care import CareScraper
from scrapers.pksf import PKSFScraper

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Store last scraped data
cache = {
    'bdjobs': {'data': [], 'timestamp': None},
    'care': {'data': [], 'timestamp': None},
    'pksf': {'data': [], 'timestamp': None}
}

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'message': 'Tender Scraper API is running'
    })

@app.route('/api/scrape/all', methods=['GET'])
def scrape_all():
    """Run all scrapers and return combined data"""
    try:
        force_refresh = request.args.get('force', 'false').lower() == 'true'
        
        results = {
            'bdjobs': run_scraper('bdjobs', force_refresh),
            'care': run_scraper('care', force_refresh),
            'pksf': run_scraper('pksf', force_refresh)
        }
        
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
        
        if source not in ['bdjobs', 'care', 'pksf']:
            return jsonify({
                'success': False,
                'error': f'Invalid source: {source}'
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
    if source not in cache:
        return jsonify({
            'success': False,
            'error': f'Invalid source: {source}'
        }), 400
    
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
    for source in cache:
        stats[source] = {
            'count': len(cache[source]['data']),
            'last_updated': cache[source]['timestamp'],
            'cached': cache[source]['timestamp'] is not None
        }
    
    return jsonify({
        'success': True,
        'stats': stats,
        'timestamp': datetime.now().isoformat()
    })

def run_scraper(source, force_refresh=False):
    """Run specific scraper with caching"""
    # Check cache first
    if not force_refresh and cache[source]['timestamp'] is not None:
        # Return cached data if less than 5 minutes old
        cache_time = datetime.fromisoformat(cache[source]['timestamp'])
        time_diff = datetime.now() - cache_time
        if time_diff.seconds < 300:  # 5 minutes
            print(f"Returning cached data for {source}")
            return cache[source]['data']
    
    # Run scraper
    print(f"Running {source} scraper...")
    
    if source == 'bdjobs':
        scraper = BDJobsScraper()
        data = scraper.scrape()
    elif source == 'care':
        scraper = CareScraper()
        data = scraper.scrape()
    elif source == 'pksf':
        scraper = PKSFScraper()
        data = scraper.scrape()
    else:
        data = []
    
    # Update cache
    cache[source]['data'] = data
    cache[source]['timestamp'] = datetime.now().isoformat()
    
    print(f"Scraped {len(data)} items from {source}")
    return data

@app.route('/api/export/json', methods=['GET'])
def export_json():
    """Export all data as JSON"""
    try:
        # Combine all data
        all_data = []
        for source in cache:
            for item in cache[source]['data']:
                item_copy = item.copy()
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
                item_copy = item.copy()
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
    print("🚀 Tender Scraper API Server")
    print("=" * 60)
    print("📦 Running with minimal dependencies (no pandas/numpy)")
    print("\n📡 Endpoints:")
    print("  GET /api/health - Health check")
    print("  GET /api/stats - Scraper statistics")
    print("  GET /api/scrape/all - Run all scrapers")
    print("  GET /api/scrape/bdjobs - Run BDJobs scraper")
    print("  GET /api/scrape/care - Run CARE scraper")
    print("  GET /api/scrape/pksf - Run PKSF scraper")
    print("  GET /api/data/bdjobs - Get cached BDJobs data")
    print("  GET /api/data/care - Get cached CARE data")
    print("  GET /api/data/pksf - Get cached PKSF data")
    print("  GET /api/export/json - Export all data as JSON")
    print("  GET /api/export/csv - Export all data as CSV")
    print("=" * 60)
    print("\n✅ Server starting on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
