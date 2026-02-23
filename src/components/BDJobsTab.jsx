import TenderCard from './TenderCard';
import './TabContent.css';

const BDJobsTab = ({ tenders }) => {
  return (
    <div className="tab-content">
    <div className="tab-header">
    <h2>🏢 BDJobs Tenders</h2>
    <span className="tender-count">{tenders.length} tenders available</span>
    </div>
    <div className="tender-grid">
    {tenders.map(tender => (
      <TenderCard key={tender.id} type="bdjobs" data={tender} />
    ))}
    </div>
    </div>
  );
};

export default BDJobsTab;
