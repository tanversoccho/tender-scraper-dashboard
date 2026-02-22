import React from 'react';
import { FaFileAlt, FaHeart, FaHandsHelping, FaChartBar, FaGlobe, FaUniversity, FaBuilding } from 'react-icons/fa';
import moment from 'moment';
import './StatsGrid.css';

// Color mapping for different scrapers
const getColorForScraper = (scraperName) => {
  const colorMap = {
    bdjobs: '#667eea',
    care: '#ff6b6b',
    pksf: '#20bf6b',
    undp: '#009edb',      // UNDP blue
    worldbank: '#1a4d8c',  // World Bank dark blue
    ungm: '#4a90e2' ,
    bppa: '#8B4513' // UNGM blue
  };

  return colorMap[scraperName] || '#9b59b6'; // Default color
};

// Icon mapping for different scrapers
const getIconForScraper = (scraperName) => {
  const iconMap = {
    bdjobs: <FaFileAlt />,
    care: <FaHeart />,
    pksf: <FaHandsHelping />,
    undp: <FaGlobe />,
    worldbank: <FaUniversity />,
    ungm: <FaBuilding /> , // Using FaBuilding instead of FaUnitedNations
    bppa: <FaBuilding />
  };

  return iconMap[scraperName] || <FaFileAlt />; // Default icon
};

const StatsGrid = ({ scrapers, tenderData, lastUpdated }) => {
  // Calculate total tenders
  const total = Object.values(tenderData).reduce((sum, items) => sum + (items?.length || 0), 0);

  // Create stats for each scraper
  const scraperStats = scrapers.map(scraper => ({
    id: scraper.name,
    icon: getIconForScraper(scraper.name),
    title: scraper.display_name.toUpperCase(),
    count: tenderData[scraper.name]?.length || 0,
    color: getColorForScraper(scraper.name)
  }));

  // Add total stats card
  const allStats = [
    ...scraperStats,
    {
      id: 'total',
      icon: <FaChartBar />,
      title: 'TOTAL TENDERS',
      count: total,
      color: '#9b59b6'
    }
  ];

  return (
    <div className="stats-grid">
    {allStats.map(stat => (
      <div key={stat.id} className="stat-card" style={{ borderBottom: `4px solid ${stat.color}` }}>
      <div className="stat-icon" style={{ color: stat.color }}>
      {stat.icon}
      </div>
      <div className="stat-title">{stat.title}</div>
      <div className="stat-number">{stat.count}</div>
      {stat.id === 'total' && (
        <div className="stat-date">
        Last updated: {moment(lastUpdated).format('MMM D, YYYY h:mm A')}
        </div>
      )}
      </div>
    ))}
    </div>
  );
};

export default StatsGrid;
