// src/services/memoryService.js
// Local storage management for seen links

const SEEN_LINKS_KEY = 'tor_seen_links';
const DOWNLOAD_HISTORY_KEY = 'tor_download_history';

// Memory management for seen links
export const memoryService = {
  // Get all seen links
  getSeenLinks: () => {
    try {
      const saved = localStorage.getItem(SEEN_LINKS_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      console.error('Error loading seen links:', error);
      return new Set();
    }
  },
  
  // Check if link is new
  isNew: (link) => {
    if (!link) return false;
    try {
      const seen = memoryService.getSeenLinks();
      return !seen.has(link);
    } catch (error) {
      return true;
    }
  },
  
  // Mark link as seen
  markAsSeen: (link, title = '') => {
    if (!link) return;
    try {
      const seen = memoryService.getSeenLinks();
      seen.add(link);
      localStorage.setItem(SEEN_LINKS_KEY, JSON.stringify([...seen]));
    } catch (error) {
      console.error('Error marking as seen:', error);
    }
  },
  
  // Mark multiple links as seen
  markMultipleAsSeen: (tenders) => {
    if (!tenders || tenders.length === 0) return;
    try {
      const seen = memoryService.getSeenLinks();
      tenders.forEach(t => {
        const link = t.link || t.detail_url || t.url;
        if (link) seen.add(link);
      });
      localStorage.setItem(SEEN_LINKS_KEY, JSON.stringify([...seen]));
    } catch (error) {
      console.error('Error marking multiple as seen:', error);
    }
  },
  
  // Get new tenders only
  getNewTenders: (tenders) => {
    if (!tenders) return [];
    try {
      const seen = memoryService.getSeenLinks();
      return tenders.filter(t => {
        const link = t.link || t.detail_url || t.url;
        return link && !seen.has(link);
      });
    } catch (error) {
      return tenders;
    }
  },
  
  // Get today's new tenders
  getTodaysNew: () => {
    try {
      const seen = memoryService.getSeenLinks();
      // This is a simplified version - in a real app you'd store metadata
      return [];
    } catch (error) {
      return [];
    }
  },
  
  // Get stats
  getStats: () => {
    try {
      const seen = memoryService.getSeenLinks();
      return {
        totalSeen: seen.size,
      };
    } catch (error) {
      return { totalSeen: 0 };
    }
  },
  
  // Download history
  getDownloadHistory: () => {
    try {
      const saved = localStorage.getItem(DOWNLOAD_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  },
  
  addToDownloadHistory: (entry) => {
    try {
      const history = memoryService.getDownloadHistory();
      history.push({
        ...entry,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(DOWNLOAD_HISTORY_KEY, JSON.stringify(history.slice(-50)));
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }
};
