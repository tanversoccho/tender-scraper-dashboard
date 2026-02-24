import TenderCard from './TenderCard';
import './TabContent.css';

const DynamicTab = ({ scraperName, displayName, data = [] }) => {
  console.log(`Rendering DynamicTab for ${scraperName}:`, data);

  return (
    <div className="tab-content">
    <div className="tab-header">
    <h2>{displayName} Tenders</h2>
    <span className="tender-count">
    {data.length} tenders found
    </span>
    </div>

    <div className="tenders-list">
    {data.length > 0 ? (
      data.map((tender, index) => (
        <TenderCard key={tender.id || index} tender={tender} />
      ))
    ) : (
      <div className="no-tenders">
      📭 No tenders found for {displayName}
      </div>
    )}
    </div>
    </div>
  );
};

export default DynamicTab;
