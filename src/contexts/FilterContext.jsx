import React, { createContext, useState, useContext, useEffect } from 'react';
import moment from 'moment';

const FilterContext = createContext();

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within FilterProvider');
  }
  return context;
};

export const FilterProvider = ({ children }) => {
  // Load saved filters from localStorage
  const loadSavedFilters = () => {
    const saved = localStorage.getItem('tenderFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading saved filters:', e);
      }
    }
    return null;
  };

  const savedFilters = loadSavedFilters();

  // General filters (shared between dashboard and export)
  const [generalFilters, setGeneralFilters] = useState({
    source: savedFilters?.general?.source || 'all',
    dateFrom: savedFilters?.general?.dateFrom || '',
    dateTo: savedFilters?.general?.dateTo || '',
    searchTerm: savedFilters?.general?.searchTerm || '',
    status: savedFilters?.general?.status || 'all'
  });

  // ToR specific filters (used in export page)
  const [torFilters, setTorFilters] = useState({
    documentType: savedFilters?.tor?.documentType || 'all',
    showOnlyNew: savedFilters?.tor?.showOnlyNew || false,
    showTorOnly: savedFilters?.tor?.showTorOnly !== undefined ? savedFilters.tor.showTorOnly : true,
    minKeywords: savedFilters?.tor?.minKeywords || 1,
    selectedKeywords: savedFilters?.tor?.selectedKeywords || []
  });

  // Active mode (all/tor)
  const [activeMode, setActiveMode] = useState(savedFilters?.mode || 'all');

  // Save filters to localStorage whenever they change
  useEffect(() => {
    const filtersToSave = {
      general: generalFilters,
      tor: torFilters,
      mode: activeMode,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('tenderFilters', JSON.stringify(filtersToSave));
  }, [generalFilters, torFilters, activeMode]);

  // Reset all filters
  const resetFilters = () => {
    setGeneralFilters({
      source: 'all',
      dateFrom: '',
      dateTo: '',
      searchTerm: '',
      status: 'all'
    });
    setTorFilters({
      documentType: 'all',
      showOnlyNew: false,
      showTorOnly: true,
      minKeywords: 1,
      selectedKeywords: []
    });
    setActiveMode('all');
  };

  // Apply filters to tenders
  const applyFilters = (tenders, torService, memoryService) => {
    if (!tenders || !Array.isArray(tenders)) return [];
    
    let filtered = [...tenders];

    // Apply general filters
    filtered = filtered.filter(tender => {
      // Source filter
      if (generalFilters.source !== 'all' && tender.source !== generalFilters.source) return false;

      // Search term filter
      if (generalFilters.searchTerm) {
        const searchLower = generalFilters.searchTerm.toLowerCase();
        const titleMatch = tender.title?.toLowerCase().includes(searchLower);
        const refMatch = tender.reference_no?.toLowerCase().includes(searchLower) ||
          tender.ref_no?.toLowerCase().includes(searchLower) ||
          tender.project_id?.toLowerCase().includes(searchLower);
        const orgMatch = tender.organization?.toLowerCase().includes(searchLower) ||
          tender.procuring_entity?.toLowerCase().includes(searchLower);

        if (!titleMatch && !refMatch && !orgMatch) return false;
      }

      // Date range filter
      const tenderDate = tender.publication_date || tender.posted || tender.date || tender.deadline;
      if (generalFilters.dateFrom && tenderDate) {
        const parsedDate = moment(tenderDate, ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY']);
        if (parsedDate.isValid() && parsedDate.isBefore(moment(generalFilters.dateFrom))) return false;
      }
      if (generalFilters.dateTo && tenderDate) {
        const parsedDate = moment(tenderDate, ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY']);
        if (parsedDate.isValid() && parsedDate.isAfter(moment(generalFilters.dateTo))) return false;
      }

      // Status filter
      if (generalFilters.status !== 'all') {
        if (generalFilters.status === 'active' && tender.status?.toLowerCase() !== 'active') return false;
        if (generalFilters.status === 'closed' && tender.status?.toLowerCase() === 'active') return false;
      }

      return true;
    });

    // Apply ToR filters if in TOR mode
    if (activeMode === 'tor') {
      if (torFilters.showTorOnly && torService) {
        filtered = filtered.filter(t => torService.isTorRelevant(t));
      }

      if (torFilters.documentType !== 'all' && torService) {
        filtered = filtered.filter(t =>
          torService.detectDocumentType(t) === torFilters.documentType
        );
      }

      if (torFilters.showOnlyNew && memoryService) {
        filtered = filtered.filter(t => {
          const url = t.link || t.detail_url || t.url;
          return memoryService.isNew(url);
        });
      }

      if (torFilters.minKeywords > 0 && torService) {
        filtered = filtered.filter(t =>
          torService.getMatchingKeywords(t).length >= torFilters.minKeywords
        );
      }

      if (torFilters.selectedKeywords.length > 0 && torService) {
        filtered = filtered.filter(t => {
          const keywords = torService.getMatchingKeywords(t);
          return torFilters.selectedKeywords.some(k => keywords.includes(k));
        });
      }
    }

    return filtered;
  };

  const value = {
    // State
    generalFilters,
    torFilters,
    activeMode,
    
    // Setters
    setGeneralFilters,
    setTorFilters,
    setActiveMode,
    
    // Actions
    resetFilters,
    applyFilters,
    
    // Helper
    isTorMode: activeMode === 'tor'
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};
