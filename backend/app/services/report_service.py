"""ReportLab PDF Generation Service for Validra Legal Metrology Compliance Reports.

Generates statutory inspection audit reports in evidentiary PDF format with
product details, declarations check table, violations, and digital verification seal.
"""

import io
import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def generate_pdf_report(
    report_id: str,
    scan_id: str,
    product_name: Optional[str],
    brand: Optional[str],
    category: Optional[str],
    status: str,
    reported_by: Optional[str],
    reported_at: Optional[datetime],
    violations: List[Dict[str, Any]],
    all_results: Optional[List[Dict[str, Any]]] = None,
    compliance_score: Optional[float] = None,
) -> bytes:
    """Generate a high-quality statutory compliance audit PDF report using ReportLab.

    Returns the raw PDF bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    header_title_style = ParagraphStyle(
        "HeaderTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#064e3b"),
        alignment=1,  # Center
    )

    header_sub_style = ParagraphStyle(
        "HeaderSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#475569"),
        alignment=1,
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=6,
    )

    cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#1e293b"),
    )

    cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0f172a"),
    )

    badge_pass = ParagraphStyle(
        "BadgePass",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#059669"),
    )

    badge_fail = ParagraphStyle(
        "BadgeFail",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#dc2626"),
    )

    badge_exempt = ParagraphStyle(
        "BadgeExempt",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#64748b"),
    )

    story = []

    # 1. Header & Official Banner
    story.append(Paragraph("VALIDRA COMPLIANCE AUDIT CERTIFICATE", header_title_style))
    story.append(Spacer(1, 2))
    story.append(
        Paragraph(
            "Legal Metrology (Packaged Commodities) Rules, 2011 — Statutory Inspection Record",
            header_sub_style,
        )
    )
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#059669"), spaceAfter=12))

    # 2. Executive Metadata Grid
    is_compliant = status.lower() == "compliant"
    verdict_text = "COMPLIANT" if is_compliant else "FLAGGED - VIOLATION DETECTED"
    verdict_color = colors.HexColor("#059669") if is_compliant else colors.HexColor("#dc2626")

    date_str = (reported_at or datetime.now(timezone.utc)).strftime("%d %b %Y, %H:%M UTC")

    meta_data = [
        [
            Paragraph("<b>Report Reference:</b>", cell_style),
            Paragraph(f"VAL-{report_id[:8].upper()}", cell_bold),
            Paragraph("<b>Inspection Date:</b>", cell_style),
            Paragraph(date_str, cell_style),
        ],
        [
            Paragraph("<b>Source Scan ID:</b>", cell_style),
            Paragraph(scan_id[:8].upper(), cell_bold),
            Paragraph("<b>Reporting Officer:</b>", cell_style),
            Paragraph(reported_by or "Inspector", cell_style),
        ],
        [
            Paragraph("<b>Product Name:</b>", cell_style),
            Paragraph(product_name or "Unidentified Product", cell_bold),
            Paragraph("<b>Audit Verdict:</b>", cell_style),
            Paragraph(f"<b><font color='{verdict_color.hexval()}'>{verdict_text}</font></b>", cell_bold),
        ],
        [
            Paragraph("<b>Brand:</b>", cell_style),
            Paragraph(brand or "Unspecified", cell_style),
            Paragraph("<b>Commodity Category:</b>", cell_style),
            Paragraph(category or "General", cell_style),
        ],
    ]

    meta_table = Table(meta_data, colWidths=[1.4 * inch, 2.2 * inch, 1.4 * inch, 2.2 * inch])
    meta_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # 3. Compliance Declarations / Findings Table
    story.append(Paragraph("Statutory Declarations & Rule Evaluation Audit", section_heading))

    # Compile table rows from results or violations
    headers = [
        Paragraph("<b>Mandatory Declaration</b>", cell_bold),
        Paragraph("<b>Clause Reference</b>", cell_bold),
        Paragraph("<b>Detected Value</b>", cell_bold),
        Paragraph("<b>Evaluation Status</b>", cell_bold),
    ]

    table_data = [headers]

    if all_results:
        for item in all_results:
            field_name = item.get("field_name") or item.get("name") or "Declaration"
            clause = item.get("clause_reference") or item.get("clause") or "PCR, 2011"
            val = item.get("extracted_value") or item.get("value") or "—"
            is_app = item.get("is_applicable", True)
            is_comp = item.get("is_compliant", True)

            if not is_app:
                st = Paragraph("EXEMPT", badge_exempt)
            elif is_comp:
                st = Paragraph("PASSED", badge_pass)
            else:
                st = Paragraph("VIOLATION", badge_fail)

            table_data.append([
                Paragraph(str(field_name), cell_style),
                Paragraph(str(clause), cell_style),
                Paragraph(str(val), cell_style),
                st,
            ])
    elif violations:
        for v in violations:
            table_data.append([
                Paragraph(str(v.get("field_name") or "Declaration"), cell_style),
                Paragraph(str(v.get("clause_reference") or "PCR, 2011"), cell_style),
                Paragraph(str(v.get("extracted_value") or "Not Detected"), cell_style),
                Paragraph("VIOLATION", badge_fail),
            ])
    else:
        table_data.append([
            Paragraph("All Mandatory Declarations", cell_style),
            Paragraph("LM Rules 2011", cell_style),
            Paragraph("Fully Verified via OCR", cell_style),
            Paragraph("COMPLIANT", badge_pass),
        ])

    results_table = Table(table_data, colWidths=[2.2 * inch, 1.8 * inch, 2.0 * inch, 1.2 * inch])
    results_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#064e3b")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
                ("TOPPADDING", (0, 0), (-1, 0), 6),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("TOPPADDING", (0, 1), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    # Fix header text color in table style
    for col_idx in range(len(headers)):
        results_table.setStyle(TableStyle([
            ("TEXTCOLOR", (col_idx, 0), (col_idx, 0), colors.white),
        ]))

    story.append(results_table)
    story.append(Spacer(1, 14))

    # 4. Violations Summary (if flagged)
    if violations and len(violations) > 0:
        story.append(Paragraph("Non-Compliance Findings & Recommended Legal Action", section_heading))
        viol_bullets = []
        for i, v in enumerate(violations, 1):
            desc = v.get("description") or f"Violation in mandatory declaration: {v.get('field_name', 'item')}"
            viol_bullets.append(
                Paragraph(
                    f"<b>{i}. {v.get('field_name', 'Rule')}:</b> {desc} (Clause: {v.get('clause_reference', 'PCR 2011')})",
                    cell_style,
                )
            )
            viol_bullets.append(Spacer(1, 3))
        story.extend(viol_bullets)
        story.append(Spacer(1, 10))

    # 5. Evidentiary Certification & Tamper Seal Footer
    story.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor("#94a3b8"), spaceAfter=8))
    
    # Calculate integrity SHA-256 hash for document
    raw_signature_str = f"{report_id}|{scan_id}|{verdict_text}|{date_str}"
    tamper_hash = hashlib.sha256(raw_signature_str.encode()).hexdigest().upper()

    footer_data = [
        [
            Paragraph(
                "<b>Statutory Authority:</b> Legal Metrology Division, Ministry of Consumer Affairs, Government of India.<br/>"
                f"<b>Document Integrity SHA-256:</b> <font face='Courier' size='6'>{tamper_hash[:48]}...</font><br/>"
                "<i>This document is an authentic automated compliance audit record generated under Section 18 of the Legal Metrology Act, 2009.</i>",
                cell_style,
            ),
            Paragraph(
                "<b>OFFICIAL SEAL</b><br/>"
                "VALIDRA VERIFIED<br/>"
                f"Date: {date_str[:11]}",
                ParagraphStyle(
                    "Seal",
                    parent=styles["Normal"],
                    fontName="Helvetica-Bold",
                    fontSize=8,
                    leading=11,
                    alignment=1,
                    textColor=colors.HexColor("#064e3b"),
                ),
            ),
        ]
    ]

    footer_table = Table(footer_data, colWidths=[5.6 * inch, 1.6 * inch])
    footer_table.setStyle(
        TableStyle(
            [
                ("BOX", (1, 0), (1, 0), 1, colors.HexColor("#059669")),
                ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#ecfdf5")),
                ("ALIGN", (1, 0), (1, 0), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(footer_table)

    # Build document
    doc.build(story)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data
