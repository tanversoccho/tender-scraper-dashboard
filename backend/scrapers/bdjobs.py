# backend/scrapers/bdjobs.py
import requests
import re
import time
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime

# Import the project's register_scraper (adjust path if needed)
from scrapers import register_scraper

@register_scraper('bdjobs', display_name='BD Jobs')
class BDJobsScraper:

    def __init__(self):
        self.url = "https://bdjobs.com/h/"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }

    def get_deadline(self, job_url):
        """Scrape only the actual deadline date from the job page"""
        try:
            resp = requests.get(job_url, headers=self.headers, timeout=30)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            # Get all text and search for date patterns
            text = soup.get_text(separator=" ", strip=True)

            # Match common BDJobs date formats
            date_patterns = [
                r'\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4}',  # 10th March 2026
                r'\w+,\s+\w+\s+\d{1,2},\s+\d{4}',           # Saturday, April 04, 2026
                r'\d{1,2}/\d{1,2}/\d{4}',                   # 04/04/2026
            ]

            for pattern in date_patterns:
                match = re.search(pattern, text)
                if match:
                    return match.group(0)

            return None
        except Exception as e:
            print(f"⚠️ Deadline scrape failed ({job_url}): {e}")
            return None

    def scrape(self):
        """Scrape BDJobs tenders"""
        try:
            print("🔍 Scraping BDJobs...")
            resp = requests.get(self.url, headers=self.headers, timeout=30)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            tenders = []

            # Select job links (limit 10 for testing, remove limit later)
            job_links = soup.select("a[href*='/jobs/']")[:10]

            for i, a_tag in enumerate(job_links):
                try:
                    link = urljoin(self.url, a_tag["href"])
                    title = a_tag.get_text(strip=True) or f"Tender {i+1}"

                    # Default logo placeholder
                    logo = "https://via.placeholder.com/60x60?text=BD"

                    # Try to get company logo from <img> in the card
                    img_tag = a_tag.find("img")
                    if img_tag and img_tag.get("src"):
                        logo = img_tag["src"]
                        if logo.startswith("//"):
                            logo = "https:" + logo

                    # Try to get organization name
                    org_tag = a_tag.find_previous("div", class_="company-name")
                    organization = org_tag.get_text(strip=True) if org_tag else f"Organization {i+1}"

                    # Get deadline from job details page
                    time.sleep(0.5)  # polite delay
                    deadline = self.get_deadline(link)

                    tenders.append({
                        "id": i + 1,
                        "organization": organization,
                        "title": title,
                        "link": link,
                        "logo": logo,
                        "deadline": deadline,
                        "posted": datetime.now().strftime("%Y-%m-%d"),
                        "source": "bdjobs"
                    })

                except Exception as e:
                    print(f"⚠️ Error parsing BDJobs card: {e}")
                    continue

            print(f"✅ Scraped {len(tenders)} tenders from BDJobs")
            return tenders

        except Exception as e:
            print(f"❌ Error scraping BDJobs: {e}")
            return []

    def get_sample_data(self):
        """Return sample data if scraping fails"""
        return []

# Standalone test
if __name__ == "__main__":
    scraper = BDJobsScraper()
    results = scraper.scrape()
    for r in results:
        print(r)
