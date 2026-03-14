import requests
from bs4 import BeautifulSoup
from datetime import datetime
from . import register_scraper


@register_scraper('pksf', display_name='PKSF')
class PKSFScraper:

    def __init__(self):
        self.url = "https://pksf.org.bd/tender/"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }

    def scrape(self):
        """Scrape PKSF tender table"""
        try:
            print("🔍 Scraping PKSF tenders...")

            res = requests.get(self.url, headers=self.headers, timeout=30)
            res.raise_for_status()

            soup = BeautifulSoup(res.text, "html.parser")

            table = soup.select_one(".tender-table")

            if not table:
                print("⚠️ Tender table not found")
                return []

            rows = table.select("tbody tr")

            results = []

            for row in rows:
                try:
                    cols = row.find_all("td")

                    if len(cols) < 6:
                        continue

                    sl = cols[0].get_text(strip=True)
                    ref = cols[1].get_text(strip=True)

                    title_tag = cols[2].select_one("strong")
                    title = title_tag.get_text(strip=True) if title_tag else cols[2].get_text(strip=True)

                    pub_date = cols[3].get_text(strip=True)
                    closing_date = cols[4].get_text(strip=True)

                    link_tag = cols[5].select_one("a")
                    link = link_tag["href"] if link_tag else "#"

                    results.append({
                        "id": int(sl),
                        "ref_no": ref,
                        "title": title,
                        "publication_date": pub_date,
                        "deadline": closing_date,
                        "link": link,
                        "source": "pksf",
                        "scraped_at": datetime.now().isoformat()
                    })

                except Exception as e:
                    print(f"⚠️ Error parsing row: {e}")
                    continue

            print(f"✅ Scraped {len(results)} tenders from PKSF")

            return results

        except Exception as e:
            print(f"❌ Error scraping PKSF: {e}")
            return []

    def get_sample_data(self):
        return []


# Standalone test
if __name__ == "__main__":
    scraper = PKSFScraper()
    data = scraper.scrape()

    for d in data:
        print(d)
