// src/services/torService.js
// Helper functions for ToR monitoring

export const TOR_KEYWORDS = [
  'baseline', 'mid-term', 'midline', 'endline',
  'final evaluation', 'impact evaluation', 'studies',
  'assessment', 'research', 'study', 'monitoring',
  'consultancy firm', 'consulting firm'
];

export const DOCUMENT_TYPES = {
  ToR: ['terms of reference', 'tor ', 'tor:', 'reference of terms'],
  RFP: ['request for proposal', 'rfp ', 'rfp:', 'proposal request'],
  EOI: ['expression of interest', 'eoi ', 'eoi:', 'interest expression'],
  RFQ: ['request for quotation', 'rfq ', 'rfq:', 'quotation request']
};

// Detect document type from tender
export const detectDocumentType = (tender) => {
  const text = (
    (tender.title || '') + ' ' +
    (tender.description || '') + ' ' +
    (tender.summary || '') + ' ' +
    (tender.notes || '') + ' ' +
    (tender.procurement_type || '') + ' ' +
    (tender.notice_type || '')
  ).toLowerCase();
  
  for (const [docType, patterns] of Object.entries(DOCUMENT_TYPES)) {
    for (const pattern of patterns) {
      if (text.includes(pattern)) {
        return docType;
      }
    }
  }
  
  // Check source-specific fields
  if (tender.notice_type) {
    if (tender.notice_type.includes('RFP')) return 'RFP';
    if (tender.notice_type.includes('EOI')) return 'EOI';
    if (tender.notice_type.includes('RFQ')) return 'RFQ';
  }
  
  // Check title for common patterns
  const title = (tender.title || '').toLowerCase();
  if (title.includes('terms of reference') || title.includes('tor')) return 'ToR';
  if (title.includes('request for proposal') || title.includes('rfp')) return 'RFP';
  if (title.includes('expression of interest') || title.includes('eoi')) return 'EOI';
  if (title.includes('request for quotation') || title.includes('rfq')) return 'RFQ';
  
  return 'Other';
};

// Get matching keywords
export const getMatchingKeywords = (tender) => {
  const text = (
    (tender.title || '') + ' ' +
    (tender.description || '') + ' ' +
    (tender.summary || '') + ' ' +
    (tender.notes || '')
  ).toLowerCase();
  
  return TOR_KEYWORDS.filter(keyword => 
    text.includes(keyword.toLowerCase())
  );
};

// Check if tender is ToR-relevant (matches at least one keyword)
export const isTorRelevant = (tender) => {
  return getMatchingKeywords(tender).length > 0;
};

// Format for ToR export
export const formatForTorExport = (tender, index) => {
  const keywords = getMatchingKeywords(tender);
  
  return {
    'SL No': index + 1,
    'Title': tender.title || 'N/A',
    'Link': tender.link || tender.detail_url || tender.url || '#',
    'Organization': tender.organization || tender.procuring_entity || 'N/A',
    'Deadline': tender.deadline || tender.closing_date || 'N/A',
    'Type': detectDocumentType(tender),
    'Summary': (tender.description || tender.summary || '').substring(0, 200),
    'Why Matches': keywords.join(', ') || 'Bangladesh opportunity',
    'Date Found': tender.scraped_at ? new Date(tender.scraped_at).toLocaleDateString() : new Date().toLocaleDateString(),
    'Source': tender.source?.toUpperCase() || 'N/A'
  };
};

// Export as object for convenience
export const torService = {
  TOR_KEYWORDS,
  DOCUMENT_TYPES,
  detectDocumentType,
  getMatchingKeywords,
  isTorRelevant,
  formatForTorExport
};
