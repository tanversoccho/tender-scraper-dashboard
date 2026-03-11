# backend/scrapers/bdjobs.py

import requests
import re
import time
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime
from scrapers import register_scraper


@register_scraper('bdjobs', display_name='BD Jobs')
class BDJobsScraper:

    def __init__(self):
        self.url = "https://bdjobs.com/h/"
        self.headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept-Language": "en-US,en;q=0.9",
                }

    def get_deadline(self, tender_url):
        """Visit tender page and extract deadline"""
        try:
            resp = requests.get(tender_url, headers=self.headers, timeout=30)
            resp.raise_for_status()

            soup = BeautifulSoup(resp.text, "html.parser")

            text = soup.get_text(separator=" ", strip=True)

            date_patterns = [
                    r'\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4}',  # 10th March 2026
                    r'\w+,\s+\w+\s+\d{1,2},\s+\d{4}',          # Saturday, April 04, 2026
                    r'\d{1,2}/\d{1,2}/\d{4}',                  # 04/04/2026
                    ]

            for pattern in date_patterns:
                match = re.search(pattern, text)
                if match:
                    return match.group(0)

            return None

        except Exception as e:
            print(f"⚠️ Deadline scrape failed ({tender_url}): {e}")
            return None

    def scrape(self):
        """Scrape BDJobs tenders"""
        try:
            print("🔍 Scraping BDJobs...")

            resp = requests.get(self.url, headers=self.headers, timeout=30)
            resp.raise_for_status()

            soup = BeautifulSoup(resp.text, "html.parser")

            tenders = []

            # 🔹 Use tender cards (original logic)
            cards = soup.select("app-tender-card") or soup.select(".card") or soup.select("div[class*='tender']")

            for i, card in enumerate(cards):

                try:
                    # Organization
                    org_div = (
                            card.select_one('div[title]')
                            or card.select_one('.company-name')
                            or card.select_one('.organization')
                            )

                    organization = org_div.get_text(strip=True) if org_div else f"Organization {i+1}"

                    # Title + Link
                    a_tag = card.select_one("a[href]")
                    title = a_tag.get_text(strip=True) if a_tag else f"Tender {i+1}"

                    link = urljoin(self.url, a_tag["href"]) if a_tag else "#"

                    # Logo
                    img = card.select_one("img")

                    logo = None
                    if img and img.get("src"):
                        logo = img["src"]
                        if logo.startswith("//"):
                            logo = "https:" + logo

                    if not logo:
                        logo = "https://via.placeholder.com/60x60?text=BD"

                    # 🔹 Scrape deadline from inner page
                    deadline = None
                    if link != "#":
                        time.sleep(0.5)
                        deadline = self.get_deadline(link)

                    tenders.append({
                        "id": len(tenders) + 1,
                        "organization": organization,
                        "title": title,
                        "link": link,
                        "logo": logo,
                        "deadline": deadline,
                        "posted": datetime.now().strftime("%Y-%m-%d"),
                        "source": "bdjobs"
                        })

                except Exception as e:
                    print(f"⚠️ Error parsing tender card: {e}")
                    continue

            print(f"✅ Scraped {len(tenders)} tenders from BDJobs")

            return tenders

        except Exception as e:
            print(f"❌ Error scraping BDJobs: {e}")
            return []

    def get_sample_data(self):
        return []


if __name__ == "__main__":
    scraper = BDJobsScraper()
    results = scraper.scrape()

    for r in results:
        print(r)
