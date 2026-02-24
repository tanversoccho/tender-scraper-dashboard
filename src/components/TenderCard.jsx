import './TenderCard.css';

const TenderCard = ({ tender }) => {
  // Helper function to get source-specific class
  const getSourceClass = () => {
    return tender.source ? `source-${tender.source}` : '';
  };

  // Helper function to get the title from different sources
  const getTitle = () => {
    return tender.title || tender.project_name || 'No Title Available';
  };

  // Helper function to get organization/source name
  const getOrganization = () => {
    if (tender.organization) return tender.organization;
    if (tender.source === 'undp' && tender.country) return `UNDP - ${tender.country}`;
    if (tender.source === 'worldbank') return `World Bank - ${tender.country || 'Bangladesh'}`;
    if (tender.source === 'ungm') return tender.organization || 'UNGM';
    if (tender.source === 'bppa') return tender.procuring_entity || 'BPPA';
    return tender.source?.toUpperCase() || 'Unknown Source';
  };

  // Helper function to get date information
  const getDateInfo = () => {
    if (tender.source === 'bdjobs' && tender.posted) {
      return { label: 'Posted', value: tender.posted };
    }
    if (tender.source === 'undp') {
      return { label: 'Deadline', value: tender.deadline || 'No deadline' };
    }
    if (tender.source === 'pksf') {
      return { label: 'Date', value: tender.date || 'No date' };
    }
    if (tender.source === 'care') {
      return { label: 'Scraped', value: tender.scraped_at ? new Date(tender.scraped_at).toLocaleDateString() : 'Unknown' };
    }
    if (tender.source === 'ungm') {
      return { label: 'Deadline', value: tender.deadline || 'No deadline' };
    }
    if (tender.source === 'worldbank') {
      return { label: 'Approval', value: tender.approval_date || 'Pending' };
    }
    if (tender.source === 'bppa') {
      return {
        label: 'Closing',
        value: tender.closing_date ? `${tender.closing_date} ${tender.closing_time || ''}` : 'No closing date'
      };
    }
    return { label: 'Date', value: tender.posted || tender.date || tender.deadline || 'Unknown' };
  };

  // Helper function to get source-specific badges/info
  const getSourceBadges = () => {
    const badges = [];

    switch(tender.source) {
      case 'undp':
        if (tender.process_type) badges.push({ text: tender.process_type, class: 'process' });
        if (tender.ref_no) badges.push({ text: tender.ref_no, class: 'ref' });
        if (tender.country_code) badges.push({ text: tender.country_code, class: 'default' });
        break;

      case 'worldbank':
        if (tender.status) badges.push({ text: tender.status, class: `status-${tender.status.toLowerCase()}` });
        if (tender.project_id) badges.push({ text: tender.project_id, class: 'default' });
        if (tender.amount) badges.push({ text: `$${parseFloat(tender.amount).toLocaleString()}`, class: 'amount' });
        if (tender.last_stage) badges.push({ text: tender.last_stage, class: 'stage' });
        break;

      case 'bppa':
        if (tender.reference_no) badges.push({ text: `Ref: ${tender.reference_no}`, class: 'ref' });
        if (tender.publication_date) badges.push({ text: `Published: ${tender.publication_date}`, class: 'default' });
        if (tender.place) badges.push({ text: tender.place, class: 'default' });
        if (tender.procuring_entity) badges.push({ text: tender.procuring_entity.substring(0, 30) + '...', class: 'default' });
        if (tender.detail_url) badges.push({ text: 'View Details', class: 'link', link: true });
        break;

      case 'bdjobs':
        if (tender.link) badges.push({ text: 'View on BDJobs', class: 'link', link: true });
        break;

      case 'pksf':
        if (tender.views) badges.push({ text: tender.views, class: 'views' });
        if (tender.likes) badges.push({ text: tender.likes, class: 'likes' });
        if (tender.author) badges.push({ text: `By: ${tender.author}`, class: 'default' });
        break;

      case 'care':
        if (tender.download_url) badges.push({ text: 'Download Available', class: 'link', link: true });
        if (tender.deadline) badges.push({ text: `Deadline: ${tender.deadline}`, class: 'default' });
        break;

      case 'ungm':
        if (tender.opportunity_type) badges.push({ text: tender.opportunity_type, class: 'default' });
        if (tender.reference) badges.push({ text: tender.reference, class: 'ref' });
        if (tender.remaining_days) badges.push({ text: tender.remaining_days, class: 'default' });
        break;

      default:
        break;
    }

    return badges;
  };

  const dateInfo = getDateInfo();
  const badges = getSourceBadges();
  const sourceClass = getSourceClass();

  const handleCardClick = () => {
    if (tender.link) window.open(tender.link, '_blank');
    else if (tender.download_url) window.open(tender.download_url, '_blank');
    else if (tender.detail_url) window.open(tender.detail_url, '_blank');
  };

  const handleBadgeClick = (e, badge) => {
    e.stopPropagation();
    if (badge.link && tender.link) window.open(tender.link, '_blank');
  };

  return (
    <div className={`tender-card ${sourceClass}`} onClick={handleCardClick}>
      {/* Source indicator */}
      <div className={`source-indicator ${tender.source || 'unknown'}`}>
        {tender.source || 'unknown'}
      </div>

      {/* Title */}
      <h3 className="tender-title">{getTitle()}</h3>

      {/* Organization */}
      <p className="tender-organization">
        <span style={{ fontWeight: 'bold' }}>🏢</span> {getOrganization()}
      </p>

      {/* Date */}
      <p className="tender-date">
        <span style={{ fontWeight: 'bold' }}>📅</span> {dateInfo.label}: {dateInfo.value}
      </p>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="badges-container">
          {badges.map((badge, index) => (
            <span
              key={index}
              className={`badge ${badge.class} ${badge.link ? 'link' : ''}`}
              onClick={(e) => handleBadgeClick(e, badge)}
            >
              {badge.text}
            </span>
          ))}
        </div>
      )}

      {/* Additional source-specific details */}
      {tender.source === 'undp' && tender.country && (
        <div className="tender-details">
          🌍 Country: {tender.country}
        </div>
      )}

      {tender.source === 'worldbank' && tender.approval_date && (
        <div className="tender-details">
          📊 Project ID: {tender.project_id} | Approval: {tender.approval_date}
        </div>
      )}

      {tender.source === 'pksf' && (
        <div className="tender-details">
          👤 {tender.author && `Author: ${tender.author}`}
        </div>
      )}
      
      {tender.source === 'bppa' && (
        <div className="tender-details bordered">
          <div>Reference: {tender.reference_no || 'N/A'}</div>
          <div>Entity: {tender.procuring_entity || 'N/A'}</div>
          <div>Place: {tender.place || 'N/A'}</div>
          <div>Published: {tender.publication_date || 'N/A'}</div>
        </div>
      )}

      {/* Click hint */}
      {(tender.link || tender.download_url || tender.detail_url) && (
        <div className="click-hint">
          Click to open ↗
        </div>
      )}
    </div>
  );
};

export default TenderCard;
