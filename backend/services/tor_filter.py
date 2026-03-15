# backend/services/tor_filter.py
# import re
# from datetime import datetime

class ToRFilter:
    """Filter opportunities for ToR monitoring"""

    # Keywords that must match (at least one)
    KEYWORDS = [
            'baseline', 'mid-term', 'midline', 'endline',
            'final evaluation', 'impact evaluation', 'studies',
            'assessment', 'research', 'study', 'monitoring',
            'consultancy firm', 'consulting firm'
            ]

    # Document types to identify
    DOC_TYPES = {
            'ToR': ['terms of reference', 'tor ', 'tor:'],
            'RFP': ['request for proposal', 'rfp ', 'rfp:'],
            'EOI': ['expression of interest', 'eoi ', 'eoi:'],
            'RFQ': ['request for quotation', 'rfq ', 'rfq:']
            }

    def filter_notices(self, all_notices):
        """Apply all filters to notices"""
        filtered = []

        for notice in all_notices:
            # Must be Bangladesh related
            if not self._is_bangladesh(notice):
                continue

            # Must match at least one keyword
            matched_keywords = self._get_matching_keywords(notice)
            if not matched_keywords:
                continue

            # Add document type classification
            notice['document_type'] = self._classify_doc_type(notice)
            notice['matched_keywords'] = matched_keywords
            notice['relevance_score'] = len(matched_keywords)
            notice['match_reason'] = f"Matches: {', '.join(matched_keywords)}"

            filtered.append(notice)

        return filtered

    def _is_bangladesh(self, notice):
        """Check if notice is for Bangladesh"""
        text = str(notice.get('country', '')).upper() + ' ' + \
                str(notice.get('place', '')).upper() + ' ' + \
                str(notice.get('title', '')).upper() + ' ' + \
                str(notice.get('description', '')).upper()

        # Check for Bangladesh indicators
        if 'BANGLADESH' in text or 'BD' in text or 'DHAKA' in text:
            return True

        # Check for Bangladesh-specific sources
        if notice.get('source') in ['bppa', 'cptu', 'bdjobs']:
            return True

        return False

    def _get_matching_keywords(self, notice):
        """Get all keywords that match in the notice"""
        text = (notice.get('title', '') + ' ' +
                notice.get('description', '') + ' ' +
                notice.get('summary', '') + ' ' +
                notice.get('notes', '')).lower()

        matches = []
        for keyword in self.KEYWORDS:
            if keyword.lower() in text:
                matches.append(keyword)

        return matches

    def _classify_doc_type(self, notice):
        """Classify the document type (ToR/RFP/EOI/RFQ)"""
        text = (notice.get('title', '') + ' ' +
                notice.get('description', '') + ' ' +
                notice.get('summary', '')).lower()

        for doc_type, patterns in self.DOC_TYPES.items():
            for pattern in patterns:
                if pattern in text:
                    return doc_type

        # Try to detect from source-specific fields
        if notice.get('notice_type'):
            if 'RFP' in notice['notice_type']:
                return 'RFP'
            if 'EOI' in notice['notice_type']:
                return 'EOI'
            if 'RFQ' in notice['notice_type']:
                return 'RFQ'

        return 'Other'
