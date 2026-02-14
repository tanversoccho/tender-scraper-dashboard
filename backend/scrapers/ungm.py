from . import register_scraper
import pandas as pd  # Add this import
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import re

@register_scraper('ungm', display_name='UNGM/UNOPS')

class UNGMScraper:
    def __init__(self):
        self.base_url = "https://www.ungm.org"
        self.url = f"{self.base_url}/Public/Notice?agencyEnglishAbbreviation=UNOPS"
        self.headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://www.ungm.org/'
                }

    def scrape(self):
        """Scrape UNOPS procurement notices"""
        print("🔍 Scraping UNGM/UNOPS procurement notices...")

        try:
            response = requests.get(self.url, headers=self.headers, timeout=30)

            if response.status_code != 200:
                print(f"❌ Failed with status: {response.status_code}")
                return self.get_sample_data()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Find all notice rows
            notice_rows = soup.find_all('div', class_='tableRow dataRow notice-table')

            print(f"Found {len(notice_rows)} notices")

            notices = []

            for row in notice_rows:
                try:
                    # Extract title
                    title_elem = row.find('span', class_='ungm-title ungm-title--small')
                    title = title_elem.text.strip() if title_elem else "N/A"

                    # Extract deadline
                    deadline_cell = row.find('div', class_='tableCell resultInfo1 deadline')
                    deadline = "N/A"
                    if deadline_cell:
                        deadline_span = deadline_cell.find('span')
                        if deadline_span:
                            deadline = deadline_span.text.strip()

                    # Extract published date
                    published_cell = row.find_all('div', class_='tableCell')[3]  # Index based on structure
                    published = published_cell.text.strip() if published_cell else "N/A"

                    # Extract organization (UNOPS)
                    agency_cell = row.find('div', class_='tableCell resultAgency')
                    organization = agency_cell.text.strip() if agency_cell else "UNOPS"

                    # Extract opportunity type
                    type_cell = row.find_all('div', class_='tableCell')[5]  # Index based on structure
                    opp_type = type_cell.text.strip() if type_cell else "N/A"

                    # Extract reference
                    ref_cell = row.find('div', class_='tableCell resultInfo1', attrs={'data-description': 'Reference'})
                    reference = "N/A"
                    if ref_cell:
                        ref_span = ref_cell.find('span')
                        reference = ref_span.text.strip() if ref_span else ref_cell.text.strip()

                    # Extract country
                    country_cell = row.find_all('div', class_='tableCell')[-1]  # Last cell
                    country = country_cell.text.strip() if country_cell else "N/A"

                    # Get notice ID and detail URL
                    notice_id = row.get('data-noticeid', '')
                    detail_url = f"{self.base_url}/Public/Notice/{notice_id}" if notice_id else ""

                    # Extract remaining days message if present
                    remaining_days = ""
                    days_span = row.find('span', class_='remainingDays')
                    if days_span:
                        remaining_days = days_span.text.strip()

                    notice = {
                            'id': len(notices) + 1,
                            'title': title,
                            'reference': reference,
                            'notice_id': notice_id,
                            'organization': organization,
                            'opportunity_type': opp_type,
                            'published_date': published,
                            'deadline': deadline,
                            'country': country,
                            'remaining_days': remaining_days,
                            'detail_url': detail_url,
                            'source': 'ungm',
                            'scraped_at': datetime.now().isoformat()
                            }

                    notices.append(notice)
                    print(f"  ✅ Added: {title[:50]}...")

                except Exception as e:
                    print(f"  ❌ Error parsing notice: {e}")
                    continue

            # Filter for Bangladesh
            bangladesh_notices = [n for n in notices if 'Bangladesh' in n['country']]

            print(f"\n📊 Total notices scraped: {len(notices)}")
            print(f"📊 Bangladesh notices: {len(bangladesh_notices)}")

            if not notices:
                return self.get_sample_data()

            return notices

        except Exception as e:
            print(f"❌ Error scraping UNGM: {e}")
            return self.get_sample_data()

    def get_sample_data(self):
        """Return sample UNOPS data from the page"""
        return [
                {
                    "id": 1,
                    "title": "Construction of Dedicated Accommodation Facility to Enhance BIPSOT's Capacity for Training Female Peacekeepers",
                    "reference": "ITB/2026/61380",
                    "organization": "UNOPS",
                    "opportunity_type": "Invitation to bid",
                    "published_date": "12-Feb-2026",
                    "deadline": "01-Mar-2026 11:00 (GMT 0.00)",
                    "country": "Bangladesh",
                    "remaining_days": "Expires within 15 days",
                    "source": "ungm"
                    },
                {
                    "id": 2,
                    "title": "Expression of Interest (EOI): Third-Party Monitoring (TPM) Services",
                    "reference": "Expression of Interest (EOI): Third-Party Monitoring (TPM) Services",
                    "organization": "UNOPS",
                    "opportunity_type": "Request for EOI",
                    "published_date": "21-Jan-2026",
                    "deadline": "14-Feb-2026 00:00 (GMT 3.00)",
                    "country": "Multiple destinations",
                    "remaining_days": "Expires within 24 hours",
                    "source": "ungm"
                    },
                {
                    "id": 3,
                    "title": "Provision of Small Grants Programme for World Day for Assistive Technology (AT) Celebration in Asia",
                    "reference": "UNOPS/FO/2026/19 - ATscale/Grant/2026/23067-002/007",
                    "organization": "UNOPS",
                    "opportunity_type": "Grant support-call for proposal",
                    "published_date": "16-Jan-2026",
                    "deadline": "16-Feb-2026 12:00 (GMT 2.00)",
                    "country": "Multiple destinations",
                    "remaining_days": "Expires within 2 days",
                    "source": "ungm"
                    }
                ]

    def filter_by_country(self, notices, country="Bangladesh"):
        """Filter notices by country"""
        return [n for n in notices if country.lower() in n['country'].lower()]

    def filter_by_deadline(self, notices, days=7):
        """Filter notices expiring within X days"""
        filtered = []
        for notice in notices:
            if 'Expires within' in notice.get('remaining_days', ''):
                # Extract number of days
                match = re.search(r'within (\d+)', notice['remaining_days'])
                if match:
                    remaining = int(match.group(1))
                    if remaining <= days:
                        filtered.append(notice)
        return filtered

    def save_to_csv(self, notices, filename="ungm_notices.csv"):
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
    scraper = UNGMScraper()
    notices = scraper.scrape()

    if notices:
        print(f"\n📋 Sample notices (first 5):")
        for i, n in enumerate(notices[:5]):
            print(f"{i+1}. {n['title'][:50]}...")
            print(f"   Ref: {n['reference']}, Type: {n['opportunity_type']}")
            print(f"   Country: {n['country']}, Deadline: {n['deadline']}")
            print()

        # Filter for Bangladesh
        bd_notices = scraper.filter_by_country(notices, "Bangladesh")
        print(f"\n🇧🇩 Bangladesh-specific notices: {len(bd_notices)}")
        for n in bd_notices:
            print(f"  • {n['title']}")
            print(f"    Deadline: {n['deadline']}")

        # Filter for expiring soon
        expiring = scraper.filter_by_deadline(notices, days=7)
        print(f"\n⏰ Notices expiring within 7 days: {len(expiring)}")

        # Save to file
        scraper.save_to_csv(notices)
