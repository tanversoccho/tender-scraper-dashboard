import React from 'react';
import TenderCard from './TenderCard';
import './TabContent.css';

const CareTab = ({ tenders }) => {
  return (
    <div className="tab-content">
    <div className="tab-header">
    <h2>❤️ CARE Bangladesh Tenders</h2>
    <span className="tender-count">{tenders.length} tenders available</span>
    </div>
    <div className="tender-grid">
    {tenders.map(tender => (
      <TenderCard key={tender.id} type="care" data={tender} />
    ))}
    </div>
    </div>
  );
};

export default CareTab;
