import TenderCard from './TenderCard';
import './TabContent.css';

const ADBTab = ({ projects }) => {
  return (
    <div className="tab-content">
    <div className="tab-header">
    <h2>🏦 ADB Bangladesh Projects</h2>
    <span className="tender-count">{projects.length} projects available</span>
    </div>
    <div className="tender-grid">
    {projects.map(project => (
      <TenderCard key={project.id} type="adb" data={project} />
    ))}
    </div>
    </div>
  );
};

export default ADBTab;
