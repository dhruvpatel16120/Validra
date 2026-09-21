"""Email Service for dispatching Legal Metrology violation reports.

Compatible with standard SMTP / Nodemailer environment configuration.
"""

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging
from typing import Any, Dict, List, Optional
import aiosmtplib

from app.core.config import settings

logger = logging.getLogger("validra.email")


async def send_violation_report_email(
    scan_id: str,
    product_name: Optional[str],
    brand: Optional[str],
    category: Optional[str],
    violations: List[Dict[str, Any]],
    recipient_email: Optional[str] = None
) -> bool:
    """Send an official Legal Metrology violation notice email via SMTP."""
    recipient = recipient_email or settings.REPORT_RECIPIENT_EMAIL
    if not recipient:
        logger.info("No recipient configured for violation report email; skipping dispatch.")
        return False

    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.info(
            f"SMTP credentials not fully configured (SMTP_HOST={settings.SMTP_HOST}, "
            f"SMTP_USER={'set' if settings.SMTP_USER else 'empty'}). "
            f"Report {scan_id} filed locally without outgoing email."
        )
        return False

    subject = f"[Validra Alert] Legal Metrology Violation Report: {product_name or 'Unlabeled Commodity'} (Scan #{scan_id[:8]})"

    # Format HTML body
    violations_html = "".join([
        f"""
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; font-weight: bold; color: #1e293b;">{v.get('field_name', 'Declaration')}</td>
            <td style="padding: 10px; font-family: monospace; color: #047857;">{v.get('clause_reference', 'N/A')}</td>
            <td style="padding: 10px; color: #b91c1c;">{v.get('extracted_value') or 'MISSING / NON-COMPLIANT'}</td>
            <td style="padding: 10px; font-size: 12px; color: #64748b;">{v.get('description', '')}</td>
        </tr>
        """
        for v in violations
    ])

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 20px; color: #334155;">
        <div style="max-width: 650px; margin: 0 auto; background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 20px;">
                <h2 style="color: #065f46; margin: 0; font-size: 20px;">Validra — Legal Metrology Compliance Notice</h2>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">Automated Non-Compliance Escalation (PCR, 2011)</p>
            </div>

            <p style="font-size: 14px; line-height: 1.5;">
                A product label inspection was conducted using the Validra Automated Metrology Scanner and identified non-compliant statutory declarations requiring administrative review.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                <tr><td style="padding: 4px 0; color: #64748b;">Product Name:</td><td style="font-weight: 600;">{product_name or 'Unknown'}</td></tr>
                <tr><td style="padding: 4px 0; color: #64748b;">Brand:</td><td style="font-weight: 600;">{brand or 'Unknown'}</td></tr>
                <tr><td style="padding: 4px 0; color: #64748b;">Category:</td><td style="font-weight: 600; text-transform: uppercase;">{category or 'General'}</td></tr>
                <tr><td style="padding: 4px 0; color: #64748b;">Scan Reference:</td><td style="font-family: monospace;">{scan_id}</td></tr>
            </table>

            <h3 style="font-size: 15px; color: #0f172a; margin-top: 16px; margin-bottom: 8px;">Identified Metrology Violations</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #f1f5f9; color: #475569;">
                        <th style="padding: 8px 10px;">Mandatory Field</th>
                        <th style="padding: 8px 10px;">Legal Clause</th>
                        <th style="padding: 8px 10px;">Detected Value</th>
                        <th style="padding: 8px 10px;">Condition</th>
                    </tr>
                </thead>
                <tbody>
                    {violations_html}
                </tbody>
            </table>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8;">
                This violation report was compiled automatically under the Legal Metrology (Packaged Commodities) Rules, 2011.
            </div>
        </div>
    </body>
    </html>
    """

    message = MIMEMultipart("alternative")
    message["From"] = settings.EMAIL_FROM
    message["To"] = recipient
    message["Subject"] = subject
    message.attach(MIMEText(html_content, "html"))

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True if settings.SMTP_PORT == 587 else False,
            use_tls=True if settings.SMTP_PORT == 465 else False,
            timeout=15,
        )
        logger.info(f"Violation report email successfully dispatched to {recipient} for scan {scan_id}")
        return True
    except Exception as exc:
        logger.error(f"Failed to dispatch violation report email via SMTP: {exc}")
        return False
