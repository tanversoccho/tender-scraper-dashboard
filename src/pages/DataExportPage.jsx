import { useState, useEffect } from 'react';
import {
  FiDownload, FiFilter, FiRefreshCw,
  FiFileText, FiDatabase, FiClock, FiCheckCircle,
  FiSearch, FiDownloadCloud, FiFolder,
  FiEye, FiTable, FiGrid
} from 'react-icons/fi';
import axios from 'axios';
import moment from 'moment';
import * as XLSX from 'xlsx';
import './DataExportPage.css';

const API_BASE_URL = 'http://localhost:5000/api';

const DataExportPage = ({ onClose }) => {
  const [tenderData, setTenderData] = useState({});
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewType, setPreviewType] = useState('table');
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
    totalDownloads: 0
  });

  useEffect(() => {
    fetchData();
    loadDownloadHistory();
  }, []);

  useEffect(() => {
    updatePreview();
  }, [filters, tenderData]);

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
    setStats({
      totalTenders: allTenders.length,
      uniqueSources: sources.size,
      lastUpdated: new Date(),
      totalDownloads: downloadHistory.length
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
    const filtered = applyFilters(allTenders);
    const preview = prepareDataForPreview(filtered);
    setPreviewData(preview);
  };

  const prepareDataForPreview = (tenders) => {
    return tenders.map((tender, index) => ({
      'SL No': index + 1,
      'Source': tender.source?.toUpperCase() || 'N/A',
      'Title': tender.title || 'N/A',
      'Reference': tender.reference_no || tender.ref_no || tender.project_id || 'N/A',
      'Organization': tender.organization || tender.procuring_entity || 'N/A',
      'Published': tender.publication_date || tender.posted || tender.date || 'N/A',
      'Deadline': tender.deadline || tender.closing_date || 'N/A',
      'Place': tender.place || tender.country || 'N/A',
      'Status': tender.status || 'Active'
    }));
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

  const applyFilters = (tenders) => {
    return tenders.filter(tender => {
      if (filters.source !== 'all' && tender.source !== filters.source) {
        return false;
      }

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

  const prepareDataForExport = () => {
    const allTenders = flattenTenders(tenderData);
    const filteredTenders = applyFilters(allTenders);

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

      const exportData = prepareDataForExport();

      if (exportData.length === 0) {
        alert('No data matches the current filters!');
        setDownloading(false);
        return;
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Tenders');

      const timestamp = moment().format('YYYY-MM-DD_HH-mm');
      const filterStr = filters.source !== 'all' ? `_${filters.source}` : '';
      const filename = `tenders_${timestamp}${filterStr}.xlsx`;

      XLSX.writeFile(wb, filename);

      saveToHistory(filename, filters, exportData.length);

      const dataCopy = {
        filename,
        timestamp: new Date().toISOString(),
        count: exportData.length,
        filters: { ...filters },
        data: exportData.slice(0, 5)
      };

      const savedExports = JSON.parse(localStorage.getItem('savedExports') || '[]');
      savedExports.push(dataCopy);
      localStorage.setItem('savedExports', JSON.stringify(savedExports.slice(-10)));

      console.log(`✅ Downloaded ${exportData.length} tenders to ${filename}`);

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

      const exportData = prepareDataForExport();

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

  const clearFilters = () => {
    setFilters({
      source: 'all',
      dateFrom: '',
      dateTo: '',
      searchTerm: '',
      status: 'all'
    });
  };

  const getFilteredCount = () => {
    const allTenders = flattenTenders(tenderData);
    return applyFilters(allTenders).length;
  };

  const sources = ['all', ...new Set(flattenTenders(tenderData).map(t => t.source))];

  return (
    <div className="data-export-page">
    <div className="export-container">
    {/* Back Button */}
    <div className="back-button">
    <button className="back-btn" onClick={onClose}>
    ← Back to Dashboard
    </button>
    </div>

    {/* Header */}
    <div className="export-header">
    <div>
    <h1 className="header-title">
    <FiDatabase className="header-icon" /> Data Export Center
    </h1>
    <p className="header-subtitle">
    Export tender data in Excel format with filtering options
    </p>
    </div>
    <button className="refresh-btn" onClick={fetchData}>
    <FiRefreshCw /> Refresh Data
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
    <div className="stat-label">Downloads</div>
    <div className="stat-value">{stats.totalDownloads}</div>
    </div>

    <div className="stat-card iris">
    <div className="stat-label">Filtered Results</div>
    <div className="stat-value">{getFilteredCount()}</div>
    </div>
    </div>

    {/* Filter Section */}
    <div className="filter-section">
    <h3 className="filter-title">
    <FiFilter className="filter-icon" /> Filters
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

    {/* Filter Actions */}
    <div className="filter-actions">
    <button className="clear-filters-btn" onClick={clearFilters}>
    Clear Filters
    </button>
    </div>
    </div>
    </div>

    {/* Preview Controls */}
    <div className="preview-controls">
    <div className="preview-info">
    <FiEye className="preview-icon" />
    <span className="preview-text">Live Preview ({previewData.length} items)</span>
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
      <span>Showing all {previewData.length} items</span>
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
    {downloading ? 'Generating...' : `Download Excel (${getFilteredCount()} items)`}
    </button>

    <button
    className="export-csv-btn"
    onClick={downloadAsCSV}
    disabled={downloading || getFilteredCount() === 0}
    >
    <FiFileText /> Download CSV
    </button>
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
      <th>Filters</th>
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
        {entry.filters.source !== 'all' && `Source: ${entry.filters.source} `}
        {entry.filters.searchTerm && `| Search: "${entry.filters.searchTerm}"`}
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
      Downloaded files will be saved to your computer. Consider saving them in a 'data' folder.
      </p>
      </div>
    )}
    </div>

    {/* Data Folder Info */}
    <div className="data-folder-info">
    <FiFolder className="folder-icon" />
    <span>
    <strong>Data Tracking:</strong> All downloads are tracked locally.
    Downloaded files should be saved to your <code className="folder-code">./data/</code> folder for organization.
    Download history is stored in your browser's localStorage.
    </span>
    </div>
    </div>
    </div>
  );
};

export default DataExportPage;
