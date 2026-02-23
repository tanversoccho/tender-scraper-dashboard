import sys
import io
import importlib
import os
import inspect

# Fix console encoding for Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Scraper registry
SCRAPERS = {}

def register_scraper(name, display_name=None):
    """Decorator to register a scraper"""
    def decorator(scraper_class):
        SCRAPERS[name] = {
                'class': scraper_class,
                'display_name': display_name or name.capitalize(),
                'module': scraper_class.__module__
                }
        return scraper_class
    return decorator

def discover_scrapers():
    """Automatically discover and import all scraper modules"""
    scrapers_dir = os.path.dirname(__file__)

    for filename in os.listdir(scrapers_dir):
        if filename.endswith('.py') and not filename.startswith('__'):
            module_name = filename[:-3]
            try:
                importlib.import_module(f'scrapers.{module_name}')
            except Exception as e:
                print(f"Error loading scraper {module_name}: {e}")

    return SCRAPERS

def get_scraper(name):
    """Get scraper class by name"""
    if name in SCRAPERS:
        return SCRAPERS[name]['class']
    return None

def get_all_scrapers():
    """Get all registered scrapers with metadata"""
    return {name: {
        'display_name': info['display_name'],
        'name': name
        } for name, info in SCRAPERS.items()}

# Auto-discover scrapers when module is imported
discover_scrapers()
