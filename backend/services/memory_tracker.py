# backend/services/memory_tracker.py
import json
import os
from datetime import datetime, date


class MemoryTracker:
    """Track seen links to identify new postings"""

    def __init__(self, memory_file='seen_links.json'):
        self.memory_file = memory_file
        self.seen_links = self._load_memory()

    def _load_memory(self):
        """Load seen links from file"""
        if os.path.exists(self.memory_file):
            try:
                with open(self.memory_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return {}
        return {}

    def _save_memory(self):
        """Save seen links to file"""
        with open(self.memory_file, 'w', encoding='utf-8') as f:
            json.dump(self.seen_links, f, indent=2)

    def is_new(self, notice):
        """Check if a notice is new (not seen before)"""
        link = notice.get('link') or notice.get('detail_url') or notice.get('url')
        if not link:
            return False

        return link not in self.seen_links

    def add_to_memory(self, notices):
        """Add notices to memory"""
        new_count = 0
        for notice in notices:
            link = notice.get('link') or notice.get('detail_url') or notice.get('url')
            if link and link not in self.seen_links:
                self.seen_links[link] = {
                        'first_seen': datetime.now().isoformat(),
                        'title': notice.get('title', ''),
                        'source': notice.get('source', '')
                        }
                new_count += 1

        if new_count > 0:
            self._save_memory()

        return new_count

    def get_new_notices(self, notices):
        """Filter notices to only new ones"""
        new_notices = []
        for notice in notices:
            if self.is_new(notice):
                new_notices.append(notice)

        # Auto-add to memory
        self.add_to_memory(new_notices)

        return new_notices

    def get_todays_new(self):
        """Get all notices first seen today"""
        today = date.today().isoformat()
        todays = []

        for link, data in self.seen_links.items():
            first_seen = data.get('first_seen', '')
            if first_seen.startswith(today):
                todays.append({
                    'link': link,
                    'title': data.get('title'),
                    'source': data.get('source'),
                    'first_seen': first_seen
                    })

        return todays

    def clear_memory(self):
        """Clear all memory (for testing)"""
        self.seen_links = {}
        self._save_memory()
