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
  const [previewType, setPreviewType] = useState('table'); // 'table' or 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100); // Show 100 items per page for better performance
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

  // Rosé Pine color palette
  const colors = {
    base: '#191724',
    surface: '#1f1d2e',
    rose: '#ebbcba',
    pine: '#31748f',
    gold: '#f6c177',
    love: '#eb6f92',
    iris: '#c4a7e7',
    text: '#e0def4',
    muted: '#908caa',
    overlay: '#26233a'
  };

  useEffect(() => {
    fetchData();
    loadDownloadHistory();
  }, []);

  useEffect(() => {
    // Update preview when filters change
    updatePreview();
    setCurrentPage(1); // Reset to first page when filters change
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
      // Load sample data if API fails
      loadSampleData();
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    const sampleData = {
      bdjobs: [
        {
          id: 1,
          source: 'bdjobs',
          organization: "World Bank",
          title: "Consultant for Digital Transformation Project",
          posted: "2024-12-20",
          deadline: "2025-01-15"
        },
        {
          id: 2,
          source: 'bdjobs',
          organization: "UNDP Bangladesh",
          title: "Supply and Installation of IT Equipment",
          posted: "2024-12-19",
          deadline: "2025-01-10"
        },
        {
          id: 3,
          source: 'bdjobs',
          organization: "Asian Development Bank",
          title: "Senior Project Manager - Infrastructure",
          posted: "2024-12-18",
          deadline: "2025-01-20"
        },
        {
          id: 4,
          source: 'bdjobs',
          organization: "UNICEF",
          title: "Education Specialist",
          posted: "2024-12-17",
          deadline: "2025-01-12"
        }
      ],
      bppa: [
        {
          id: 1,
          source: 'bppa',
          title: "Selection of a Firm for GAP Information Website Development",
          reference_no: "12.01.0000.924.040.07.0044.26-120",
          procuring_entity: "Project Director, TARAPS",
          publication_date: "15/02/2026",
          closing_date: "02/03/2026",
          place: "Dhaka"
        },
        {
          id: 2,
          source: 'bppa',
          title: "Supply of Medical Equipment for District Hospitals",
          reference_no: "45.02.2023.567.890.12.3456.78-901",
          procuring_entity: "Director General of Health Services",
          publication_date: "10/02/2026",
          closing_date: "25/02/2026",
          place: "Dhaka"
        }
      ],
      undp: [
        {
          id: 1,
          source: 'undp',
          title: "National Consultant - Programme Support",
          ref_no: "UNDP-BGD-01079",
          deadline: "14-Feb-26",
          country: "Bangladesh"
        },
        {
          id: 2,
          source: 'undp',
          title: "International Consultant - Climate Change",
          ref_no: "UNDP-BGD-01080",
          deadline: "20-Feb-26",
          country: "Bangladesh"
        }
      ],
      worldbank: [
        {
          id: 1,
          source: 'worldbank',
          title: "Bangladesh Road Safety Project",
          project_id: "P171023",
          amount: "$300.00 million",
          status: "Active"
        },
        {
          id: 2,
          source: 'worldbank',
          title: "Digital Bangladesh Transformation Project",
          project_id: "P171024",
          amount: "$500.00 million",
          status: "Active"
        }
      ],
      ungm: [
        {
          id: 1,
          source: 'ungm',
          title: "Procurement of IT Equipment for UN Women",
          ref_no: "UNW-2026-001",
          deadline: "2026-03-15",
          country: "Bangladesh"
        }
      ],
      pksf: [
        {
          id: 1,
          source: 'pksf',
          title: "Rural Infrastructure Development Project",
          ref_no: "PKSF/RIDP/2026/01",
          deadline: "2026-02-28",
          location: "Rural Areas"
        }
      ],
      care: [
        {
          id: 1,
          source: 'care',
          title: "Food Security Program Implementation",
          ref_no: "CARE-BGD-2026-001",
          deadline: "2026-03-01",
          region: "Southern Bangladesh"
        }
      ]
    };
    setTenderData(sampleData);
    calculateStats(sampleData);
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
    const preview = prepareDataForPreview(filtered); // Show ALL filtered data
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

  // Get current page data
  const getCurrentPageData = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return previewData.slice(indexOfFirstItem, indexOfLastItem);
  };

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total pages
  const totalPages = Math.ceil(previewData.length / itemsPerPage);

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

  const currentData = getCurrentPageData();

  return (
    <div className="data-export-page" style={{ background: colors.base, minHeight: '100vh' }}>
    <div style={{ padding: '20px' }}>
    {/* Back Button */}
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
    <button
    onClick={onClose}
    style={{
      padding: '10px 20px',
        background: colors.overlay,
        color: colors.text,
        border: `1px solid ${colors.rose}`,
        borderRadius: '5px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontFamily: 'Fira Code, monospace'
    }}
    >
    ← Back to Dashboard
    </button>
    </div>

    <div className="export-container">
    {/* Header */}
    <div className="export-header" style={{
      display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        background: colors.surface,
        borderRadius: '10px',
        borderLeft: `4px solid ${colors.rose}`
    }}>
    <div>
    <h1 style={{ color: colors.text, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
    <FiDatabase style={{ color: colors.rose }} /> Data Export Center
    </h1>
    <p style={{ color: colors.muted, marginTop: '5px' }}>
    Export tender data in Excel format with filtering options
    </p>
    </div>
    <button
    onClick={fetchData}
    style={{
      background: colors.overlay,
        color: colors.text,
        border: `1px solid ${colors.pine}`,
        padding: '10px 20px',
        borderRadius: '5px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontFamily: 'Fira Code, monospace'
    }}
    >
    <FiRefreshCw /> Refresh Data
    </button>
    </div>

    {/* Stats Cards */}
    <div className="stats-cards" style={{
      display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '30px'
    }}>
    <div style={{
      background: colors.surface,
        padding: '20px',
        borderRadius: '10px',
        borderBottom: `3px solid ${colors.rose}`
    }}>
    <div style={{ color: colors.muted, fontSize: '14px' }}>Total Tenders</div>
    <div style={{ color: colors.text, fontSize: '32px', fontWeight: 'bold' }}>
    {stats.totalTenders}
    </div>
    </div>

    <div style={{
      background: colors.surface,
        padding: '20px',
        borderRadius: '10px',
        borderBottom: `3px solid ${colors.pine}`
    }}>
    <div style={{ color: colors.muted, fontSize: '14px' }}>Sources</div>
    <div style={{ color: colors.text, fontSize: '32px', fontWeight: 'bold' }}>
    {stats.uniqueSources}
    </div>
    </div>

    <div style={{
      background: colors.surface,
        padding: '20px',
        borderRadius: '10px',
        borderBottom: `3px solid ${colors.gold}`
    }}>
    <div style={{ color: colors.muted, fontSize: '14px' }}>Downloads</div>
    <div style={{ color: colors.text, fontSize: '32px', fontWeight: 'bold' }}>
    {stats.totalDownloads}
    </div>
    </div>

    <div style={{
      background: colors.surface,
        padding: '20px',
        borderRadius: '10px',
        borderBottom: `3px solid ${colors.iris}`
    }}>
    <div style={{ color: colors.muted, fontSize: '14px' }}>Filtered Results</div>
    <div style={{ color: colors.text, fontSize: '32px', fontWeight: 'bold' }}>
    {getFilteredCount()}
    </div>
    </div>
    </div>

    {/* Filter Section */}
    <div className="filter-section" style={{
      background: colors.surface,
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '30px'
    }}>
    <h3 style={{ color: colors.text, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
    <FiFilter style={{ color: colors.gold }} /> Filters
    </h3>

    <div style={{
      display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
    }}>
    {/* Source Filter */}
    <div>
    <label style={{ color: colors.muted, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
    Source
    </label>
    <select
    value={filters.source}
    onChange={(e) => setFilters({ ...filters, source: e.target.value })}
    style={{
      width: '100%',
        padding: '10px',
        background: colors.overlay,
        color: colors.text,
        border: `1px solid ${colors.pine}`,
        borderRadius: '5px',
        fontFamily: 'Fira Code, monospace'
    }}
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
    <label style={{ color: colors.muted, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
    Search
    </label>
    <div style={{ position: 'relative' }}>
    <FiSearch style={{
      position: 'absolute',
        left: '10px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: colors.muted
    }} />
    <input
    type="text"
    value={filters.searchTerm}
    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
    placeholder="Search titles, refs..."
    style={{
      width: '100%',
        padding: '10px 10px 10px 35px',
        background: colors.overlay,
        color: colors.text,
        border: `1px solid ${colors.pine}`,
        borderRadius: '5px',
        fontFamily: 'Fira Code, monospace'
    }}
    />
    </div>
    </div>

    {/* Date From */}
    <div>
    <label style={{ color: colors.muted, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
    From Date
    </label>
    <input
    type="date"
    value={filters.dateFrom}
    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
    style={{
      width: '100%',
        padding: '10px',
        background: colors.overlay,
        color: colors.text,
        border: `1px solid ${colors.pine}`,
        borderRadius: '5px',
        fontFamily: 'Fira Code, monospace'
    }}
    />
    </div>

    {/* Date To */}
    <div>
    <label style={{ color: colors.muted, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
    To Date
    </label>
    <input
    type="date"
    value={filters.dateTo}
    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
    style={{
      width: '100%',
        padding: '10px',
        background: colors.overlay,
        color: colors.text,
        border: `1px solid ${colors.pine}`,
        borderRadius: '5px',
        fontFamily: 'Fira Code, monospace'
    }}
    />
    </div>

    {/* Status Filter */}
    <div>
    <label style={{ color: colors.muted, fontSize: '12px', display: 'block', marginBottom: '5px' }}>
    Status
    </label>
    <select
    value={filters.status}
    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
    style={{
      width: '100%',
        padding: '10px',
        background: colors.overlay,
        color: colors.text,
        border: `1px solid ${colors.pine}`,
        borderRadius: '5px',
        fontFamily: 'Fira Code, monospace'
    }}
    >
    <option value="all">All Status</option>
    <option value="active">Active</option>
    <option value="closed">Closed</option>
    </select>
    </div>

    {/* Filter Actions */}
    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
    <button
    onClick={clearFilters}
    style={{
      padding: '10px 20px',
        background: 'transparent',
        color: colors.gold,
        border: `1px solid ${colors.gold}`,
        borderRadius: '5px',
        cursor: 'pointer',
        fontFamily: 'Fira Code, monospace',
        width: '100%'
    }}
    >
    Clear Filters
    </button>
    </div>
    </div>
    </div>

    {/* Preview Controls */}
    <div style={{
      display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
    }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <FiEye style={{ color: colors.iris }} />
    <span style={{ color: colors.text }}>Live Preview ({previewData.length} items)</span>
    </div>
    <div style={{ display: 'flex', gap: '10px' }}>
    <button
    onClick={() => setPreviewType('table')}
    style={{
      padding: '5px 10px',
        background: previewType === 'table' ? colors.pine : colors.overlay,
        color: colors.text,
        border: 'none',
        borderRadius: '3px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    }}
    >
    <FiTable /> Table
    </button>
    <button
    onClick={() => setPreviewType('grid')}
    style={{
      padding: '5px 10px',
        background: previewType === 'grid' ? colors.pine : colors.overlay,
        color: colors.text,
        border: 'none',
        borderRadius: '3px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    }}
    >
    <FiGrid /> Grid
    </button>
    </div>
    </div>

    {/* Live Preview */}
    <div style={{
      background: colors.surface,
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '30px',
        maxHeight: '600px',
        overflow: 'auto'
    }}>
    {previewData.length > 0 ? (
      <>
      {previewType === 'table' ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, background: colors.surface }}>
        <tr style={{ borderBottom: `2px solid ${colors.pine}` }}>
        {Object.keys(previewData[0]).map(key => (
          <th key={key} style={{
            padding: '10px',
              textAlign: 'left',
              color: colors.gold,
              fontSize: '12px',
              fontWeight: 'normal',
              background: colors.surface
          }}>
          {key}
          </th>
        ))}
        </tr>
        </thead>
        <tbody>
        {previewData.map((row, idx) => (
          <tr key={idx} style={{
            borderBottom: `1px solid ${colors.overlay}`,
              backgroundColor: idx % 2 === 0 ? 'transparent' : colors.overlay
          }}>
          {Object.values(row).map((value, i) => (
            <td key={i} style={{
              padding: '8px 10px',
                color: colors.text,
                fontSize: '12px'
            }}>
            {value}
            </td>
          ))}
          </tr>
        ))}
        </tbody>
        </table>
      ) : (
        <div style={{
          display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '15px'
        }}>
        {previewData.map((item, idx) => (
          <div key={idx} style={{
            background: colors.overlay,
              padding: '15px',
              borderRadius: '8px',
              border: `1px solid ${colors.pine}`
          }}>
          {Object.entries(item).map(([key, value]) => (
            <div key={key} style={{
              marginBottom: '8px',
                fontSize: '12px'
            }}>
            <span style={{ color: colors.muted }}>{key}: </span>
            <span style={{ color: colors.text }}>{value}</span>
            </div>
          ))}
          </div>
        ))}
        </div>
      )}
      </>
    ) : (
      <div style={{
        textAlign: 'center',
          padding: '40px',
          color: colors.muted
      }}>
      No data to preview. Adjust filters to see results.
      </div>
    )}
    </div>

    {/* Pagination Info */}
    {previewData.length > 0 && (
      <div style={{
        display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          color: colors.muted,
          fontSize: '14px'
      }}>
      <span>Showing all {previewData.length} items</span>
      </div>
    )}

    {/* Export Actions */}
    <div className="export-actions" style={{
      display: 'flex',
        gap: '15px',
        marginBottom: '30px'
    }}>
    <button
    onClick={downloadAsExcel}
    disabled={downloading || getFilteredCount() === 0}
    style={{
      padding: '15px 30px',
        background: colors.pine,
        color: colors.text,
        border: 'none',
        borderRadius: '5px',
        cursor: downloading || getFilteredCount() === 0 ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontFamily: 'Fira Code, monospace',
        fontSize: '16px',
        opacity: downloading || getFilteredCount() === 0 ? 0.5 : 1,
        flex: 1
    }}
    >
    {downloading ? <FiRefreshCw className="spin" /> : <FiDownload />}
    {downloading ? 'Generating...' : `Download Excel (${getFilteredCount()} items)`}
    </button>

    <button
    onClick={downloadAsCSV}
    disabled={downloading || getFilteredCount() === 0}
    style={{
      padding: '15px 30px',
        background: colors.overlay,
        color: colors.text,
        border: `1px solid ${colors.pine}`,
        borderRadius: '5px',
        cursor: downloading || getFilteredCount() === 0 ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontFamily: 'Fira Code, monospace',
        fontSize: '16px',
        opacity: downloading || getFilteredCount() === 0 ? 0.5 : 1
    }}
    >
    <FiFileText /> Download CSV
    </button>
    </div>

    {/* Download History */}
    <div className="download-history" style={{
      background: colors.surface,
        padding: '20px',
        borderRadius: '10px'
    }}>
    <h3 style={{ color: colors.text, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
    <FiClock style={{ color: colors.rose }} /> Download History
    </h3>

    {downloadHistory.length > 0 ? (
      <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
      <tr style={{ borderBottom: `1px solid ${colors.overlay}` }}>
      <th style={{ padding: '10px', textAlign: 'left', color: colors.muted }}>Filename</th>
      <th style={{ padding: '10px', textAlign: 'left', color: colors.muted }}>Date & Time</th>
      <th style={{ padding: '10px', textAlign: 'left', color: colors.muted }}>Items</th>
      <th style={{ padding: '10px', textAlign: 'left', color: colors.muted }}>Filters</th>
      <th style={{ padding: '10px', textAlign: 'left', color: colors.muted }}>Status</th>
      </tr>
      </thead>
      <tbody>
      {downloadHistory.map(entry => (
        <tr key={entry.id} style={{ borderBottom: `1px solid ${colors.overlay}` }}>
        <td style={{ padding: '10px', color: colors.text }}>
        <FiFileText style={{ marginRight: '5px', color: colors.pine }} />
        {entry.filename}
        </td>
        <td style={{ padding: '10px', color: colors.muted }}>
        {moment(entry.timestamp).format('YYYY-MM-DD HH:mm:ss')}
        </td>
        <td style={{ padding: '10px', color: colors.gold }}>
        {entry.count} items
        </td>
        <td style={{ padding: '10px', color: colors.muted }}>
        {entry.filters.source !== 'all' && `Source: ${entry.filters.source} `}
        {entry.filters.searchTerm && `| Search: "${entry.filters.searchTerm}"`}
        </td>
        <td style={{ padding: '10px' }}>
        <span style={{
          background: colors.pine,
            color: colors.text,
            padding: '3px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
        }}>
        <FiCheckCircle /> Success
        </span>
        </td>
        </tr>
      ))}
      </tbody>
      </table>
      </div>
    ) : (
      <div style={{
        textAlign: 'center',
          padding: '40px',
          color: colors.muted,
          border: `2px dashed ${colors.overlay}`,
          borderRadius: '10px'
      }}>
      <FiDownloadCloud size={48} style={{ color: colors.overlay, marginBottom: '10px' }} />
      <p>No downloads yet. Use the export buttons above to download data.</p>
      <p style={{ fontSize: '12px', marginTop: '10px' }}>
      Downloaded files will be saved to your computer. Consider saving them in a 'data' folder.
      </p>
      </div>
    )}
    </div>

    {/* Data Folder Info */}
    <div style={{
      marginTop: '20px',
        padding: '15px',
        background: colors.overlay,
        borderRadius: '5px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: colors.muted
    }}>
    <FiFolder />
    <span>
    <strong>Data Tracking:</strong> All downloads are tracked locally.
    Downloaded files should be saved to your <code style={{ background: colors.base, padding: '2px 5px', borderRadius: '3px' }}>./data/</code> folder for organization.
    Download history is stored in your browser's localStorage.
    </span>
    </div>
    </div>

    <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }
          body {
            background: ${colors.base};
            margin: 0;
            font-family: 'Fira Code', monospace;
          }
        `}</style>
    </div>
    </div>
  );
};

export default DataExportPage;
