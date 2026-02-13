import React from 'react';
import { FaBuilding, FaCalendar, FaMapMarkerAlt, FaDownload, FaEye, FaHeart, FaUser } from 'react-icons/fa';
import moment from 'moment';
import './TenderCard.css';

const TenderCard = ({ type, data }) => {
  const getCardStyle = () => {
    switch(type) {
      case 'bdjobs':
        return { borderLeftColor: '#667eea' };
      case 'care':
        return { borderLeftColor: '#ff6b6b' };
      case 'pksf':
        return { borderLeftColor: '#20bf6b' };
      default:
        return { borderLeftColor: '#667eea' };
    }
  };

  const getButtonStyle = () => {
    switch(type) {
      case 'bdjobs':
        return { background: '#667eea' };
      case 'care':
        return { background: '#ff6b6b' };
      case 'pksf':
        return { background: '#20bf6b' };
      default:
        return { background: '#667eea' };
    }
  };

  const renderBDJobsCard = () => (
    <>
    <div className="tender-header">
    <img className="tender-logo" src={data.logo} alt={data.organization} />
    <div>
    <div className="tender-org">
    <FaBuilding /> {data.organization}
    </div>
    </div>
    </div>
    <div className="tender-title">{data.title}</div>
    <div className="tender-meta">
    <span>
    <FaCalendar /> Posted: {moment(data.posted).format('MMM D, YYYY')}
    </span>
    <span>
    <FaMapMarkerAlt /> Bangladesh
    </span>
    </div>
    <a href={data.link} className="btn" style={getButtonStyle()} target="_blank" rel="noopener noreferrer">
    View Details →
    </a>
    </>
  );

  const renderCareCard = () => (
    <>
    <div className="tender-header">
    <div>
    <div className="tender-org">
    <FaHeart style={{ color: '#ff6b6b' }} /> CARE Bangladesh
    </div>
    </div>
    </div>
    <div className="tender-title">{data.title}</div>
    <div className="tender-meta">
    <span>
    <FaCalendar /> Deadline: {data.deadline}
    </span>
    </div>
    <a href={data.download_url} className="btn" style={getButtonStyle()} target="_blank" rel="noopener noreferrer">
    <FaDownload /> Download TOR
    </a>
    </>
  );

  const renderPKSFCard = () => (
    <>
    <div className="tender-header">
    <div>
    <div className="tender-org">
    <FaHandsHelping style={{ color: '#20bf6b' }} /> PKSF
    </div>
    </div>
    </div>
    <div className="tender-title">{data.title}</div>
    <div className="tender-meta">
    <span>
    <FaCalendar /> {data.date}
    </span>
    <span>
    <FaUser /> {data.author}
    </span>
    </div>
    <div className="tender-meta">
    <span>
    <FaEye /> {data.views} views
    </span>
    <span>
    <FaHeart /> {data.likes} likes
    </span>
    </div>
    <a href={data.link} className="btn" style={getButtonStyle()} target="_blank" rel="noopener noreferrer">
    Read More →
    </a>
    </>
  );

  return (
    <div className="tender-card" style={getCardStyle()}>
    {type === 'bdjobs' && renderBDJobsCard()}
    {type === 'care' && renderCareCard()}
    {type === 'pksf' && renderPKSFCard()}
    </div>
  );
};

export default TenderCard;
