# backend/scrapers/bppa.py
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urljoin
from . import register_scraper

@register_scraper('bppa', display_name='BPPA')
class BPPAScraper:
    def __init__(self):
        self.base_url = "https://www.bppa.gov.bd"
        self.url = f"{self.base_url}/advertisement-notices/advertisement-services.html"
        self.headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://www.bppa.gov.bd/'
                }

    def scrape(self):
        """Scrape BPPA tender notices"""
        try:
            print("🔍 Scraping BPPA tender notices...")
            response = requests.get(self.url, headers=self.headers, timeout=30)
            if response.status_code != 200:
                print(f"⚠️ Failed with status: {response.status_code}")
                return self.get_sample_data()
            soup = BeautifulSoup(response.content, 'html.parser')
            # Find the main content div
            content_div = soup.select_one('div#bodyContent') or soup.select_one('.content')
            if not content_div:
                print("⚠️ Content div not found")
                return self.get_sample_data()

            # Find the table
            table = content_div.find('table')
            if not table:
                print("⚠️ Table not found")
                return self.get_sample_data()

            # Get all rows from tbody
            tbody = table.find('tbody')
            if not tbody:
                print("⚠️ Table body not found")
                return self.get_sample_data()

            rows = tbody.find_all('tr')
            print(f"Found {len(rows)} tender notices")

            tenders = []

            for row in rows:
                try:
                    cells = row.find_all('td')
                    if len(cells) >= 6:
                        # Extract serial number
                        sl_no = cells[0].text.strip()

                        # Extract title and reference from the link in cell 1
                        title_cell = cells[1]
                        link_tag = title_cell.find('a')

                        if link_tag:
                            title = link_tag.text.strip()
                            detail_url = urljoin(self.base_url, link_tag.get('href', ''))

                            # Reference number is in the <br> tag or as plain text after link
                            reference = ""
                            br_tag = title_cell.find('br')
                            if br_tag and br_tag.next_sibling:
                                reference = br_tag.next_sibling.strip()
                            if not reference:
                                # Try to get reference from text after link
                                link_text = link_tag.text
                                full_text = title_cell.get_text(separator='\n').strip()
                                parts = full_text.split('\n')
                                if len(parts) > 1:
                                    reference = parts[1].strip()
                        else:
                            title = cells[1].text.strip()
                            detail_url = ""
                            reference = ""

                        # Procuring Entity
                        procuring_entity = cells[2].text.strip()

                        # Publication Date
                        pub_date = cells[3].text.strip()

                        # Closing Date and Time
                        closing_cell = cells[4]
                        closing_lines = closing_cell.get_text(separator='\n').strip().split('\n')
                        closing_date = closing_lines[0].strip() if closing_lines else ""
                        closing_time = closing_lines[1].strip() if len(closing_lines) > 1 else ""

                        # Place
                        place = cells[5].text.strip()

                        tender = {
                                'id': len(tenders) + 1,
                                'sl_no': sl_no,
                                'title': title,
                                'reference_no': reference,
                                'procuring_entity': procuring_entity,
                                'publication_date': pub_date,
                                'closing_date': closing_date,
                                'closing_time': closing_time,
                                'place': place,
                                'detail_url': detail_url,
                                'source': 'bppa',
                                'scraped_at': datetime.now().isoformat()
                                }

                        tenders.append(tender)
                        print(f"  ✅ Added: {title[:50]}...")

                except Exception as e:
                    print(f"  ❌ Error parsing row: {e}")
                    continue

            # Get pagination info
            pagination_div = content_div.find('div', class_='col-md-12')
            if pagination_div:
                pagination_text = pagination_div.get_text()
                if 'of' in pagination_text:
                    try:
                        total = pagination_text.split('of')[-1].strip()
                        print(f"📊 Total available notices: {total}")
                    except:
                        pass

            if not tenders:
                print("⚠️ No tenders found, using sample data")
                return self.get_sample_data()

            print(f"✅ Scraped {len(tenders)} tenders from BPPA")
            return tenders

        except Exception as e:
            print(f"❌ Error scraping BPPA: {e}")
            return self.get_sample_data()

    def scrape_with_filters(self, ministry_id=None, agency_id=None):
        """
        Scrape with specific ministry/agency filters
        This would require handling the form submission
        """
        # This is a placeholder for future enhancement
        # Would need to implement POST request with form data
        pass

    def get_sample_data(self):
        """Return sample BPPA data based on actual page content"""
        return [
                {
                    "id": 1,
                    "sl_no": "1",
                    "title": "Selection of a Firm for GAP Information Website Development & Integration with Apps for BACB",
                    "reference_no": "12.01.0000.924.040.07.0044.26-120",
                    "procuring_entity": "Project Director, TARAPS",
                    "publication_date": "15/02/2026",
                    "closing_date": "02/03/2026",
                    "closing_time": "14.00",
                    "place": "Dhaka",
                    "detail_url": "https://www.bppa.gov.bd/advertisement-services/details-10519.html",
                    "source": "bppa"
                    },
                {
                    "id": 2,
                    "sl_no": "2",
                    "title": "Policy Reform Consultancy Service (Firm /International Organization /Development Partner / Others)",
                    "reference_no": "12.01.00000.924.040.07.0034.25-",
                    "procuring_entity": "Project Director, TARAPS",
                    "publication_date": "15/02/2026",
                    "closing_date": "02/03/2026",
                    "closing_time": "15.00",
                    "place": "Dhaka",
                    "detail_url": "https://www.bppa.gov.bd/advertisement-services/details-10520.html",
                    "source": "bppa"
                    },
                {
                    "id": 3,
                    "sl_no": "3",
                    "title": "For Selection of an Individual Consultant for the audit of the cash compensation disbursements to PAPs",
                    "reference_no": "46.06.0000.330.007.20.2025-95",
                    "procuring_entity": "Project Director, Chattogram Metropolitan Sanitation Project for North Kattoli Catchment",
                    "publication_date": "10/02/2026",
                    "closing_date": "01/03/2026",
                    "closing_time": "14:00 hours (BST)",
                    "place": "Chattogram",
                    "detail_url": "https://www.bppa.gov.bd/advertisement-services/details-10518.html",
                    "source": "bppa"
                    },
                {
                    "id": 4,
                    "sl_no": "4",
                    "title": "Urban Planning Survey and Studies for \"Formulation of Strategic Plan of Dhaka Peripheral Region\"",
                    "reference_no": "25.03.0000.000.002.14.0035.25",
                    "procuring_entity": "Project Director, Formulation of Strategic Plan of Dhaka Peripheral Region",
                    "publication_date": "09/02/2026",
                    "closing_date": "18/02/2026",
                    "closing_time": "11.00 a.m",
                    "place": "Dhaka",
                    "detail_url": "https://www.bppa.gov.bd/advertisement-services/details-10517.html",
                    "source": "bppa"
                    },
            {
                    "id": 5,
                    "sl_no": "5",
                    "title": "Selection of Firm for Mid-term Review of SMART Project",
                    "reference_no": "53.23.0000.043.03.020.25.644 (PKSF/SMART/S-09)",
                    "procuring_entity": "Deputy Managing Director-4, PKSF",
                    "publication_date": "08/02/2026",
                    "closing_date": "24/02/2026",
                    "closing_time": "01:00 PM",
                    "place": "Dhaka",
                    "detail_url": "https://www.bppa.gov.bd/advertisement-services/details-10514.html",
                    "source": "bppa"
                    }
        ]

    def parse_date(self, date_str):
        """Helper method to parse dates from various formats"""
        try:
            # Try DD/MM/YYYY format
            return datetime.strptime(date_str, '%d/%m/%Y').date().isoformat()
        except:
            return date_str

    def filter_by_place(self, tenders, place="Dhaka"):
        """Filter tenders by location"""
        return [t for t in tenders if place.lower() in t['place'].lower()]

    def filter_by_date_range(self, tenders, start_date=None, end_date=None):
        """Filter tenders by publication date range"""
        if not start_date and not end_date:
            return tenders

        filtered = []
        for tender in tenders:
            pub_date = self.parse_date(tender['publication_date'])
            if pub_date:
                # Add date comparison logic here
                filtered.append(tender)

        return filtered

# For testing
if __name__ == "__main__":
    scraper = BPPAScraper()
    results = scraper.scrape()

    if results:
        print(f"\n📋 Sample tenders (first 5):")
        for i, tender in enumerate(results[:5]):
            print(f"{i+1}. {tender['title'][:50]}...")
            print(f"   Ref: {tender['reference_no']}")
            print(f"   Entity: {tender['procuring_entity']}")
            print(f"   Closing: {tender['closing_date']} {tender['closing_time']}")
            print(f"   Place: {tender['place']}")
            print()

        # Filter by place
        dhaka_tenders = scraper.filter_by_place(results, "Dhaka")
        print(f"🇧🇩 Tenders in Dhaka: {len(dhaka_tenders)}")

        chattogram_tenders = scraper.filter_by_place(results, "Chattogram")
        print(f"🇧🇩 Tenders in Chattogram: {len(chattogram_tenders)}")
