import React from 'react';
import { FaBuilding, FaHeart, FaHandsHelping } from 'react-icons/fa';
import './TabNavigation.css';

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      id: 'bdjobs',
      icon: <FaBuilding />,
      label: 'BDJobs Tenders'
    },
    {
      id: 'care',
      icon: <FaHeart />,
      label: 'CARE Bangladesh'
    },
    {
      id: 'pksf',
      icon: <FaHandsHelping />,
      label: 'PKSF Tenders'
    }
  ];

  return (
    <div className="tabs-container">
    <div className="tabs">
    {tabs.map(tab => (
      <button
      key={tab.id}
      className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
      onClick={() => setActiveTab(tab.id)}
      >
      {tab.icon}
      <span>{tab.label}</span>
      </button>
    ))}
    </div>
    </div>
  );
};

export default TabNavigation;
