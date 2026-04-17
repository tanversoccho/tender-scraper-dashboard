import { useState, useEffect } from 'react';
import './App.css';
import StatsGrid from './components/StatsGrid';
import TabNavigation from './components/TabNavigation';
import DynamicTab from './components/DynamicTab';
import Footer from './components/Footer';
import FilterBar from './components/FilterBar';
import { FiRefreshCw, FiAlertCircle, FiDownload } from 'react-icons/fi';
import axios from 'axios';
import DataExportPage from './pages/DataExportPage';
import { FilterProvider, useFilters } from './contexts/FilterContext';
import { torService } from './services/torService';
import { memoryService } from './services/memoryService';

const API_BASE_URL = 'http://localhost:5000/api';

// Main App Content with filters
function AppContent() {
  const { generalFilters, activeMode, applyFilters } = useFilters();
  const [activeTab, setActiveTab] = useState('');
  const [scrapers, setScrapers] = useState([]);
  const [tenderData, setTenderData] = useState({});
  const [filteredData, setFilteredData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [apiStatus, setApiStatus] = useState('checking');
  const [initialized, setInitialized] = useState(false);
  const [showExportPage, setShowExportPage] = useState(false);

  // Apply filters to data whenever they change
  useEffect(() => {
    if (Object.keys(tenderData).length === 0) return;

    console.log('Applying filters to dashboard data...');
    const filtered = {};

    Object.keys(tenderData).forEach(source => {
      if (Array.isArray(tenderData[source])) {
        filtered[source] = applyFilters(
          tenderData[source].map(item => ({ ...item, source })),
          torService,
          memoryService
        );
      }
    });

    setFilteredData(filtered);
  }, [tenderData, generalFilters, activeMode, applyFilters]);

  // Check API health on mount
  useEffect(() => {
    console.log('Checking API health...');
    checkApiHealth();
  }, []);

  // Fetch available scrapers after API is connected
  useEffect(() => {
    if (apiStatus === 'connected') {
      console.log('API connected, fetching scrapers...');
      fetchScrapers();
    }
  }, [apiStatus]);

  const checkApiHealth = async () => {
    try {
      console.log('Fetching from:', `${API_BASE_URL}/health`);
      const response = await axios.get(`${API_BASE_URL}/health`);
      console.log('Health check response:', response.data);
      if (response.data.status === 'healthy') {
        setApiStatus('connected');
        console.log('✅ Connected to backend API');
      } else {
        setApiStatus('disconnected');
        setError('⚠️ Backend API returned unhealthy status');
      }
    } catch (err) {
      console.error('❌ Backend connection failed:', err.message);
      setApiStatus('disconnected');
      setError('⚠️ Cannot connect to backend server. Please make sure it\'s running on port 5000.');
      setLoading(false);
    }
  };

  const fetchScrapers = async () => {
    try {
      console.log('Fetching scrapers from:', `${API_BASE_URL}/scrapers`);
      const response = await axios.get(`${API_BASE_URL}/scrapers`);
      console.log('Scrapers response:', response.data);

      const scraperList = Object.values(response.data);
      console.log('Processed scrapers:', scraperList);

      setScrapers(scraperList);
      if (scraperList.length > 0) {
        setActiveTab(scraperList[0].name);
        fetchAllData();
      } else {
        setError('No scrapers found on backend');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching scrapers:', err);
      const defaultScrapers = [
        { name: 'bdjobs', display_name: 'BD Jobs' },
        { name: 'care', display_name: 'CARE' },
        { name: 'pksf', display_name: 'PKSF' },
        { name: 'undp', display_name: 'UNDP' },
        { name: 'ungm', display_name: 'UNGM/UNOPS' },
        { name: 'worldbank', display_name: 'WORLD BANK' },
        { name: 'bppa', display_name: 'BPPA' },
        { name: 'adb', display_name: 'ADB' }
      ];
      setScrapers(defaultScrapers);
      setActiveTab('bdjobs');
      loadSampleData();
    }
  };

  const fetchAllData = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching all data...');

      const response = await axios.get(`${API_BASE_URL}/scrape/all`, {
        params: { force }
      });

      console.log('Data response:', response.data);

      if (response.data.success) {
        setTenderData(response.data.data);
        setLastUpdated(new Date(response.data.timestamp));
        setApiStatus('connected');
        console.log('✅ Data loaded successfully');
      } else {
        throw new Error(response.data.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch tender data. Using sample data.');
      loadSampleData();
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const loadSampleData = () => {
    console.log('Loading sample data...');
    const sampleData = {
      bdjobs: [
        {
          id: 1,
          source: 'bdjobs',
          organization: "World Bank",
          title: "Consultant for Digital Transformation Project",
          link: "#",
          logo: "https://via.placeholder.com/60x60?text=WB",
          posted: "2024-12-20",
          deadline: "2025-01-15"
        },
        {
          id: 2,
          source: 'bdjobs',
          organization: "UNDP Bangladesh",
          title: "Supply and Installation of IT Equipment",
          link: "#",
          logo: "https://via.placeholder.com/60x60?text=UNDP",
          posted: "2024-12-19",
          deadline: "2025-01-10"
        }
      ],
      care: [
        {
          id: 1,
          source: 'care',
          deadline: "25 Dec 2024",
          title: "Project Manager - Food Security",
          download_url: "#",
          organization: "CARE Bangladesh"
        }
      ],
      pksf: [
        {
          id: 1,
          source: 'pksf',
          date: "15 Dec 2024",
          title: "Procurement of Office Equipment",
          link: "#",
          views: "234",
          likes: "12",
          author: "PKSF Admin",
          deadline: "2025-01-20"
        }
      ],
      undp: [],
      ungm: [],
      worldbank: [],
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
        }
      ],
      adb: [
        {
          id: 1,
          source: 'adb',
          project_name: "South Asia Subregional Economic Cooperation Highway Improvement Project",
          country: "Bangladesh",
          status: "Active",
          deadline: "2025-03-30",
          amount: "250000000"
        }
      ]
    };
    setTenderData(sampleData);
    setInitialized(true);
  };

  const handleRefresh = async () => {
    await fetchAllData(true);
  };

  const handleRetryConnection = () => {
    setError(null);
    setLoading(true);
    checkApiHealth();
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

  if (loading && !initialized) {
    return (
      <div className="app">
      <div className="loading-screen">
      <div className="loading-spinner"></div>
      <div className="loading-text">Loading tender dashboard...</div>
      {apiStatus === 'disconnected' && (
        <div className="retry-container">
        <p className="retry-warning">⚠️ Backend server not running</p>
        <button className="retry-button" onClick={handleRetryConnection}>
        Retry Connection
        </button>
        </div>
      )}
      </div>
      </div>
    );
  }

  if (showExportPage) {
    return <DataExportPage onClose={() => setShowExportPage(false)} />;
  }

  return (
    <div className="app">
    <div className="container">
    {apiStatus === 'disconnected' && (
      <div className="warning-banner">
      <FiAlertCircle />
      <span>Backend server is not running. Please start it with 'cd backend && python run.py'</span>
      <button className="retry-link" onClick={handleRetryConnection}>
      Retry
      </button>
      </div>
    )}

    {error && (
      <div className="error-message">
      {error}
      </div>
    )}

    <div className="export-button-container">
    <button className="export-button" onClick={() => setShowExportPage(true)}>
    <FiDownload /> Export Data
    </button>
    </div>

    <StatsGrid
    scrapers={scrapers}
    tenderData={filteredData}
    lastUpdated={lastUpdated}
    />
    <div className="filter-section">
    <FilterBar 
    sources={getAvailableSources()} 
    showStatusFilter={true}
    />
    </div>

    <TabNavigation
    activeTab={activeTab}
    setActiveTab={setActiveTab}
    scrapers={scrapers}
    />

    {activeTab && (
      <DynamicTab
      scraperName={activeTab}
      displayName={scrapers.find(s => s.name === activeTab)?.display_name || activeTab}
      data={filteredData[activeTab] || []}
      />
    )}

    <Footer lastUpdated={lastUpdated} />

    <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
    <FiRefreshCw className={loading ? 'spin' : ''} />
    {loading ? 'Refreshing...' : 'Refresh Data'}
    </button>
    </div>
    </div>
  );
}

function App() {
  return (
    <FilterProvider>
    <AppContent />
    </FilterProvider>
  );
}

export default App;
