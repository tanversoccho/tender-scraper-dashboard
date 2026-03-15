# backend/services/daily_reporter.py
from datetime import datetime


class DailyReporter:
    """Generate daily digest reports"""

    def __init__(self, memory_tracker):
        self.memory_tracker = memory_tracker

    def generate_digest(self, new_notices, sites_scanned):
        """Generate a formatted daily digest"""

        # Count by document type
        doc_types = {}
        for notice in new_notices:
            doc_type = notice.get('document_type', 'Other')
            doc_types[doc_type] = doc_types.get(doc_type, 0) + 1

        # Count by source
        sources = {}
        for notice in new_notices:
            source = notice.get('source', 'unknown')
            sources[source] = sources.get(source, 0) + 1

        # Build the report
        report = f"""
🔍 **TENDER DIGEST REPORT**
📅 **{datetime.now().strftime('%B %d, %Y')}**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔎 **OVERVIEW**
• New Opportunities Today: {len(new_notices)}
• Sites Scanned: {sites_scanned}
• Document Types: {', '.join([f'{k}: {v}' for k, v in doc_types.items()])}

📌 **NEW OPPORTUNITIES TODAY**
"""

        for i, notice in enumerate(new_notices[:10], 1):  # Show top 10
            report += f"""
{i}. 📋 **{notice.get('title', 'No Title')}**
   🏢 Organization: {notice.get('organization') or notice.get('procuring_entity') or 'Not specified'}
   ⏳ Deadline: {notice.get('deadline') or notice.get('closing_date') or 'Not specified'}
   📄 Type: {notice.get('document_type', 'Unknown')}
   🔗 Link: {notice.get('link') or notice.get('detail_url') or '#'}
   🎯 Relevance: {notice.get('match_reason', 'Matches Bangladesh criteria')}
"""

        if len(new_notices) > 10:
            report += f"\n   ... and {len(new_notices) - 10} more opportunities"

        report += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 **ANALYTICS SUMMARY**
• New ToRs Today: {doc_types.get('ToR', 0)}
• Total Opportunities: {len(new_notices)}
• Sites with New Posts: {len(sources)}
• Top Source: {max(sources.items(), key=lambda x: x[1])[0] if sources else 'None'}

📅 **UPCOMING DEADLINES**
"""

        # Add deadlines (next 7 days)
        from datetime import timedelta
        today = datetime.now()
        next_week = today + timedelta(days=7)

        deadlines = []
        for notice in new_notices:
            deadline_str = notice.get('deadline') or notice.get('closing_date')
            if deadline_str:
                deadlines.append({
                    'title': notice.get('title'),
                    'deadline': deadline_str,
                    'link': notice.get('link') or notice.get('detail_url')
                    })

        if deadlines:
            for d in deadlines[:5]:
                report += f"  • {d['deadline']}: {d['title'][:50]}...\n"
        else:
            report += "  No upcoming deadlines found\n"

        return report

    def generate_html_digest(self, new_notices, sites_scanned):
        """Generate HTML version for email/web display"""
        html = f"""
        <div style="font-family: 'Fira Code', monospace; max-width: 800px; margin: 0 auto;">
            <h2 style="color: #ebbcba;">🔍 Tender Digest Report</h2>
            <p style="color: #e0def4;">📅 {datetime.now().strftime('%B %d, %Y')}</p>

            <div style="background: #1f1d2e; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #f6c177;">Overview</h3>
                <p>New Opportunities: <strong>{len(new_notices)}</strong></p>
                <p>Sites Scanned: <strong>{sites_scanned}</strong></p>
            </div>

            <h3 style="color: #c4a7e7;">New Opportunities</h3>
        """

        for notice in new_notices[:5]:
            html += f"""
            <div style="background: #26233a; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #31748f;">
                <h4 style="color: #e0def4; margin: 0 0 10px 0;">{notice.get('title', 'No Title')}</h4>
                <p style="color: #908caa; margin: 5px 0;">🏢 {notice.get('organization') or 'Not specified'}</p>
                <p style="color: #908caa; margin: 5px 0;">⏳ Deadline: {notice.get('deadline') or 'Not specified'}</p>
                <p style="color: #908caa; margin: 5px 0;">📄 Type: {notice.get('document_type', 'Unknown')}</p>
                <a href="{notice.get('link') or '#'}" style="color: #ebbcba;">View Original ↗</a>
            </div>
            """

        return html
