import React, { useState, useEffect } from 'react';
import './App.css';
import PowerShellHeader from './components/PowerShellHeader';
import StatsGrid from './components/StatsGrid';
import TabNavigation from './components/TabNavigation';
import DynamicTab from './components/DynamicTab';
import Footer from './components/Footer';
import { FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('');
  const [scrapers, setScrapers] = useState([]);
  const [tenderData, setTenderData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [apiStatus, setApiStatus] = useState('checking');
  const [initialized, setInitialized] = useState(false);

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
        // After setting scrapers, fetch data
        fetchAllData();
      } else {
        setError('No scrapers found on backend');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching scrapers:', err);
      // Fallback to default scrapers if API fails
      const defaultScrapers = [
        { name: 'bdjobs', display_name: 'BD Jobs' },
        { name: 'care', display_name: 'Care' },
        { name: 'pksf', display_name: 'PKSF' }
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
          organization: "World Bank",
          title: "Consultant for Digital Transformation Project",
          link: "#",
          logo: "https://via.placeholder.com/60x60?text=WB",
          posted: "2024-12-20"
        },
        {
          id: 2,
          organization: "UNDP Bangladesh",
          title: "Supply and Installation of IT Equipment",
          link: "#",
          logo: "https://via.placeholder.com/60x60?text=UNDP",
          posted: "2024-12-19"
        }
      ],
      care: [
        {
          id: 1,
          deadline: "25 Dec 2024",
          title: "Project Manager - Food Security",
          download_url: "#",
          organization: "CARE Bangladesh"
        }
      ],
      pksf: [
        {
          id: 1,
          date: "15 Dec 2024",
          title: "Procurement of Office Equipment",
          link: "#",
          views: "234",
          likes: "12",
          author: "PKSF Admin"
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

  // Show loading state
  if (loading && !initialized) {
    return (
      <div className="app">
      <div className="loading-screen" style={{
        display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0f0f1b'
      }}>
      <div className="loading-spinner" style={{
        width: '50px',
          height: '50px',
          border: '3px solid rgba(102, 126, 234, 0.3)',
          borderRadius: '50%',
          borderTopColor: '#667eea',
          animation: 'spin 1s ease-in-out infinite'
      }}></div>
      <div style={{ marginTop: '20px', color: '#fff' }}>Loading tender dashboard...</div>
      {apiStatus === 'disconnected' && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p style={{ color: '#ffaa00' }}>⚠️ Backend server not running</p>
        <button 
        onClick={handleRetryConnection} 
        style={{
          marginTop: '10px',
            padding: '10px 20px',
            background: '#667eea',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
        }}
        >
        Retry Connection
        </button>
        </div>
      )}
      </div>
      </div>
    );
  }

  return (
    <div className="app">
    <div className="container">
    // <PowerShellHeader loadTime="2982ms" />

    {apiStatus === 'disconnected' && (
      <div className="warning-banner" style={{
        background: '#ffaa00',
          color: '#000',
          padding: '10px',
          margin: '10px 0',
          borderRadius: '5px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
      }}>
      <FiAlertCircle />
      <span>Backend server is not running. Please start it with 'cd backend && python run.py'</span>
      <button 
      onClick={handleRetryConnection}
      style={{
        marginLeft: 'auto',
          padding: '5px 10px',
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
      }}
      >
      Retry
      </button>
      </div>
    )}

    {error && (
      <div className="error" style={{
        background: '#ff4444',
          color: '#fff',
          padding: '10px',
          margin: '10px 0',
          borderRadius: '5px'
      }}>
      {error}
      </div>
    )}

    <StatsGrid
    scrapers={scrapers}
    tenderData={tenderData}
    lastUpdated={lastUpdated}
    />

    <TabNavigation
    activeTab={activeTab}
    setActiveTab={setActiveTab}
    scrapers={scrapers}
    />

    {activeTab && (
      <DynamicTab
      scraperName={activeTab}
      displayName={scrapers.find(s => s.name === activeTab)?.display_name || activeTab}
      data={tenderData[activeTab] || []}
      />
    )}

    <Footer lastUpdated={lastUpdated} />

    <button 
    className="refresh-btn" 
    onClick={handleRefresh} 
    disabled={loading}
    style={{
      position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '10px 20px',
        background: '#667eea',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    }}
    >
    <FiRefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
    {loading ? 'Refreshing...' : 'Refresh Data'}
    </button>
    </div>

    <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;
