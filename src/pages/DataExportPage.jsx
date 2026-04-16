import { useState, useEffect } from 'react';
import {
  FiDownload, FiFilter, FiRefreshCw,
  FiFileText, FiDatabase, FiClock, FiCheckCircle,
  FiSearch, FiDownloadCloud,
  FiEye, FiTable, FiGrid, FiAlertCircle, FiAward,
  FiStar, FiTrendingUp, FiArrowLeft
} from 'react-icons/fi';
import axios from 'axios';
import moment from 'moment';
import * as XLSX from 'xlsx';
import { useFilters } from '../contexts/FilterContext';
import FilterBar from '../components/FilterBar';
import './DataExportPage.css';
import { torService } from '../services/torService';
import { memoryService } from '../services/memoryService';

const API_BASE_URL = 'http://localhost:5000/api';

const DataExportPage = ({ onClose }) => {
  const {
    generalFilters,
    torFilters,
    activeMode,
    setActiveMode,
    applyFilters,
    resetFilters
  } = useFilters();

  const [tenderData, setTenderData] = useState({});
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewType, setPreviewType] = useState('table');
  const [filteredTenders, setFilteredTenders] = useState([]);

  const [memoryStats, setMemoryStats] = useState({
    totalSeen: 0,
    newInCurrent: 0,
    todaysNew: 0
  });

  const [stats, setStats] = useState({
    totalTenders: 0,
    uniqueSources: 0,
    lastUpdated: null,
    totalDownloads: 0,
    torOpportunities: 0,
    newToday: 0
  });

  useEffect(() => {
    const statsData = memoryService.getStats();
    let todaysNew = 0;

    if (memoryService.getTodaysNew && typeof memoryService.getTodaysNew === 'function') {
      todaysNew = memoryService.getTodaysNew().length;
    }

    setMemoryStats({
      totalSeen: statsData.totalSeen,
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
  }, [generalFilters, torFilters, tenderData, activeMode]);

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
        allTenders = [...allTenders, ...data[source].map(item => ({ ...item, source }))];
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
    const filtered = applyFilters(allTenders, torService, memoryService);
    setFilteredTenders(filtered);
    
    const preview = prepareDataForPreview(filtered);
    setPreviewData(preview);

    const newInView = filtered.filter(t =>
      memoryService.isNew(t.link || t.detail_url || t.url)
    ).length;

    setMemoryStats(prev => ({
      ...prev,
      newInCurrent: newInView
    }));
  };

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

  const prepareDataForTorExport = () => {
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

  const prepareDataForLegacyExport = () => {
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

      const exportData = activeMode === 'tor'
        ? prepareDataForTorExport()
        : prepareDataForLegacyExport();

      if (exportData.length === 0) {
        alert('No data matches the current filters!');
        setDownloading(false);
        return;
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      const colWidths = [];
      if (exportData.length > 0) {
        Object.keys(exportData[0]).forEach(key => {
          colWidths.push({ wch: Math.min(50, key.length + 10) });
        });
        ws['!cols'] = colWidths;
      }

      XLSX.utils.book_append_sheet(wb, ws, activeMode === 'tor' ? 'ToR Opportunities' : 'All Tenders');

      const timestamp = moment().format('YYYY-MM-DD_HH-mm');
      const prefix = activeMode === 'tor' ? 'Bangladesh_ToR_Report' : 'tenders';
      const filename = `${prefix}_${timestamp}.xlsx`;

      XLSX.writeFile(wb, filename);

      if (activeMode === 'tor') {
        memoryService.markMultipleAsSeen(filteredTenders);
      }

      saveToHistory(filename, { mode: activeMode }, exportData.length);

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

      saveToHistory(filename, { mode: 'all' }, exportData.length);

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

  const getFilteredCount = () => {
    return filteredTenders.length;
  };

  const generateDailyDigest = () => {
    const allTenders = flattenTenders(tenderData);
    const todaysNew = allTenders.filter(t =>
      t.scraped_at && moment(t.scraped_at).isSame(new Date(), 'day')
    );

    const torOpportunities = todaysNew.filter(t => torService.isTorRelevant(t));

    const byType = {};
    torOpportunities.forEach(t => {
      const type = torService.detectDocumentType(t);
      byType[type] = (byType[type] || 0) + 1;
    });

    const digestMessage = `📅 DAILY DIGEST REPORT - ${moment().format('MMMM D, YYYY')}

🔍 Overview
• New opportunities today: ${todaysNew.length}
• ToR-relevant opportunities: ${torOpportunities.length}
• Sites scanned: ${stats.uniqueSources}

📌 By Document Type
${Object.entries(byType).map(([type, count]) => `  • ${type}: ${count}`).join('\n')}

📊 Top Opportunities
${torOpportunities.slice(0, 5).map((t, i) =>
        `  ${i + 1}. ${t.title?.substring(0, 60)}... (${torService.detectDocumentType(t)})`
      ).join('\n')}

✅ Export ready: ${torOpportunities.length} opportunities available for download`;

    alert(digestMessage);
  };

  const getAvailableSources = () => {
    const sources = new Set();
    Object.keys(tenderData).forEach(source => {
      if (Array.isArray(tenderData[source]) && tenderData[source].length > 0) {
        sources.add(source);
      }
    });
    return Array.from(sources);
  };

  if (loading) {
    return (
      <div className="data-export-page">
        <div className="export-container">
          <div className="loading-spinner">Loading data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="data-export-page">
      <div className="export-container">
        {/* Back Button */}
        <div className="back-button">
          <button className="back-btn" onClick={onClose}>
            <FiArrowLeft /> Back to Dashboard
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
          <div className="header-actions">
            <button className="digest-btn" onClick={generateDailyDigest}>
              <FiAlertCircle /> Daily Digest
            </button>
            <button className="refresh-btn" onClick={fetchData}>
              <FiRefreshCw /> Refresh Data
            </button>
          </div>
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
        <div className="memory-stats-bar">
          <span className="memory-stat">
            <FiStar className="star" /> Total Seen: {memoryStats.totalSeen}
          </span>
          <span className="memory-stat">
            <FiTrendingUp className="trending" /> New in View: {memoryStats.newInCurrent}
          </span>
          <span className="memory-stat">
            <FiAlertCircle className="alert" /> Today's New: {memoryStats.todaysNew}
          </span>
        </div>

        {/* Filter Bar - Shared Component */}
        <FilterBar 
          sources={getAvailableSources()} 
          showStatusFilter={true}
        />

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

        {/* Preview Container */}
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
              <FiAlertCircle size={48} />
              <p>No data matches the current filters. Adjust your filters to see results.</p>
            </div>
          )}
        </div>

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
              activeMode === 'tor'
                ? `📊 Export ToR Report (${getFilteredCount()} items)`
                : `📥 Download Excel (${getFilteredCount()} items)`}
          </button>

          {activeMode !== 'tor' && (
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
