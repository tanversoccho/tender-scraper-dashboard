import React from 'react';
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
        if (tender.process_type) badges.push({ text: tender.process_type, class: 'badge-process' });
        if (tender.ref_no) badges.push({ text: tender.ref_no, class: 'badge-ref' });
        if (tender.country_code) badges.push({ text: tender.country_code, class: 'badge-country' });
        break;

      case 'worldbank':
        if (tender.status) badges.push({ text: tender.status, class: `badge-status-${tender.status.toLowerCase()}` });
        if (tender.project_id) badges.push({ text: tender.project_id, class: 'badge-project-id' });
        if (tender.amount) badges.push({ text: `$${parseFloat(tender.amount).toLocaleString()}`, class: 'badge-amount' });
        if (tender.last_stage) badges.push({ text: tender.last_stage, class: 'badge-stage' });
        break;

      case 'bppa':
        if (tender.reference_no) badges.push({ text: `Ref: ${tender.reference_no}`, class: 'badge-ref' });
        if (tender.publication_date) badges.push({ text: `Published: ${tender.publication_date}`, class: 'badge-published' });
        if (tender.place) badges.push({ text: tender.place, class: 'badge-place' });
        if (tender.procuring_entity) badges.push({ text: tender.procuring_entity.substring(0, 30) + '...', class: 'badge-entity' });
        if (tender.detail_url) badges.push({ text: 'View Details', class: 'badge-link', link: true });
        break;

      case 'bdjobs':
        if (tender.link) badges.push({ text: 'View on BDJobs', class: 'badge-link', link: true });
        break;

      case 'pksf':
        if (tender.views) badges.push({ text: tender.views, class: 'badge-views' });
        if (tender.likes) badges.push({ text: tender.likes, class: 'badge-likes' });
        if (tender.author) badges.push({ text: `By: ${tender.author}`, class: 'badge-author' });
        break;

      case 'care':
        if (tender.download_url) badges.push({ text: 'Download Available', class: 'badge-download', link: true });
        if (tender.deadline) badges.push({ text: `Deadline: ${tender.deadline}`, class: 'badge-deadline' });
        break;

      case 'ungm':
        if (tender.opportunity_type) badges.push({ text: tender.opportunity_type, class: 'badge-opportunity' });
        if (tender.reference) badges.push({ text: tender.reference, class: 'badge-ref' });
        if (tender.remaining_days) badges.push({ text: tender.remaining_days, class: 'badge-remaining' });
        break;

      default:
        break;
    }

    return badges;
  };

  const dateInfo = getDateInfo();
  const badges = getSourceBadges();
  const sourceClass = getSourceClass();

  return (
    <div className={`tender-card ${sourceClass}`} style={{
      background: '#1a1a2e',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '15px',
        border: '1px solid #333',
        color: '#fff',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
    }}
    onClick={() => {
      // Handle click based on source
      if (tender.link) window.open(tender.link, '_blank');
      else if (tender.download_url) window.open(tender.download_url, '_blank');
      else if (tender.detail_url) window.open(tender.detail_url, '_blank');
    }}
    >
    {/* Source indicator */}
    <div style={{
      position: 'absolute',
        top: '10px',
        right: '10px',
        background: tender.source === 'bdjobs' ? '#2E7D32' :
        tender.source === 'undp' ? '#1E88E5' :
        tender.source === 'worldbank' ? '#F9A825' :
        tender.source === 'pksf' ? '#6A1B9A' :
        tender.source === 'care' ? '#C2185B' :
        tender.source === 'ungm' ? '#00796B' :
        tender.source === 'adb' ? '#1565C0' : 
        tender.source === 'bppa' ? '#8B4513' : // Brown color for BPPA
        '#424242',
        color: '#fff',
        padding: '4px 12px',
        borderRadius: '15px',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        zIndex: 1
    }}>
    {tender.source || 'unknown'}
    </div>

    {/* Title */}
    <h3 style={{
      margin: '0 0 10px 0',
        fontSize: '18px',
        fontWeight: '600',
        paddingRight: '80px',
        lineHeight: '1.4',
        color: '#fff'
    }}>
    {getTitle()}
    </h3>

    {/* Organization */}
    <p style={{
      margin: '0 0 8px 0',
        fontSize: '14px',
        color: '#aaa',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    }}>
    <span style={{ fontWeight: 'bold' }}>🏢</span> {getOrganization()}
    </p>

    {/* Date */}
    <p style={{
      margin: '0 0 15px 0',
        fontSize: '13px',
        color: '#888',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    }}>
    <span style={{ fontWeight: 'bold' }}>📅</span> {dateInfo.label}: {dateInfo.value}
    </p>

    {/* Badges */}
    {badges.length > 0 && (
      <div style={{
        display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '10px',
          borderTop: '1px solid #333',
          paddingTop: '15px'
      }}>
      {badges.map((badge, index) => (
        <span
        key={index}
        style={{
          background: badge.class.includes('status-active') ? '#2E7D32' :
            badge.class.includes('status-pipeline') ? '#F9A825' :
            badge.class.includes('status-closed') ? '#C62828' :
            badge.class.includes('status-dropped') ? '#6A1B9A' :
            badge.class.includes('badge-process') ? '#1E88E5' :
            badge.class.includes('badge-ref') ? '#546E7A' :
            badge.class.includes('badge-amount') ? '#2E7D32' :
            badge.class.includes('badge-stage') ? '#6A1B9A' :
            badge.class.includes('badge-views') ? '#424242' :
            badge.class.includes('badge-likes') ? '#C2185B' :
            '#333',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '500',
            textDecoration: badge.link ? 'underline' : 'none',
            cursor: badge.link ? 'pointer' : 'default'
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (badge.link && tender.link) window.open(tender.link, '_blank');
        }}
        >
        {badge.text}
        </span>
      ))}
      </div>
    )}

    {/* Additional source-specific details */}
    {tender.source === 'undp' && tender.country && (
      <div style={{
        marginTop: '10px',
          fontSize: '12px',
          color: '#aaa'
      }}>
      🌍 Country: {tender.country}
      </div>
    )}

    {tender.source === 'worldbank' && tender.approval_date && (
      <div style={{
        marginTop: '10px',
          fontSize: '12px',
          color: '#aaa'
      }}>
      📊 Project ID: {tender.project_id} | Approval: {tender.approval_date}
      </div>
    )}

    {tender.source === 'pksf' && (
      <div style={{
        marginTop: '10px',
          fontSize: '12px',
          color: '#aaa'
      }}>
      👤 {tender.author && `Author: ${tender.author}`}
      </div>
    )}
    {tender.source === 'bppa' && (
      <div style={{
        marginTop: '10px',
          fontSize: '12px',
          color: '#aaa',
          borderTop: '1px solid #333',
          paddingTop: '10px'
      }}>
      <div> Reference: {tender.reference_no || 'N/A'}</div>
      <div> Entity: {tender.procuring_entity || 'N/A'}</div>
      <div> Place: {tender.place || 'N/A'}</div>
      <div> Published: {tender.publication_date || 'N/A'}</div>
      </div>
    )}
    {/* Click hint */}
    {(tender.link || tender.download_url || tender.detail_url) && (
      <div style={{
        textAlign: 'right',
          marginTop: '10px',
          fontSize: '11px',
          color: '#666'
      }}>
      Click to open ↗
      </div>
    )}
    </div>
  );
};

export default TenderCard;
