import { useState, useEffect } from 'react';
import {
  FiDownload, FiFilter, FiRefreshCw,
  FiFileText, FiDatabase, FiClock, FiCheckCircle,
  FiSearch, FiDownloadCloud, FiFolder,
  FiEye, FiTable, FiGrid, FiAlertCircle, FiAward,
  FiStar, FiTrendingUp
} from 'react-icons/fi';
import axios from 'axios';
import moment from 'moment';
import * as XLSX from 'xlsx';
import './DataExportPage.css';
import { torService } from '../services/torService';
import { memoryService } from '../services/memoryService';

const API_BASE_URL = 'http://localhost:5000/api';

const DataExportPage = ({ onClose }) => {
  const [tenderData, setTenderData] = useState({});
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewType, setPreviewType] = useState('table');
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'tor'

  // ToR-specific filters
  const [torFilters, setTorFilters] = useState({
    documentType: 'all', // ToR, RFP, EOI, RFQ, all
    showOnlyNew: false,
    showTorOnly: true, // Default to showing only ToR-relevant
    minKeywords: 1,
    selectedKeywords: []
  });

  const [memoryStats, setMemoryStats] = useState({
    totalSeen: 0,
    newInCurrent: 0,
    todaysNew: 0
  });

  // General filters
  const [filters, setFilters] = useState({
    source: 'all',
    dateFrom: '',
    dateTo: '',
    searchTerm: '',
    status: 'all'
  });

  const [stats, setStats] = useState({
    totalTenders: 0,
    uniqueSources: 0,
    lastUpdated: null,
    totalDownloads: 0,
    torOpportunities: 0,
    newToday: 0
  });

  // Load memory stats on mount
  useEffect(() => {
    const stats = memoryService.getStats();
    let todaysNew = 0;

    // Check if getTodaysNew exists before calling
    if (memoryService.getTodaysNew && typeof memoryService.getTodaysNew === 'function') {
      todaysNew = memoryService.getTodaysNew().length;
    }

    setMemoryStats({
      totalSeen: stats.totalSeen,
      newInCurrent: 0,
      todaysNew: todaysNew
    });
  }, []);

  useEffect(() => {
    fetchData();
    loadDownloadHistory();
  }, []);

  useEffect(() => {
    updatePreview();
  }, [filters, torFilters, tenderData, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/scrape/all`);
      if (response.data.success) {
        setTenderData(response.data.data);
        calculateStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setTenderData({});
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const allTenders = flattenTenders(data);
    const sources = new Set(allTenders.map(t => t.source));
    const torRelevant = allTenders.filter(t => torService.isTorRelevant(t));
    const newToday = allTenders.filter(t => {
      const scrapedDate = t.scraped_at ? moment(t.scraped_at).format('YYYY-MM-DD') : null;
      return scrapedDate === moment().format('YYYY-MM-DD');
    });

    setStats({
      totalTenders: allTenders.length,
      uniqueSources: sources.size,
      lastUpdated: new Date(),
      totalDownloads: downloadHistory.length,
      torOpportunities: torRelevant.length,
      newToday: newToday.length
    });
  };

  const flattenTenders = (data) => {
    let allTenders = [];
    Object.keys(data).forEach(source => {
      if (Array.isArray(data[source])) {
        allTenders = [...allTenders, ...data[source]];
      }
    });
    return allTenders;
  };

  const loadDownloadHistory = () => {
    const saved = localStorage.getItem('downloadHistory');
    if (saved) {
      setDownloadHistory(JSON.parse(saved));
    }
  };

  const updatePreview = () => {
    const allTenders = flattenTenders(tenderData);
    const filtered = applyAllFilters(allTenders);
    const preview = prepareDataForPreview(filtered);
    setPreviewData(preview);

    // Update memory stats for current view
    const newInView = filtered.filter(t => 
      memoryService.isNew(t.link || t.detail_url || t.url)
    ).length;

    setMemoryStats(prev => ({
      ...prev,
      newInCurrent: newInView
    }));
  };

  // Apply all filters (general + ToR)
  const applyAllFilters = (tenders) => {
    let filtered = applyGeneralFilters(tenders);

    if (activeTab === 'tor') {
      filtered = applyTorFilters(filtered);
    }

    return filtered;
  };

  // Apply general filters (source, date, search)
  const applyGeneralFilters = (tenders) => {
    return tenders.filter(tender => {
      // Source filter
      if (filters.source !== 'all' && tender.source !== filters.source) {
        return false;
      }

      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const titleMatch = tender.title?.toLowerCase().includes(searchLower);
        const refMatch = tender.reference_no?.toLowerCase().includes(searchLower) ||
          tender.ref_no?.toLowerCase().includes(searchLower) ||
          tender.project_id?.toLowerCase().includes(searchLower);
        const orgMatch = tender.organization?.toLowerCase().includes(searchLower) ||
          tender.procuring_entity?.toLowerCase().includes(searchLower);

        if (!titleMatch && !refMatch && !orgMatch) {
          return false;
        }
      }

      // Date filters
      const tenderDate = tender.publication_date || tender.posted || tender.date;
      if (filters.dateFrom && tenderDate) {
        if (moment(tenderDate, ['DD/MM/YYYY', 'YYYY-MM-DD']).isBefore(moment(filters.dateFrom))) {
          return false;
        }
      }
      if (filters.dateTo && tenderDate) {
        if (moment(tenderDate, ['DD/MM/YYYY', 'YYYY-MM-DD']).isAfter(moment(filters.dateTo))) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all') {
        if (filters.status === 'active' && tender.status?.toLowerCase() !== 'active') {
          return false;
        }
        if (filters.status === 'closed' && tender.status?.toLowerCase() === 'active') {
          return false;
        }
      }

      return true;
    });
  };

  // Apply ToR-specific filters
  const applyTorFilters = (tenders) => {
    let filtered = [...tenders];

    // Filter by ToR relevance
    if (torFilters.showTorOnly) {
      filtered = filtered.filter(t => torService.isTorRelevant(t));
    }

    // Filter by document type
    if (torFilters.documentType !== 'all') {
      filtered = filtered.filter(t => 
        torService.detectDocumentType(t) === torFilters.documentType
      );
    }

    // Filter by new only
    if (torFilters.showOnlyNew) {
      filtered = memoryService.getNewTenders(filtered);
    }

    // Filter by minimum keyword matches
    if (torFilters.minKeywords > 0) {
      filtered = filtered.filter(t => 
        torService.getMatchingKeywords(t).length >= torFilters.minKeywords
      );
    }

    // Filter by selected keywords
    if (torFilters.selectedKeywords.length > 0) {
      filtered = filtered.filter(t => {
        const keywords = torService.getMatchingKeywords(t);
        return torFilters.selectedKeywords.some(k => keywords.includes(k));
      });
    }

    return filtered;
  };

  // Prepare data for preview with ToR fields
  const prepareDataForPreview = (tenders) => {
    return tenders.slice(0, 100).map((tender, index) => {
      const keywords = torService.getMatchingKeywords(tender);
      const isNew = memoryService.isNew(tender.link || tender.detail_url || tender.url);
      const docType = torService.detectDocumentType(tender);

      return {
        'SL No': index + 1,
        '🆕': isNew ? '⭐ NEW' : '',
        'Type': docType,
        'Source': tender.source?.toUpperCase() || 'N/A',
        'Title': (tender.title || 'N/A').substring(0, 60) + (tender.title?.length > 60 ? '...' : ''),
        'Organization': (tender.organization || tender.procuring_entity || 'N/A').substring(0, 30),
        'Deadline': tender.deadline || tender.closing_date || 'N/A',
        'Keywords': keywords.slice(0, 3).join(', ') + (keywords.length > 3 ? '...' : '') || 'None',
        'Published': tender.publication_date || tender.posted || 'N/A'
      };
    });
  };

  // Prepare data for Excel export (ToR format)
  const prepareDataForTorExport = () => {
    const allTenders = flattenTenders(tenderData);
    const filteredTenders = applyAllFilters(allTenders);

    return filteredTenders.map((tender, index) => {
      const keywords = torService.getMatchingKeywords(tender);
      const isNew = memoryService.isNew(tender.link || tender.detail_url || tender.url);

      return {
        'SL No': index + 1,
        'Title': tender.title || 'N/A',
        'Link': tender.link || tender.detail_url || tender.url || '#',
        'Organization': tender.organization || tender.procuring_entity || 'N/A',
        'Deadline': tender.deadline || tender.closing_date || 'N/A',
        'Document Type': torService.detectDocumentType(tender),
        'Matched Keywords': keywords.join(', ') || 'None',
        'Summary': (tender.description || tender.summary || '').substring(0, 200),
        'Why Relevant': `Matches ${keywords.length} keyword(s): ${keywords.join(', ') || 'Bangladesh opportunity'}`,
        'Status': isNew ? 'NEW' : 'Seen',
        'Date Found': tender.scraped_at ? moment(tender.scraped_at).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
        'Source': tender.source?.toUpperCase() || 'N/A',
        'Reference': tender.reference_no || tender.ref_no || tender.project_id || 'N/A',
        'Place': tender.place || tender.country || 'N/A'
      };
    });
  };

  // Legacy export format (for backward compatibility)
  const prepareDataForLegacyExport = () => {
    const allTenders = flattenTenders(tenderData);
    const filteredTenders = applyGeneralFilters(allTenders);

    return filteredTenders.map((tender, index) => ({
      'SL No': index + 1,
      'Source': tender.source?.toUpperCase() || 'N/A',
      'Title': tender.title || 'N/A',
      'Reference No': tender.reference_no || tender.ref_no || tender.project_id || 'N/A',
      'Organization': tender.organization || tender.procuring_entity || 'N/A',
      'Publication Date': tender.publication_date || tender.posted || tender.date || 'N/A',
      'Deadline/Closing': tender.deadline || tender.closing_date || 'N/A',
      'Place/Country': tender.place || tender.country || 'N/A',
      'Status': tender.status || 'Active',
      'Amount': tender.amount || 'N/A',
      'URL': tender.detail_url || tender.link || tender.url || 'N/A',
      'Scraped At': tender.scraped_at ? moment(tender.scraped_at).format('YYYY-MM-DD HH:mm') : 'N/A'
    }));
  };

  const downloadAsExcel = () => {
    try {
      setDownloading(true);

      const exportData = activeTab === 'tor' 
        ? prepareDataForTorExport()
        : prepareDataForLegacyExport();

      if (exportData.length === 0) {
        alert('No data matches the current filters!');
        setDownloading(false);
        return;
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns (basic)
      const colWidths = [];
      if (exportData.length > 0) {
        Object.keys(exportData[0]).forEach(key => {
          colWidths.push({ wch: Math.min(50, key.length + 10) });
        });
        ws['!cols'] = colWidths;
      }

      XLSX.utils.book_append_sheet(wb, ws, activeTab === 'tor' ? 'ToR Opportunities' : 'All Tenders');

      const timestamp = moment().format('YYYY-MM-DD_HH-mm');
      const prefix = activeTab === 'tor' ? 'Bangladesh_ToR_Report' : 'tenders';
      const filename = `${prefix}_${timestamp}.xlsx`;

      XLSX.writeFile(wb, filename);

      // Mark exported tenders as seen
      if (activeTab === 'tor') {
        const exportedTenders = flattenTenders(tenderData).filter(t => 
          applyAllFilters([t]).length > 0
        );
        memoryService.markMultipleAsSeen(exportedTenders);
      }

      saveToHistory(filename, { ...filters, ...torFilters, mode: activeTab }, exportData.length);

    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Error downloading file. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const downloadAsCSV = () => {
    try {
      setDownloading(true);

      const exportData = prepareDataForLegacyExport();

      if (exportData.length === 0) {
        alert('No data matches the current filters!');
        setDownloading(false);
        return;
      }

      const headers = Object.keys(exportData[0]).join(',');
      const rows = exportData.map(row =>
        Object.values(row).map(val => `"${val}"`).join(',')
      ).join('\n');

      const csv = `${headers}\n${rows}`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const timestamp = moment().format('YYYY-MM-DD_HH-mm');
      const filename = `tenders_${timestamp}.csv`;

      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();

      saveToHistory(filename, filters, exportData.length);

    } catch (error) {
      console.error('Error downloading CSV:', error);
    } finally {
      setDownloading(false);
    }
  };

  const saveToHistory = (filename, filterUsed, count) => {
    const newEntry = {
      id: Date.now(),
      filename,
      timestamp: new Date().toISOString(),
      filters: filterUsed,
      count,
      status: 'success'
    };

    const updatedHistory = [newEntry, ...downloadHistory].slice(0, 50);
    setDownloadHistory(updatedHistory);
    localStorage.setItem('downloadHistory', JSON.stringify(updatedHistory));

    setStats(prev => ({
      ...prev,
      totalDownloads: updatedHistory.length
    }));
  };

  const clearFilters = () => {
    setFilters({
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
  };

  const getFilteredCount = () => {
    const allTenders = flattenTenders(tenderData);
    return applyAllFilters(allTenders).length;
  };

  const generateDailyDigest = () => {
    const allTenders = flattenTenders(tenderData);
    const todaysNew = allTenders.filter(t => 
      t.scraped_at && moment(t.scraped_at).isSame(new Date(), 'day')
    );

    const torOpportunities = todaysNew.filter(t => torService.isTorRelevant(t));

    // Group by document type
    const byType = {};
    torOpportunities.forEach(t => {
      const type = torService.detectDocumentType(t);
      byType[type] = (byType[type] || 0) + 1;
    });

    // Create digest message
    const digestMessage = `
📅 **DAILY DIGEST REPORT - ${moment().format('MMMM D, YYYY')}**

🔍 **Overview**
• New opportunities today: ${todaysNew.length}
• ToR-relevant opportunities: ${torOpportunities.length}
• Sites scanned: ${stats.uniqueSources}

📌 **By Document Type**
      ${Object.entries(byType).map(([type, count]) => `  • ${type}: ${count}`).join('\n')}

📊 **Top Opportunities**
      ${torOpportunities.slice(0, 5).map((t, i) => 
        `  ${i+1}. ${t.title?.substring(0, 60)}... (${torService.detectDocumentType(t)})`
      ).join('\n')}

✅ **Export ready**: ${torOpportunities.length} opportunities available for download
    `;

    alert(digestMessage);
  };

  const sources = ['all', ...new Set(flattenTenders(tenderData).map(t => t.source))];
  const allKeywords = torService.TOR_KEYWORDS;

  return (
    <div className="data-export-page">
    <div className="export-container">
    {/* Back Button */}
    <div className="back-button">
    <button className="back-btn" onClick={onClose}>
    ← Back to Dashboard
    </button>
    </div>

    {/* Header with Tabs */}
    <div className="export-header">
    <div>
    <h1 className="header-title">
    <FiDatabase className="header-icon" /> Data Export Center
    </h1>
    <p className="header-subtitle">
    Export tender data in Excel format with filtering options
    </p>
    </div>
    <div style={{ display: 'flex', gap: '10px' }}>
    <button 
    className="digest-btn" 
    onClick={generateDailyDigest}
    style={{ 
      background: '#ebbcba', 
        color: '#191724', 
        border: 'none',
        padding: '10px 20px',
        borderRadius: '5px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontFamily: 'Fira Code, monospace'
    }}
    >
    <FiAlertCircle /> Daily Digest
    </button>
    <button className="refresh-btn" onClick={fetchData}>
    <FiRefreshCw /> Refresh Data
    </button>
    </div>
    </div>

    {/* Mode Tabs */}
    <div className="mode-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
    <button
    className={`mode-tab ${activeTab === 'all' ? 'active' : ''}`}
    onClick={() => setActiveTab('all')}
    style={{
      padding: '10px 20px',
        background: activeTab === 'all' ? '#31748f' : '#26233a',
        color: '#e0def4',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    }}
    >
    <FiDatabase /> All Tenders
    </button>
    <button
    className={`mode-tab ${activeTab === 'tor' ? 'active' : ''}`}
    onClick={() => setActiveTab('tor')}
    style={{
      padding: '10px 20px',
        background: activeTab === 'tor' ? '#ebbcba' : '#26233a',
        color: activeTab === 'tor' ? '#191724' : '#e0def4',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    }}
    >
    <FiAward /> ToR Monitor
    </button>
    </div>

    {/* Stats Cards */}
    <div className="stats-cards">
    <div className="stat-card rose">
    <div className="stat-label">Total Tenders</div>
    <div className="stat-value">{stats.totalTenders}</div>
    </div>

    <div className="stat-card pine">
    <div className="stat-label">Sources</div>
    <div className="stat-value">{stats.uniqueSources}</div>
    </div>

    <div className="stat-card gold">
    <div className="stat-label">ToR Opportunities</div>
    <div className="stat-value">{stats.torOpportunities}</div>
    </div>

    <div className="stat-card iris">
    <div className="stat-label">New Today</div>
    <div className="stat-value">{stats.newToday}</div>
    </div>
    </div>

    {/* Memory Stats Bar */}
    <div className="memory-stats-bar" style={{
      background: '#1f1d2e',
        padding: '10px 20px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        gap: '20px',
        border: '1px solid #31748f'
    }}>
    <span><FiStar color="#f6c177" /> Total Seen: {memoryStats.totalSeen}</span>
    <span><FiTrendingUp color="#ebbcba" /> New in View: {memoryStats.newInCurrent}</span>
    <span><FiAlertCircle color="#c4a7e7" /> Today's New: {memoryStats.todaysNew}</span>
    </div>

    {/* Filter Section */}
    <div className="filter-section">
    <h3 className="filter-title">
    <FiFilter className="filter-icon" /> {activeTab === 'tor' ? 'ToR Monitor Filters' : 'General Filters'}
    </h3>

    <div className="filter-grid">
    {/* Source Filter */}
    <div>
    <label className="filter-label">Source</label>
    <select
    className="filter-select"
    value={filters.source}
    onChange={(e) => setFilters({ ...filters, source: e.target.value })}
    >
    {sources.map(source => (
      <option key={source} value={source}>
      {source === 'all' ? 'All Sources' : source.toUpperCase()}
      </option>
    ))}
    </select>
    </div>

    {/* Search Term */}
    <div>
    <label className="filter-label">Search</label>
    <div className="search-wrapper">
    <FiSearch className="search-icon" />
    <input
    type="text"
    className="search-input"
    value={filters.searchTerm}
    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
    placeholder="Search titles, refs..."
    />
    </div>
    </div>

    {/* Date From */}
    <div>
    <label className="filter-label">From Date</label>
    <input
    type="date"
    className="filter-input"
    value={filters.dateFrom}
    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
    />
    </div>

    {/* Date To */}
    <div>
    <label className="filter-label">To Date</label>
    <input
    type="date"
    className="filter-input"
    value={filters.dateTo}
    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
    />
    </div>

    {/* Status Filter */}
    <div>
    <label className="filter-label">Status</label>
    <select
    className="filter-select"
    value={filters.status}
    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
    >
    <option value="all">All Status</option>
    <option value="active">Active</option>
    <option value="closed">Closed</option>
    </select>
    </div>
    </div>

    {/* ToR-Specific Filters (only show in ToR mode) */}
    {activeTab === 'tor' && (
      <div className="tor-filters" style={{ marginTop: '20px', borderTop: '1px solid #31748f', paddingTop: '20px' }}>
      <h4 style={{ color: '#ebbcba', marginBottom: '15px' }}>📋 ToR Specific Filters</h4>

      <div className="filter-grid">
      {/* Document Type */}
      <div>
      <label className="filter-label">Document Type</label>
      <select
      className="filter-select"
      value={torFilters.documentType}
      onChange={(e) => setTorFilters({ ...torFilters, documentType: e.target.value })}
      >
      <option value="all">All Types</option>
      <option value="ToR">📋 ToR (Terms of Reference)</option>
      <option value="RFP">📄 RFP (Request for Proposal)</option>
      <option value="EOI">✉️ EOI (Expression of Interest)</option>
      <option value="RFQ">💰 RFQ (Request for Quotation)</option>
      </select>
      </div>

      {/* Minimum Keywords */}
      <div>
      <label className="filter-label">Minimum Keywords</label>
      <select
      className="filter-select"
      value={torFilters.minKeywords}
      onChange={(e) => setTorFilters({ ...torFilters, minKeywords: parseInt(e.target.value) })}
      >
      <option value="0">Any keywords</option>
      <option value="1">At least 1 keyword</option>
      <option value="2">At least 2 keywords</option>
      <option value="3">3+ keywords</option>
      </select>
      </div>

      {/* Checkboxes */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <input
      type="checkbox"
      checked={torFilters.showTorOnly}
      onChange={(e) => setTorFilters({ ...torFilters, showTorOnly: e.target.checked })}
      />
      Show only ToR-relevant
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <input
      type="checkbox"
      checked={torFilters.showOnlyNew}
      onChange={(e) => setTorFilters({ ...torFilters, showOnlyNew: e.target.checked })}
      />
      Show only NEW
      </label>
      </div>

      {/* Keyword Selection */}
      <div style={{ gridColumn: 'span 2' }}>
      <label className="filter-label">Filter by Keywords</label>
      <select
      className="filter-select"
      multiple
      size="3"
      value={torFilters.selectedKeywords}
      onChange={(e) => {
        const options = Array.from(e.target.selectedOptions, option => option.value);
        setTorFilters({ ...torFilters, selectedKeywords: options });
      }}
      >
      {allKeywords.map(keyword => (
        <option key={keyword} value={keyword}>{keyword}</option>
      ))}
      </select>
      <small style={{ color: '#908caa' }}>Ctrl+click to select multiple</small>
      </div>
      </div>

      {/* Preset Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
      <button 
      className="preset-btn"
      onClick={() => {
        setTorFilters({
          documentType: 'ToR',
          showTorOnly: true,
          showOnlyNew: true,
          minKeywords: 1,
          selectedKeywords: []
        });
      }}
      style={{ 
        background: '#31748f', 
          color: '#e0def4', 
          padding: '8px 15px', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: 'pointer',
          fontFamily: 'Fira Code, monospace'
      }}
      >
      🔍 New ToRs Only
      </button>

      <button 
      className="preset-btn"
      onClick={() => {
        setTorFilters({
          documentType: 'all',
          showTorOnly: true,
          showOnlyNew: false,
          minKeywords: 2,
          selectedKeywords: []
        });
      }}
      style={{ 
        background: '#c4a7e7', 
          color: '#191724', 
          padding: '8px 15px', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: 'pointer',
          fontFamily: 'Fira Code, monospace'
      }}
      >
      📊 High Relevance (2+ keywords)
      </button>

      <button 
      className="preset-btn"
      onClick={clearFilters}
      style={{ 
        background: '#26233a', 
          color: '#e0def4', 
          padding: '8px 15px', 
          border: '1px solid #908caa', 
          borderRadius: '5px', 
          cursor: 'pointer',
          fontFamily: 'Fira Code, monospace'
      }}
      >
      🧹 Reset All
      </button>
      </div>
      </div>
    )}

    {/* Clear Filters Button */}
    <div style={{ marginTop: '15px', textAlign: 'right' }}>
    <button className="clear-filters-btn" onClick={clearFilters}>
    Clear All Filters
    </button>
    </div>
    </div>

    {/* Preview Controls */}
    <div className="preview-controls">
    <div className="preview-info">
    <FiEye className="preview-icon" />
    <span className="preview-text">
    Live Preview ({previewData.length} items 
      {memoryStats.newInCurrent > 0 && `, ${memoryStats.newInCurrent} new`})
    </span>
    </div>
    <div className="view-toggle">
    <button
    className={`view-btn ${previewType === 'table' ? 'active' : ''}`}
    onClick={() => setPreviewType('table')}
    >
    <FiTable /> Table
    </button>
    <button
    className={`view-btn ${previewType === 'grid' ? 'active' : ''}`}
    onClick={() => setPreviewType('grid')}
    >
    <FiGrid /> Grid
    </button>
    </div>
    </div>

    {/* Live Preview */}
    <div className="preview-container">
    {previewData.length > 0 ? (
      <>
      {previewType === 'table' ? (
        <table className="preview-table">
        <thead>
        <tr>
        {Object.keys(previewData[0]).map(key => (
          <th key={key}>{key}</th>
        ))}
        </tr>
        </thead>
        <tbody>
        {previewData.map((row, idx) => (
          <tr key={idx}>
          {Object.values(row).map((value, i) => (
            <td key={i}>{value}</td>
          ))}
          </tr>
        ))}
        </tbody>
        </table>
      ) : (
        <div className="preview-grid">
        {previewData.map((item, idx) => (
          <div key={idx} className="preview-card">
          {Object.entries(item).map(([key, value]) => (
            <div key={key} className="preview-field">
            <span className="preview-field-label">{key}: </span>
            <span className="preview-field-value">{value}</span>
            </div>
          ))}
          </div>
        ))}
        </div>
      )}
      </>
    ) : (
      <div className="no-preview-data">
      No data to preview. Adjust filters to see results.
      </div>
    )}
    </div>

    {/* Pagination Info */}
    {previewData.length > 0 && (
      <div className="pagination-info">
      <span>Showing {previewData.length} of {getFilteredCount()} total items</span>
      </div>
    )}

    {/* Export Actions */}
    <div className="export-actions">
    <button
    className="export-excel-btn"
    onClick={downloadAsExcel}
    disabled={downloading || getFilteredCount() === 0}
    >
    {downloading ? <FiRefreshCw className="spin" /> : <FiDownload />}
    {downloading ? 'Generating...' : 
        activeTab === 'tor' 
        ? `📊 Export ToR Report (${getFilteredCount()} items)` 
        : `📥 Download Excel (${getFilteredCount()} items)`}
    </button>

    {activeTab !== 'tor' && (
      <button
      className="export-csv-btn"
      onClick={downloadAsCSV}
      disabled={downloading || getFilteredCount() === 0}
      >
      <FiFileText /> Download CSV
      </button>
    )}
    </div>

    {/* Download History */}
    <div className="download-history">
    <h3 className="history-title">
    <FiClock className="history-icon" /> Download History
    </h3>

    {downloadHistory.length > 0 ? (
      <div className="history-table-wrapper">
      <table className="history-table">
      <thead>
      <tr>
      <th>Filename</th>
      <th>Date & Time</th>
      <th>Items</th>
      <th>Type</th>
      <th>Status</th>
      </tr>
      </thead>
      <tbody>
      {downloadHistory.map(entry => (
        <tr key={entry.id}>
        <td className="history-filename">
        <FiFileText className="history-file-icon" />
        {entry.filename}
        </td>
        <td className="history-timestamp">
        {moment(entry.timestamp).format('YYYY-MM-DD HH:mm:ss')}
        </td>
        <td className="history-count">
        {entry.count} items
        </td>
        <td className="history-filters">
        {entry.filters?.mode === 'tor' ? '📋 ToR Report' : '📊 All Tenders'}
        </td>
        <td>
        <span className="history-status">
        <FiCheckCircle /> Success
        </span>
        </td>
        </tr>
      ))}
      </tbody>
      </table>
      </div>
    ) : (
      <div className="no-history">
      <FiDownloadCloud size={48} className="no-history-icon" />
      <p>No downloads yet. Use the export buttons above to download data.</p>
      <p className="no-history-note">
      ToR reports will be saved with the format: Bangladesh_ToR_Report_YYYY-MM-DD.xlsx
      </p>
      </div>
    )}
    </div>
    </div>
    </div>
  );
};

export default DataExportPage;
