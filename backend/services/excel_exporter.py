# backend/services/excel_exporter.py
import pandas as pd
from datetime import datetime
import os


class ExcelExporter:
    """Export filtered notices to Excel with ToR-specific columns"""

    def export_to_excel(self, notices, filename=None):
        """Export notices to Excel file"""
        if not filename:
            filename = f"Bangladesh_ToR_Report_{datetime.now().strftime('%Y%m%d')}.xlsx"

        # Prepare data with required columns
        data = []
        for notice in notices:
            data.append({
                'Title': notice.get('title', ''),
                'Link': notice.get('link') or notice.get('detail_url') or notice.get('url', ''),
                'Organization': notice.get('organization') or notice.get('procuring_entity', ''),
                'Deadline': notice.get('deadline') or notice.get('closing_date', ''),
                'Type': notice.get('document_type', 'Other'),
                'Summary': (notice.get('description') or notice.get('summary') or '')[:200],
                'Why Matches': notice.get('match_reason', 'Bangladesh-based opportunity'),
                'Date Found': notice.get('scraped_at', datetime.now().isoformat())[:10],
                'Source': notice.get('source', ''),
                'Reference': notice.get('reference_no') or notice.get('ref_no') or notice.get('project_id', ''),
                'Status': notice.get('status', 'Active')
                })

        if not data:
            return None

        # Create DataFrame
        df = pd.DataFrame(data)

        # Save to Excel
        df.to_excel(filename, index=False, engine='openpyxl')

        return filename

    def export_summary_report(self, notices_by_source, filename=None):
        """Export a summary report with stats"""
        if not filename:
            filename = f"ToR_Summary_{datetime.now().strftime('%Y%m%d')}.xlsx"

        with pd.ExcelWriter(filename, engine='openpyxl') as writer:
            # Summary sheet
            summary = []
            for source, notices in notices_by_source.items():
                tor_count = sum(1 for n in notices if n.get('document_type') == 'ToR')
                summary.append({
                    'Source': source,
                    'Total Notices': len(notices),
                    'ToR Documents': tor_count,
                    'RFP/EOI': len(notices) - tor_count,
                    'Last Updated': datetime.now().strftime('%Y-%m-%d %H:%M')
                    })

            if summary:
                pd.DataFrame(summary).to_excel(writer, sheet_name='Summary', index=False)

            # Individual source sheets
            for source, notices in notices_by_source.items():
                if notices:
                    df = pd.DataFrame(notices)
                    df.to_excel(writer, sheet_name=source.upper()[:30], index=False)

        return filename
