import TenderCard from './TenderCard';
import './TabContent.css';

const PKSFTab = ({ tenders }) => {
  return (
    <div className="tab-content">
    <div className="tab-header">
    <h2>🤝 PKSF Tenders</h2>
    <span className="tender-count">{tenders.length} tenders available</span>
    </div>
    <div className="tender-grid">
    {tenders.map(tender => (
      <TenderCard key={tender.id} type="pksf" data={tender} />
    ))}
    </div>
    </div>
  );
};

export default PKSFTab;
