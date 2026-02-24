from bs4 import BeautifulSoup
from datetime import datetime
import cloudscraper
from urllib.parse import urljoin

class ADBScraper:
    def __init__(self):
        self.base_url = "https://www.adb.org"
        self.country_url = f"{self.base_url}/projects/country/bangladesh"
        self.scraper = cloudscraper.create_scraper()

    def scrape(self):
        """Scrape ADB Bangladesh projects"""
        try:
            print("🔍 Scraping ADB Bangladesh...")

            response = self.scraper.get(self.country_url, timeout=30)

            if response.status_code != 200:
                print(f"⚠️ Failed with status: {response.status_code}")
                return []

            soup = BeautifulSoup(response.content, 'html.parser')

            # Find project items
            project_divs = (
                    soup.select('.list .item.linked') or
                    soup.select('.project-item') or
                    soup.select('.views-row')
                    )

            projects = []

            for i, div in enumerate(project_divs[:10]):  # Limit to 10
                try:
                    # Title
                    title_elem = div.select_one('.item-title a')
                    if not title_elem:
                        continue

                    title = title_elem.text.strip()
                    project_url = urljoin(self.base_url, title_elem.get('href', ''))

                    # Summary
                    summary_elem = div.select_one('.item-summary')
                    summary = summary_elem.text.strip() if summary_elem else ""

                    # Parse summary for ID and sector
                    project_id = ""
                    sector = ""
                    if ";" in summary:
                        parts = [p.strip() for p in summary.split(";")]
                        project_id = parts[0] if len(parts) > 0 else ""
                        sector = parts[2] if len(parts) > 2 else ""

                    # Status
                    status_elem = div.select_one('.item-meta span')
                    status = status_elem.text.strip() if status_elem else "Active"

                    # Approval date
                    approval_date = ""
                    meta_divs = div.select('.item-meta div')
                    for meta in meta_divs:
                        text = meta.text.strip()
                        if 'Approval Date:' in text:
                            approval_date = text.replace('Approval Date:', '').strip()
                            break
                        elif 'Approval Year:' in text:
                            approval_date = text.replace('Approval Year:', '').strip()
                            break

                    projects.append({
                        "id": len(projects) + 1,
                        "title": title,
                        "project_id": project_id,
                        "status": status,
                        "approval_date": approval_date,
                        "sector": sector,
                        "url": project_url,
                        "summary": summary,
                        "source": "adb",
                        "scraped_at": datetime.now().isoformat()
                        })

                except Exception as e:
                    print(f"Error parsing ADB project: {e}")
                    continue

            if not projects:
                return []

            print(f"✅ Scraped {len(projects)} projects from ADB")
            return projects

        except Exception as e:
            print(f"❌ Error scraping ADB: {e}")
            return self.get_sample_data()

    def get_sample_data(self):
        """Return sample data if scraping fails"""
        return []

# For direct testing
if __name__ == "__main__":
    scraper = ADBScraper()
    results = scraper.scrape()
    print(f"Total projects scraped: {len(results)}")
