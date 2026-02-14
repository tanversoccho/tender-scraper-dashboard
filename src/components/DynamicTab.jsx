import React from 'react';
import TenderCard from './TenderCard';
import './TabContent.css';

const DynamicTab = ({ scraperName, displayName, data = [] }) => {
  console.log(`Rendering DynamicTab for ${scraperName}:`, data);

  return (
    <div className="tab-content">
    <div className="tab-header" style={{
      display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    }}>
    <h2>{displayName} Tenders</h2>
    <span className="tender-count" style={{
      background: '#667eea',
        color: '#fff',
        padding: '5px 10px',
        borderRadius: '5px'
    }}>
    {data.length} tenders found
    </span>
    </div>

    <div className="tenders-list">
    {data.length > 0 ? (
      data.map((tender, index) => (
        <TenderCard key={tender.id || index} tender={tender} />
      ))
    ) : (
      <div className="no-tenders" style={{
        textAlign: 'center',
          padding: '50px',
          background: '#1a1a2e',
          borderRadius: '10px',
          color: '#888'
      }}>
      📭 No tenders found for {displayName}
      </div>
    )}
    </div>
    </div>
  );
};

export default DynamicTab;
