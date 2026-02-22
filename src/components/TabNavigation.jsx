import React from 'react';
import { FaBuilding, FaHeart, FaHandsHelping, FaGlobe, FaUniversity, FaFileAlt } from 'react-icons/fa';
import './TabNavigation.css';

const getIconForScraper = (scraperName) => {
  const iconMap = {
    bdjobs: <FaBuilding />,
    care: <FaHeart />,
    pksf: <FaHandsHelping />,
    undp: <FaGlobe />,
    worldbank: <FaUniversity />,
    ungm: <FaFileAlt />,
    bppa: <FaBuilding />
  };

  return iconMap[scraperName] || <FaBuilding />; // Default icon
};

const TabNavigation = ({ activeTab, setActiveTab, scrapers }) => {
  return (
    <div className="tabs-container">
    <div className="tabs">
    {scrapers.map(scraper => (
      <button
      key={scraper.name}
      className={`tab-btn ${activeTab === scraper.name ? 'active' : ''}`}
      onClick={() => setActiveTab(scraper.name)}
      >
      {getIconForScraper(scraper.name)}
      <span>{scraper.display_name}</span>
      </button>
    ))}
    </div>
    </div>
  );
};

export default TabNavigation;
