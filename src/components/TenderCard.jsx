import React from 'react';
import './TenderCard.css';

const TenderCard = ({ tender }) => {
  return (
    <div className="tender-card" style={{
      background: '#1a1a2e',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '15px',
        border: '1px solid #333',
        color: '#fff'
    }}>
    <h3>{tender.title || 'No Title'}</h3>
    <p>{tender.organization || tender.source || 'Unknown Source'}</p>
    <small>Posted: {tender.posted || tender.date || tender.deadline || 'Unknown Date'}</small>
    </div>
  );
};

export default TenderCard;
