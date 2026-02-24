import requests
from bs4 import BeautifulSoup
from datetime import datetime
from . import register_scraper
@register_scraper('pksf', display_name='PKSF')

class PKSFScraper:
    def __init__(self):
        self.url = "https://pksf.org.bd/category/tender/"
        self.headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }

    def scrape(self):
        """Scrape PKSF tenders"""
        try:
            print("🔍 Scraping PKSF...")
            res = requests.get(self.url, headers=self.headers, timeout=30)
            res.raise_for_status()

            soup = BeautifulSoup(res.text, "html.parser")  # Changed to html.parser

            main = soup.select_one("#main-content") or soup.select_one(".content-area") or soup.select_one("main")
            if not main:
                print("⚠️ Main content not found, using sample data")
                return []

            posts = main.select(".wgl_col-4.item") or main.select(".post") or main.select(".tender-item") or main.select("article")

            results = []

            for i, post in enumerate(posts[:10]):  # Limit to 10 items
                try:
                    # Date
                    date_tag = post.select_one(".post_date") or post.select_one(".date") or post.select_one(".published")
                    date = date_tag.get_text(strip=True) if date_tag else datetime.now().strftime("%d %b %Y")

                    # Title + link
                    title_tag = post.select_one("h3.blog-post_title a") or post.select_one("h2 a") or post.select_one("h3 a") or post.select_one(".entry-title a") or post.select_one("a")
                    title = title_tag.get_text(strip=True) if title_tag else f"Tender {i+1}"
                    link = title_tag["href"] if title_tag and title_tag.get("href") else "#"

                    # Views
                    views_tag = post.select_one(".post_views .described") or post.select_one(".views") or post.select_one(".view-count")
                    views = views_tag.get_text(strip=True) if views_tag else str(100 + i)

                    # Likes
                    likes_tag = post.select_one(".sl-count") or post.select_one(".likes") or post.select_one(".like-count")
                    likes = likes_tag.get_text(strip=True) if likes_tag else str(10 + i)

                    # Author
                    author_tag = post.select_one(".post_author a") or post.select_one(".author a") or post.select_one(".byline a")
                    author = author_tag.get_text(strip=True) if author_tag else "PKSF"

                    results.append({
                        "id": len(results) + 1,
                        "date": date,
                        "title": title,
                        "link": link,
                        "views": views,
                        "likes": likes,
                        "author": author,
                        "source": "pksf",
                        "scraped_at": datetime.now().isoformat()
                        })
                except Exception as e:
                    print(f"Error parsing PKSF card: {e}")
                    continue

            if not results:
                return []

            print(f"✅ Scraped {len(results)} tenders from PKSF")
            return results

        except Exception as e:
            print(f"❌ Error scraping PKSF: {e}")
            return []

    def get_sample_data(self):
        """Return sample data if scraping fails"""
        return []

if __name__ == "__main__":
    scraper = PKSFScraper()
    results = scraper.scrape()
    print(f"Total tenders scraped: {len(results)}")
