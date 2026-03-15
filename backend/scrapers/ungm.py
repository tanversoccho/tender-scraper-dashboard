# ungm.py
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List, Dict, Any, Optional
import re
from . import register_scraper


@register_scraper('ungm', display_name='UNGM')
class UNGMScraper:
    """
    Scraper for United Nations Global Marketplace (UNGM) procurement notices.
    Requires login credentials.
    """

    def __init__(self, username=None, password=None):
        self.base_url = "https://www.ungm.org"
        self.login_url = f"{self.base_url}/Login/UNGMAccount/Login"
        self.notice_url = f"{self.base_url}/Public/Notice"
        self.session = requests.Session()

        # Store credentials (should be set from environment variables)
        self.username = username
        self.password = password

        # Set up session headers
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Origin": self.base_url,
            "Referer": self.login_url,
            })

    def login(self) -> bool:
        """Login to UNGM"""
        if not self.username or not self.password:
            print("⚠️ UNGM credentials not provided")
            return False

        try:
            print("🔑 Attempting to login to UNGM...")

            # Get login page to retrieve CSRF token
            login_page = self.session.get(self.login_url)
            soup = BeautifulSoup(login_page.text, 'html.parser')

            # Find CSRF token (adjust selector based on actual form)
            token = soup.find('input', {'name': '__RequestVerificationToken'})
            token_value = token.get('value') if token else ""

            # Prepare login data
            login_data = {
                    'UserName': self.username,
                    'Password': self.password,
                    '__RequestVerificationToken': token_value,
                    'RememberMe': 'false'
                    }

            # Submit login
            response = self.session.post(
                    self.login_url, 
                    data=login_data,
                    allow_redirects=True
                    )

            # Check if login was successful
            if response.status_code == 200 and "Logout" in response.text:
                print("✅ Successfully logged in to UNGM")
                return True
            else:
                print("❌ Login failed")
                return False

        except Exception as e:
            print(f"❌ Login error: {e}")
            return False

    def scrape(self, max_notices: int = 30) -> List[Dict[str, Any]]:
        """Scrape UNGM procurement notices (requires login)"""
        print("🔍 Scraping UNGM procurement notices...")

        # Try to login first
        if not self.login():
            print("⚠️ Using public access only (limited data)")
            return self._scrape_public(max_notices)

        # If logged in, try to get full data
        return self._scrape_authenticated(max_notices)

    def _scrape_public(self, max_notices: int) -> List[Dict[str, Any]]:
        """Scrape publicly visible notices (limited)"""
        try:
            response = self.session.get(self.notice_url, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # Look for any notice data
            notices = self._parse_notices_from_html(soup)

            if not notices:
                print("⚠️ No public notices found. Login required for full access.")
                return self._get_sample_data()

            print(f"✅ Found {len(notices)} public notices")
            return notices[:max_notices]

        except Exception as e:
            print(f"❌ Error scraping public notices: {e}")
            return self._get_sample_data()

    def _scrape_authenticated(self, max_notices: int) -> List[Dict[str, Any]]:
        """Scrape notices with authenticated session"""
        try:
            # After login, we might have access to the full data
            # This might involve calling their API endpoints directly

            # First, try the regular notice page
            response = self.session.get(self.notice_url, timeout=30)
            soup = BeautifulSoup(response.text, 'html.parser')

            # Look for API endpoints in JavaScript
            scripts = soup.find_all('script')
            api_url = self._find_api_endpoint(scripts)

            if api_url:
                # Call the API directly
                api_response = self.session.get(api_url)
                if api_response.status_code == 200:
                    data = api_response.json()
                    return self._parse_api_response(data)[:max_notices]

            # Fallback to HTML parsing
            notices = self._parse_notices_from_html(soup)

            if not notices:
                print("⚠️ No notices found even after login")
                return self._get_sample_data()

            print(f"✅ Found {len(notices)} notices")
            return notices[:max_notices]

        except Exception as e:
            print(f"❌ Error scraping authenticated notices: {e}")
            return self._get_sample_data()

    def _find_api_endpoint(self, scripts) -> Optional[str]:
        """Find API endpoint in JavaScript"""
        for script in scripts:
            if script.string and 'api' in script.string.lower():
                # Look for URL patterns
                match = re.search(r'(https?://[^\s"\']+api[^\s"\']+)', script.string)
                if match:
                    return match.group(1)
        return None

    def _parse_notices_from_html(self, soup) -> List[Dict]:
        """Parse notices from HTML"""
        notices = []

        # Look for the notices table
        notice_rows = soup.select('.notice-row, .tender-row, tr[data-noticeid]')

        for i, row in enumerate(notice_rows[:30], 1):
            try:
                notice = self._parse_notice_row(row, i)
                if notice:
                    notices.append(notice)
            except Exception as e:
                print(f"Error parsing notice {i}: {e}")
                continue

        return notices

    def _parse_notice_row(self, row, index) -> Optional[Dict]:
        """Parse a single notice row"""
        # This is a placeholder - actual parsing depends on the HTML structure
        return {
                "id": index,
                "title": "Sample UNGM Notice",
                "reference": "",
                "organization": "",
                "deadline": "",
                "source": "ungm",
                "scraped_at": datetime.now().isoformat()
                }

    def _parse_api_response(self, data) -> List[Dict]:
        """Parse API response JSON"""
        notices = []
        # This depends on the actual API response structure
        return notices

    def _get_sample_data(self):
        """Return sample data when scraping fails"""
        return [
                {
                    "id": 1,
                    "title": "Sample: Supply and Delivery of ICT Equipment",
                    "reference": "UNDP-2025-001",
                    "organization": "UNDP",
                    "deadline": "15-Apr-2025",
                    "country": "Multiple",
                    "notice_type": "Request for Quotation",
                    "source": "ungm",
                    "scraped_at": datetime.now().isoformat()
                    }
                ]


# For testing
if __name__ == "__main__":
    # Try with credentials (should be from environment variables)
    import os
    username = os.environ.get('UNGM_USERNAME')
    password = os.environ.get('UNGM_PASSWORD')

    scraper = UNGMScraper(username, password)
    results = scraper.scrape()
    print(f"Found {len(results)} notices")
