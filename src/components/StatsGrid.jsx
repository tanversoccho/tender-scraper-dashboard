import React from 'react';
import { FaFileAlt, FaHeart, FaHandsHelping, FaChartBar } from 'react-icons/fa';
import moment from 'moment';
import './StatsGrid.css';

const StatsGrid = ({ bdjobsCount, careCount, pksfCount, lastUpdated }) => {
  const total = bdjobsCount + careCount + pksfCount;

  const stats = [
    {
      id: 1,
      icon: <FaFileAlt />,
      title: 'BDJOBS TENDERS',
      count: bdjobsCount,
      color: '#667eea'
    },
    {
      id: 2,
      icon: <FaHeart />,
      title: 'CARE BANGLADESH',
      count: careCount,
      color: '#ff6b6b'
    },
    {
      id: 3,
      icon: <FaHandsHelping />,
      title: 'PKSF TENDERS',
      count: pksfCount,
      color: '#20bf6b'
    },
    {
      id: 4,
      icon: <FaChartBar />,
      title: 'TOTAL TENDERS',
      count: total,
      color: '#9b59b6'
    }
  ];

  return (
    <div className="stats-grid">
    {stats.map(stat => (
      <div key={stat.id} className="stat-card" style={{ borderBottom: `4px solid ${stat.color}` }}>
      <div className="stat-icon" style={{ color: stat.color }}>
      {stat.icon}
      </div>
      <div className="stat-title">{stat.title}</div>
      <div className="stat-number">{stat.count}</div>
      <div className="stat-date">
      Last updated: {moment(lastUpdated).format('MMM D, YYYY h:mm A')}
      </div>
      </div>
    ))}
    </div>
  );
};

export default StatsGrid;
