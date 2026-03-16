from flask import Blueprint, request, jsonify, send_file
from datetime import datetime
import os

from scrapers import get_all_scrapers, discover_scrapers
from services.tor_filter import ToRFilter
from services.memory_tracker import MemoryTracker
from services.daily_reporter import DailyReporter
from services.excel_exporter import ExcelExporter

tor_bp = Blueprint('tor', __name__, url_prefix='/api/tor')

# Initialize services
tor_filter = ToRFilter()
memory_tracker = MemoryTracker()
daily_reporter = DailyReporter(memory_tracker)
excel_exporter = ExcelExporter()


@tor_bp.route('/scan', methods=['POST'])
def scan_all_sources():
    """Run all scrapers and filter for ToR opportunities"""
    try:
        # Discover and run all scrapers
        scrapers = get_all_scrapers()
        all_notices = []

        for name, info in scrapers.items():
            try:
                scraper_class = info['class']
                scraper = scraper_class()
                notices = scraper.scrape()
                all_notices.extend(notices)
                print(f"✅ {info['display_name']}: {len(notices)} items")
            except Exception as e:
                print(f"❌ Error with {name}: {e}")

        # Apply ToR filters
        filtered_notices = tor_filter.filter_notices(all_notices)

        # Check for new items
        new_notices = memory_tracker.get_new_notices(filtered_notices)

        return jsonify({
            'success': True,
            'total': len(filtered_notices),
            'new': len(new_notices),
            'new_notices': new_notices[:50],  # Limit response size
            'all_notices': filtered_notices[:100],
            'sites_scanned': len(scrapers)
            })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@tor_bp.route('/daily-digest', methods=['GET'])
def get_daily_digest():
    """Get today's digest report"""
    try:
        # Get today's new notices from memory
        todays_notices = memory_tracker.get_todays_new()

        # Get all scrapers for count
        scrapers = get_all_scrapers()

        # Generate report
        report = daily_reporter.generate_digest(todays_notices, len(scrapers))

        return jsonify({
            'success': True,
            'report': report,
            'count': len(todays_notices),
            'date': datetime.now().isoformat()
            })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@tor_bp.route('/export', methods=['POST'])
def export_to_excel():
    """Export filtered notices to Excel"""
    try:
        data = request.json
        notices = data.get('notices', [])

        if not notices:
            return jsonify({'success': False, 'error': 'No data to export'}), 400

        filename = excel_exporter.export_to_excel(notices)

        if filename and os.path.exists(filename):
            return send_file(
                    filename,
                    as_attachment=True,
                    download_name=f"Bangladesh_ToR_Report_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx",
                    mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    )
        else:
            return jsonify({'success': False, 'error': 'Failed to create file'}), 500

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@tor_bp.route('/memory/clear', methods=['POST'])
def clear_memory():
    """Clear memory (for testing)"""
    try:
        memory_tracker.clear_memory()
        return jsonify({'success': True, 'message': 'Memory cleared'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@tor_bp.route('/memory/stats', methods=['GET'])
def get_memory_stats():
    """Get memory statistics"""
    try:
        total_seen = len(memory_tracker.seen_links)
        todays_new = len(memory_tracker.get_todays_new())

        return jsonify({
            'success': True,
            'total_seen': total_seen,
            'todays_new': todays_new
            })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
