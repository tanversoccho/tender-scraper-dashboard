import cloudscraper
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urljoin
import time
import random
from . import register_scraper  # Add this import


@register_scraper('adb', display_name='ADB')  # Add this decorator
class ADBScraper:
    def __init__(self):
        self.base_url = "https://www.adb.org"
        self.country_url = f"{self.base_url}/projects/country/bangladesh"

        # Configure cloudscraper with optimal settings
        self.scraper = cloudscraper.create_scraper(
                browser={
                    'browser': 'chrome',
                    'platform': 'windows',
                    'desktop': True,
                    'mobile': False
                    },
                delay=15,  # Explicit delay for Cloudflare challenges [citation:4]
                interpreter='js2py'  # or 'nodejs' if you have Node installed
                )

        # Add realistic headers
        self.scraper.headers.update({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
            })

    def scrape(self):
        """Scrape ADB Bangladesh projects"""
        try:
            print("🔍 Scraping ADB Bangladesh projects...")
            print("⏳ Waiting for bot check to complete (this may take 5-10 seconds)...")

            # cloudscraper automatically handles the waiting
            response = self.scraper.get(self.country_url, timeout=60)

            if response.status_code != 200:
                print(f"⚠️ Failed with status: {response.status_code}")
                print(f"Response URL: {response.url}")
                return self._get_sample_data()

            # Parse with BeautifulSoup
            soup = BeautifulSoup(response.content, 'html.parser')

            # Save debug HTML
            with open('adb_debug.html', 'w', encoding='utf-8') as f:
                f.write(str(soup))
            print("📄 Saved debug HTML to adb_debug.html")

            # Extract projects
            projects = self._extract_projects(soup)

            if projects:
                print(f"✅ Scraped {len(projects)} projects from ADB")
                return projects
            else:
                print("⚠️ No projects found. Check adb_debug.html to see the page structure.")
                return self._get_sample_data()

        except Exception as e:
            print(f"❌ Error scraping ADB: {e}")
            import traceback
            traceback.print_exc()
            return self._get_sample_data()

    def _extract_projects(self, soup):
        """Extract projects from parsed HTML"""
        projects = []

        # Try multiple selectors for project items
        selectors = [
                '.project-item',
                '.views-row',
                '.listing-projects article',
                '.project-listing-item',
                '.field--name-field-projects .item'
                ]

        project_items = []
        for selector in selectors:
            project_items = soup.select(selector)
            if project_items:
                print(f"Found {len(project_items)} items with selector: {selector}")
                break

        # If no items found with CSS selectors, try looking for links
        if not project_items:
            project_links = soup.find_all('a', href=lambda x: x and '/projects/' in x)
            print(f"Found {len(project_links)} project links")

            # Group by parent to avoid duplicates
            seen = set()
            for link in project_links:
                parent = link.find_parent(['div', 'li', 'article'])
                if parent and parent not in seen:
                    seen.add(parent)
                    project_items.append(parent)

        for i, item in enumerate(project_items[:20], 1):
            try:
                project = self._parse_project(item, i)
                if project:
                    projects.append(project)
                    print(f"  ✅ Added: {project['title'][:50]}...")
            except Exception as e:
                print(f"Error parsing item {i}: {e}")
                continue

        return projects

    def _parse_project(self, item, index):
        """Parse a single project item"""
        # Find title and link
        title_elem = item.find('a', href=lambda x: x and '/projects/' in x)
        if not title_elem:
            title_elem = item.select_one('h3 a, h2 a, .title a')

        if not title_elem:
            return None

        title = title_elem.text.strip()
        project_url = urljoin(self.base_url, title_elem.get('href', ''))

        # Extract project ID from URL
        project_id = ""
        if '/projects/' in project_url:
            # Extract ID pattern like 12345-678
            import re
            match = re.search(r'/projects/(\d+[-]\d+)', project_url)
            if match:
                project_id = match.group(1)

        # Get status if available
        status_elem = item.select_one('.project-status, .status, .field--name-field-status')
        status = status_elem.text.strip() if status_elem else "Active"

        # Get sector/category
        sector_elem = item.select_one('.sector, .field--name-field-sector, .category')
        sector = sector_elem.text.strip() if sector_elem else ""

        # Get description/summary
        summary_elem = item.select_one('.summary, .description, p')
        summary = summary_elem.text.strip() if summary_elem else ""

        return {
                "id": index,
                "title": title,
                "project_id": project_id,
                "status": status,
                "sector": sector,
                "url": project_url,
                "summary": summary[:200] + "..." if len(summary) > 200 else summary,
                "source": "adb",
                "scraped_at": datetime.now().isoformat()
                }

    def _get_sample_data(self):
        """Return sample data if scraping fails"""
        return [
                {
                    "id": 1,
                    "title": "Third Urban Governance and Infrastructure Improvement Project",
                    "project_id": "12345-678",
                    "status": "Active",
                    "sector": "Urban Development",
                    "url": "https://www.adb.org/projects/12345-678/main",
                    "summary": "Sample project for testing",
                    "source": "adb",
                    "scraped_at": datetime.now().isoformat()
                    }
                ]


if __name__ == "__main__":
    scraper = ADBScraper()
    results = scraper.scrape()
    print(f"\n📊 Total projects: {len(results)}")
