from . import register_scraper
import pandas as pd  # Add this import
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import re

@register_scraper('undp', display_name='UNDP')

class UNDPScraper:
    # Your existing UNDP scraper code...class UNDPScraper:
    def __init__(self):
        # Clean URL without tracking parameters
        self.base_url = "https://procurement-notices.undp.org"
        self.url = f"{self.base_url}/"
        self.headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                }

    def scrape(self, max_items=50):
        """Scrape UNDP procurement notices"""
        print("🔍 Scraping UNDP procurement notices...")

        try:
            response = requests.get(self.url, headers=self.headers, timeout=30)

            if response.status_code != 200:
                print(f"❌ Failed with status: {response.status_code}")
                return []

            soup = BeautifulSoup(response.content, 'html.parser')

            # Find all procurement items
            # They are in <a> tags with class "vacanciesTableLink"
            items = soup.find_all('a', class_='vacanciesTableLink')

            print(f"Found {len(items)} total items (including hidden ones)")

            # Filter to only visible items (some are hidden by default)
            visible_items = []
            for item in items:
                style = item.get('style', '')
                if 'display: none' not in style:
                    visible_items.append(item)

            print(f"Found {len(visible_items)} visible items")

            notices = []

            for item in visible_items[:max_items]:
                try:
                    # Extract data from each cell
                    cells = item.find_all('div', class_='vacanciesTable__cell')

                    if len(cells) >= 6:
                        # Title
                        title = cells[0].find('span').text.strip() if cells[0].find('span') else cells[0].text.strip()

                        # Reference number
                        ref_no = cells[1].find('span').text.strip() if cells[1].find('span') else cells[1].text.strip()

                        # Country/Office
                        country = cells[2].find('span').text.strip() if cells[2].find('span') else cells[2].text.strip()
                        # Clean up country (remove extra whitespace and line breaks)
                        country = re.sub(r'\s+', ' ', country).strip()

                        # Process type
                        process = cells[3].find('span').text.strip() if cells[3].find('span') else cells[3].text.strip()

                        # Deadline
                        deadline_elem = cells[4].find('span')
                        if deadline_elem:
                            deadline = deadline_elem.text.strip()
                            # Remove <nobr> tags and clean up
                            deadline = re.sub(r'<[^>]+>', '', deadline)
                            deadline = re.sub(r'\s+', ' ', deadline).strip()
                        else:
                            deadline = cells[4].text.strip()

                        # Posted date
                        posted = cells[5].find('span').text.strip() if cells[5].find('span') else cells[5].text.strip()
                        posted = re.sub(r'<[^>]+>', '', posted)

                        # Get detail link
                        detail_link = self.base_url + '/' + item.get('href', '') if item.get('href') else ''

                        # Extract country code and region from data attributes
                        country_code = item.get('data-region', '')

                        notice = {
                                'id': len(notices) + 1,
                                'title': title,
                                'ref_no': ref_no,
                                'country': country,
                                'country_code': country_code,
                                'process_type': process,
                                'deadline': deadline,
                                'posted_date': posted,
                                'detail_url': detail_link,
                                'source': 'undp',
                                'scraped_at': datetime.now().isoformat()
                                }

                        notices.append(notice)
                        print(f"  ✅ Added: {title[:50]}...")

                except Exception as e:
                    print(f"  ❌ Error parsing item: {e}")
                    continue

            # Filter for Bangladesh if desired
            bangladesh_notices = [n for n in notices if 'BANGLADESH' in n['country'].upper()]

            print(f"\n📊 Total notices scraped: {len(notices)}")
            print(f"📊 Bangladesh notices: {len(bangladesh_notices)}")

            if not notices:
                return []

            return notices

        except Exception as e:
            print(f"❌ Error scraping UNDP: {e}")
            return []

    def get_sample_data(self):
        """Return sample UNDP data"""
        return []

    def filter_by_country(self, notices, country="Bangladesh"):
        """Filter notices by country"""
        return [n for n in notices if country.upper() in n['country'].upper()]

    def save_to_csv(self, notices, filename="undp_notices.csv"):
        """Save to CSV"""
        if not notices:
            print("No data to save")
            return

        df = pd.DataFrame(notices)
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        print(f"✅ Saved {len(df)} notices to {filename}")
        return df

# For testing
if __name__ == "__main__":
    scraper = UNDPScraper()
    notices = scraper.scrape(max_items=30)

    if notices:
        # Show all notices
        print(f"\n📋 Sample notices (first 5):")
        for i, n in enumerate(notices[:5]):
            print(f"{i+1}. {n['title'][:50]}...")
            print(f"   Ref: {n['ref_no']}, Country: {n['country']}")
            print(f"   Deadline: {n['deadline']}")
            print()

        # Filter for Bangladesh
        bd_notices = scraper.filter_by_country(notices, "Bangladesh")
        print(f"\n🇧🇩 Bangladesh-specific notices: {len(bd_notices)}")
        for n in bd_notices:
            print(f"  • {n['title']}")

        # Save to file
        scraper.save_to_csv(notices)
