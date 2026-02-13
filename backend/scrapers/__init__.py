## backend/scrapers/__init__.py
import sys
import io

# Fix console encoding for Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
from .bdjobs import BDJobsScraper
from .care import CareScraper
from .pksf import PKSFScraper

__all__ = ['BDJobsScraper', 'CareScraper', 'PKSFScraper']
