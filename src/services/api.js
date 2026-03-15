// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ToR Monitor API calls
export const torApi = {
  // Scan all sources and filter for ToR
  scanAll: () => api.post('/tor/scan'),
  
  // Get daily digest
  getDailyDigest: () => api.get('/tor/daily-digest'),
  
  // Export to Excel
  exportToExcel: (notices) => api.post('/tor/export', { notices }, {
    responseType: 'blob'
  }),
  
  // Memory management
  clearMemory: () => api.post('/tor/memory/clear'),
  getMemoryStats: () => api.get('/tor/memory/stats'),
};

export default api;
