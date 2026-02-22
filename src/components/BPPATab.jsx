// src/components/BPPATab.jsx
import React from 'react';
import TenderCard from './TenderCard';
import './TabContent.css';

const BPPATab = ({ tenders }) => {
  return (
    <div className="tab-content">
    <div className="tab-header">
    <h2>🏛️ BPPA Tender Notices</h2>
    <span className="tender-count">{tenders.length} notices available</span>
    </div>
    <div className="tender-grid">
    {tenders.map(tender => (
      <TenderCard key={tender.id} type="bppa" data={tender} />
    ))}
    </div>
    </div>
  );
};

export default BPPATab;
