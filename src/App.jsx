import React, { useState, useEffect } from 'react';
import './App.css';
import PowerShellHeader from './components/PowerShellHeader';
import StatsGrid from './components/StatsGrid';
import TabNavigation from './components/TabNavigation';
import BDJobsTab from './components/BDJobsTab';
import CareTab from './components/CareTab';
import PKSFTab from './components/PKSFTab';
import Footer from './components/Footer';
import { FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('bdjobs');
  const [tenderData, setTenderData] = useState({
    bdjobs: [],
    care: [],
    pksf: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [apiStatus, setApiStatus] = useState('checking');

  // Check API health on mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      if (response.data.status === 'healthy') {
        setApiStatus('connected');
        console.log('✅ Connected to backend API');
      }
    } catch (err) {
      setApiStatus('disconnected');
      setError('⚠️ Cannot connect to backend server. Please make sure it\'s running.');
      console.error('❌ Backend connection failed:', err);
    }
  };

  const fetchAllData = async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from all scrapers
      const response = await axios.get(`${API_BASE_URL}/scrape/all`, {
        params: { force }
      });
      
      if (response.data.success) {
        setTenderData(response.data.data);
        setLastUpdated(new Date(response.data.timestamp));
        setApiStatus('connected');
      } else {
        throw new Error(response.data.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch tender data. Using sample data.');
      // Load sample data as fallback
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
  };

  const handleRefresh = async () => {
    await fetchAllData(true);
  };

  const handleRetryConnection = () => {
    setError(null);
    checkApiHealth();
    fetchAllData();
  };

  if (loading && !tenderData.bdjobs.length) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <div>Loading tender dashboard...</div>
        {apiStatus === 'disconnected' && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ color: '#ffaa00' }}>⚠️ Backend server not running</p>
            <button onClick={handleRetryConnection} className="btn" style={{ marginTop: '10px' }}>
              Retry Connection
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <PowerShellHeader loadTime="2982ms" />
        
        {apiStatus === 'disconnected' && (
          <div className="warning-banner">
            <FiAlertCircle />
            <span>Backend server is not running. Please start it with 'cd backend && python run.py'</span>
            <button onClick={handleRetryConnection} className="retry-btn">
              Retry
            </button>
          </div>
        )}
        
        {error && <div className="error">{error}</div>}
        
        <StatsGrid 
          bdjobsCount={tenderData.bdjobs.length}
          careCount={tenderData.care.length}
          pksfCount={tenderData.pksf.length}
          lastUpdated={lastUpdated}
        />
        
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {activeTab === 'bdjobs' && <BDJobsTab tenders={tenderData.bdjobs} />}
        {activeTab === 'care' && <CareTab tenders={tenderData.care} />}
        {activeTab === 'pksf' && <PKSFTab tenders={tenderData.pksf} />}
        
        <Footer lastUpdated={lastUpdated} />
        
        <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
          <FiRefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
}

export default App;
