import { useState } from 'react';
import { FiSearch, FiX, FiChevronDown, FiChevronUp, FiAward } from 'react-icons/fi';
import { useFilters } from '../contexts/FilterContext';
import './FilterBar.css';

const FilterBar = ({ sources = [], showStatusFilter = true }) => {
  const {
    generalFilters,
    setGeneralFilters,
    torFilters,
    setTorFilters,
    activeMode,
    setActiveMode,
    resetFilters
  } = useFilters();

  const [showTorFilters, setShowTorFilters] = useState(false);

  const handleSourceChange = (e) => {
    setGeneralFilters({ ...generalFilters, source: e.target.value });
  };

  const handleSearchChange = (e) => {
    setGeneralFilters({ ...generalFilters, searchTerm: e.target.value });
  };

  const handleDateFromChange = (e) => {
    setGeneralFilters({ ...generalFilters, dateFrom: e.target.value });
  };

  const handleDateToChange = (e) => {
    setGeneralFilters({ ...generalFilters, dateTo: e.target.value });
  };

  const handleStatusChange = (e) => {
    setGeneralFilters({ ...generalFilters, status: e.target.value });
  };

  const handleDocumentTypeChange = (e) => {
    setTorFilters({ ...torFilters, documentType: e.target.value });
  };

  const handleMinKeywordsChange = (e) => {
    setTorFilters({ ...torFilters, minKeywords: parseInt(e.target.value) });
  };

  const handleShowTorOnlyChange = (e) => {
    setTorFilters({ ...torFilters, showTorOnly: e.target.checked });
  };

  const handleShowOnlyNewChange = (e) => {
    setTorFilters({ ...torFilters, showOnlyNew: e.target.checked });
  };

  const handleKeywordToggle = (keyword) => {
    const currentKeywords = torFilters.selectedKeywords;
    const updatedKeywords = currentKeywords.includes(keyword)
      ? currentKeywords.filter(k => k !== keyword)
      : [...currentKeywords, keyword];
    setTorFilters({ ...torFilters, selectedKeywords: updatedKeywords });
  };

  const torKeywords = [
    'Terms of Reference', 'ToR', 'Request for Proposal', 'RFP',
    'Expression of Interest', 'EOI', 'Consultant', 'Consulting',
    'Technical Proposal', 'Evaluation', 'Assessment', 'Study',
    'Research', 'Framework Agreement', 'Individual Consultant',
    'Firm', 'Training', 'Capacity Building', 'Advisory Services',
    'Feasibility Study', 'Impact Assessment', 'Baseline Survey',
    'Mid-term Review', 'Final Evaluation', 'Technical Assistance'
  ];

  const hasActiveFilters = () => {
    return (
      generalFilters.source !== 'all' ||
      generalFilters.searchTerm !== '' ||
      generalFilters.dateFrom !== '' ||
      generalFilters.dateTo !== '' ||
      generalFilters.status !== 'all' ||
      (activeMode === 'tor' && (
        torFilters.documentType !== 'all' ||
        torFilters.showOnlyNew ||
        torFilters.showTorOnly !== true ||
        torFilters.minKeywords > 1 ||
        torFilters.selectedKeywords.length > 0
      ))
    );
  };

  const hasActiveTorFilters = () => {
    return (
      torFilters.documentType !== 'all' ||
      torFilters.showOnlyNew ||
      torFilters.showTorOnly !== true ||
      torFilters.minKeywords > 1 ||
      torFilters.selectedKeywords.length > 0
    );
  };

  return (
    <div className="filter-bar">
    <div className="filter-bar-header">
    <div className="mode-toggle">
    <button
    className={`mode-toggle-btn ${activeMode === 'all' ? 'active' : ''}`}
    onClick={() => setActiveMode('all')}
    >
    📊 All Tenders
    </button>
    <button
    className={`mode-toggle-btn ${activeMode === 'tor' ? 'active' : ''}`}
    onClick={() => setActiveMode('tor')}
    >
    <FiAward /> ToR Monitor
    </button>
    </div>
    <div className="filter-bar-actions">
    {hasActiveFilters() && (
      <button className="reset-filters-btn" onClick={resetFilters}>
      <FiX /> Reset All
      </button>
    )}
    </div>
    </div>

    <div className="filter-bar-grid">
    {/* Source Filter */}
    <div className="filter-group">
    <label className="filter-label">Source</label>
    <select
    className="filter-select"
    value={generalFilters.source}
    onChange={handleSourceChange}
    >
    <option value="all">All Sources</option>
    {sources.map(source => (
      <option key={source} value={source}>
      {source.toUpperCase()}
      </option>
    ))}
    </select>
    </div>

    {/* Search Filter */}
    <div className="filter-group">
    <label className="filter-label">Search</label>
    <div className="search-wrapper">
    <FiSearch className="search-icon" />
    <input
    type="text"
    className="search-input"
    value={generalFilters.searchTerm}
    onChange={handleSearchChange}
    placeholder="Search titles, refs, org..."
    />
    </div>
    </div>

    {/* Date From */}
    <div className="filter-group">
    <label className="filter-label">From Date</label>
    <input
    type="date"
    className="filter-input"
    value={generalFilters.dateFrom}
    onChange={handleDateFromChange}
    />
    </div>

    {/* Date To */}
    <div className="filter-group">
    <label className="filter-label">To Date</label>
    <input
    type="date"
    className="filter-input"
    value={generalFilters.dateTo}
    onChange={handleDateToChange}
    />
    </div>

    {/* Status Filter */}
    {showStatusFilter && activeMode === 'all' && (
      <div className="filter-group">
      <label className="filter-label">Status</label>
      <select
      className="filter-select"
      value={generalFilters.status}
      onChange={handleStatusChange}
      >
      <option value="all">All Status</option>
      <option value="active">Active</option>
      <option value="closed">Closed</option>
      </select>
      </div>
    )}
    </div>

    {/* ToR Specific Filters - Only show when in ToR mode */}
    {activeMode === 'tor' && (
      <div className="tor-filters-section">
      <button
      className="tor-filters-toggle"
      onClick={() => setShowTorFilters(!showTorFilters)}
      >
      {showTorFilters ? <FiChevronUp /> : <FiChevronDown />}
      ToR Specific Filters
      {hasActiveTorFilters() && <span className="filter-badge">Active</span>}
      </button>

      {showTorFilters && (
        <div className="tor-filters-content">
        <div className="tor-filters-grid">
        {/* Document Type Filter */}
        <div className="filter-group">
        <label className="filter-label">Document Type</label>
        <select
        className="filter-select"
        value={torFilters.documentType}
        onChange={handleDocumentTypeChange}
        >
        <option value="all">All Types</option>
        <option value="ToR">📋 Terms of Reference (ToR)</option>
        <option value="RFP">📄 Request for Proposal (RFP)</option>
        <option value="EOI">✉ Expression of Interest (EOI)</option>
        <option value="RFQ">💰 Request for Quotation (RFQ)</option>
        </select>
        </div>

        {/* Minimum Keywords Filter */}
        <div className="filter-group">
        <label className="filter-label">Minimum Keywords Match</label>
        <select
        className="filter-select"
        value={torFilters.minKeywords}
        onChange={handleMinKeywordsChange}
        >
        <option value="0">Any keywords</option>
        <option value="1">At least 1 keyword</option>
        <option value="2">At least 2 keywords</option>
        <option value="3">3+ keywords</option>
        </select>
        </div>

        {/* Checkbox Filters */}
        <div className="filter-group checkbox-group">
        <label className="checkbox-label">
        <input
        type="checkbox"
        checked={torFilters.showTorOnly}
        onChange={handleShowTorOnlyChange}
        />
        <span>Show only ToR-relevant items</span>
        </label>
        <label className="checkbox-label">
        <input
        type="checkbox"
        checked={torFilters.showOnlyNew}
        onChange={handleShowOnlyNewChange}
        />
        <span>Show only NEW items (not seen before)</span>
        </label>
        </div>
        </div>

        {/* Keywords Selection */}
        <div className="keywords-section">
        <label className="filter-label">Filter by Keywords (click to select)</label>
        <div className="keywords-cloud">
        {torKeywords.map(keyword => (
          <button
          key={keyword}
          className={`keyword-tag ${torFilters.selectedKeywords.includes(keyword) ? 'active' : ''}`}
          onClick={() => handleKeywordToggle(keyword)}
          >
          {keyword}
          </button>
        ))}
        </div>
        {torFilters.selectedKeywords.length > 0 && (
          <div className="selected-keywords">
          <span className="selected-label">Selected:</span>
          {torFilters.selectedKeywords.map(keyword => (
            <span key={keyword} className="selected-keyword-tag">
            {keyword}
            <button onClick={() => handleKeywordToggle(keyword)}>×</button>
            </span>
          ))}
          </div>
        )}
        </div>

        {/* Preset Filters */}
        <div className="preset-filters">
        <span className="preset-label">Quick Presets:</span>
        <button
        className="preset-btn"
        onClick={() => {
          setTorFilters({
            documentType: 'ToR',
            showTorOnly: true,
            showOnlyNew: true,
            minKeywords: 1,
            selectedKeywords: []
          });
        }}
        >
        🔍 New ToRs Only
        </button>
        <button
        className="preset-btn"
        onClick={() => {
          setTorFilters({
            documentType: 'all',
            showTorOnly: true,
            showOnlyNew: false,
            minKeywords: 2,
            selectedKeywords: ['Consultant', 'Technical Proposal']
          });
        }}
        >
        📊 High Relevance (2+ keywords)
        </button>
        <button
        className="preset-btn"
        onClick={() => {
          setTorFilters({
            documentType: 'all',
            showTorOnly: true,
            showOnlyNew: false,
            minKeywords: 1,
            selectedKeywords: ['Training', 'Capacity Building']
          });
        }}
        >
        🎓 Training Opportunities
        </button>
        <button
        className="preset-btn"
        onClick={() => {
          setTorFilters({
            documentType: 'EOI',
            showTorOnly: true,
            showOnlyNew: false,
            minKeywords: 1,
            selectedKeywords: []
          });
        }}
        >
        ✉ Expression of Interest (EOI)
        </button>
        </div>
        </div>
      )}
      </div>
    )}

    {/* Active Filters Display */}
    {hasActiveFilters() && (
      <div className="active-filters">
      <span className="active-filters-label">Active filters:</span>
      {generalFilters.source !== 'all' && (
        <span className="filter-tag">
        Source: {generalFilters.source.toUpperCase()}
        <button
        onClick={() => setGeneralFilters({ ...generalFilters, source: 'all' })}
        className="remove-filter"
        >
        ×
        </button>
        </span>
      )}
      {generalFilters.searchTerm && (
        <span className="filter-tag">
        Search: {generalFilters.searchTerm}
        <button
        onClick={() => setGeneralFilters({ ...generalFilters, searchTerm: '' })}
        className="remove-filter"
        >
        ×
        </button>
        </span>
      )}
      {generalFilters.status !== 'all' && (
        <span className="filter-tag">
        Status: {generalFilters.status}
        <button
        onClick={() => setGeneralFilters({ ...generalFilters, status: 'all' })}
        className="remove-filter"
        >
        ×
        </button>
        </span>
      )}
      {(generalFilters.dateFrom || generalFilters.dateTo) && (
        <span className="filter-tag">
        Date: {generalFilters.dateFrom || 'any'} to {generalFilters.dateTo || 'any'}
        <button
        onClick={() => setGeneralFilters({ ...generalFilters, dateFrom: '', dateTo: '' })}
        className="remove-filter"
        >
        ×
        </button>
        </span>
      )}
      {activeMode === 'tor' && torFilters.documentType !== 'all' && (
        <span className="filter-tag tor-tag">
        Type: {torFilters.documentType}
        <button
        onClick={() => setTorFilters({ ...torFilters, documentType: 'all' })}
        className="remove-filter"
        >
        ×
        </button>
        </span>
      )}
      {activeMode === 'tor' && torFilters.minKeywords > 0 && (
        <span className="filter-tag tor-tag">
        Min Keywords: {torFilters.minKeywords}
        <button
        onClick={() => setTorFilters({ ...torFilters, minKeywords: 0 })}
        className="remove-filter"
        >
        ×
        </button>
        </span>
      )}
      {activeMode === 'tor' && torFilters.showOnlyNew && (
        <span className="filter-tag tor-tag">
        Only NEW items
        <button
        onClick={() => setTorFilters({ ...torFilters, showOnlyNew: false })}
        className="remove-filter"
        >
        ×
        </button>
        </span>
      )}
      {activeMode === 'tor' && torFilters.selectedKeywords.length > 0 && (
        <span className="filter-tag tor-tag">
        Keywords: {torFilters.selectedKeywords.length} selected
        <button
        onClick={() => setTorFilters({ ...torFilters, selectedKeywords: [] })}
        className="remove-filter"
        >
        ×
        </button>
        </span>
      )}
      </div>
    )}
    </div>
  );
};

export default FilterBar;
