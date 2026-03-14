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
            "User-Agent": "Mozilla/5.0",
            "Referer": self.base_url,
        }

    # ==============================
    # MAIN ENTRY
    # ==============================
    def scrape(self):
        """Scrape BPPA tender notices"""
        print("🔍 Scraping BPPA tender notices...")

        content_div = self._fetch_content()
        if not content_div:
            return []

        rows = self._extract_rows(content_div)
        if not rows:
            return []

        tenders = self._parse_rows(rows)

        self._print_pagination(content_div)

        print(f"✅ Scraped {len(tenders)} tenders from BPPA")
        return tenders

    # ==============================
    # FETCH PAGE
    # ==============================
    def _fetch_content(self):
        try:
            response = requests.get(self.url, headers=self.headers, timeout=30)
            response.raise_for_status()
        except requests.RequestException as e:
            print(f"❌ Request failed: {e}")
            return None

        soup = BeautifulSoup(response.content, "html.parser")

        content_div = (
            soup.select_one("div#bodyContent")
            or soup.select_one(".content")
        )

        if not content_div:
            print("⚠️ Content div not found")
            return None

        return content_div

    # ==============================
    # EXTRACT TABLE ROWS
    # ==============================
    def _extract_rows(self, content_div):
        table = content_div.find("table")
        if not table:
            print("⚠️ Table not found")
            return []

        tbody = table.find("tbody")
        if not tbody:
            print("⚠️ Table body not found")
            return []

        rows = tbody.find_all("tr")
        print(f"Found {len(rows)} tender notices")
        return rows

    # ==============================
    # PARSE ALL ROWS
    # ==============================
    def _parse_rows(self, rows):
        tenders = []

        for row in rows:
            tender = self._parse_single_row(row, len(tenders) + 1)
            if tender:
                tenders.append(tender)
                print(f"  ✅ Added: {tender['title'][:50]}...")

        return tenders

    # ==============================
    # PARSE ONE ROW
    # ==============================
    def _parse_single_row(self, row, tender_id):
        cells = row.find_all("td")
        if len(cells) < 6:
            return None

        title, detail_url, reference = self._parse_title_cell(cells[1])

        closing_lines = (
            cells[4].get_text(separator="\n").strip().split("\n")
        )

        return {
            "id": tender_id,
            "sl_no": cells[0].get_text(strip=True),
            "title": title,
            "reference_no": reference,
            "procuring_entity": cells[2].get_text(strip=True),
            "publication_date": cells[3].get_text(strip=True),
            "closing_date": closing_lines[0] if closing_lines else "",
            "closing_time": closing_lines[1] if len(closing_lines) > 1 else "",
            "place": cells[5].get_text(strip=True),
            "detail_url": detail_url,
            "source": "bppa",
            "scraped_at": datetime.now().isoformat(),
        }

    # ==============================
    # PARSE TITLE CELL
    # ==============================
    def _parse_title_cell(self, cell):
        link = cell.find("a")

        if not link:
            return cell.get_text(strip=True), "", ""

        title = link.get_text(strip=True)
        detail_url = urljoin(self.base_url, link.get("href", ""))

        reference = ""
        br = cell.find("br")

        if br and br.next_sibling:
            reference = str(br.next_sibling).strip()
        else:
            parts = cell.get_text(separator="\n").split("\n")
            if len(parts) > 1:
                reference = parts[1].strip()

        return title, detail_url, reference

    # ==============================
    # PAGINATION INFO
    # ==============================
    def _print_pagination(self, content_div):
        pagination_div = content_div.find("div", class_="col-md-12")
        if not pagination_div:
            return

        text = pagination_div.get_text()
        if "of" in text:
            total = text.split("of")[-1].strip()
            print(f"📊 Total available notices: {total}")

    # ==============================
    # UTILITIES
    # ==============================
    def parse_date(self, date_str):
        """Parse DD/MM/YYYY format"""
        try:
            return datetime.strptime(date_str, "%d/%m/%Y").date().isoformat()
        except ValueError:
            return date_str

    def filter_by_place(self, tenders, place="Dhaka"):
        return [t for t in tenders if place.lower() in t["place"].lower()]

    def filter_by_date_range(self, tenders, start_date=None, end_date=None):
        if not start_date and not end_date:
            return tenders

        filtered = []
        for t in tenders:
            pub_date = self.parse_date(t["publication_date"])
            if pub_date:
                filtered.append(t)

        return filtered


# ==============================
# TEST BLOCK
# ==============================
if __name__ == "__main__":
    scraper = BPPAScraper()
    results = scraper.scrape()

    if results:
        print("\n📋 Sample tenders (first 5):")
        for i, t in enumerate(results[:5], 1):
            print(f"{i}. {t['title'][:50]}...")
            print(f"   Ref: {t['reference_no']}")
            print(f"   Entity: {t['procuring_entity']}")
            print(f"   Closing: {t['closing_date']} {t['closing_time']}")
            print(f"   Place: {t['place']}\n")

        print(f"🇧🇩 Tenders in Dhaka: {len(scraper.filter_by_place(results, 'Dhaka'))}")
        print(f"🇧🇩 Tenders in Chattogram: {len(scraper.filter_by_place(results, 'Chattogram'))}")
