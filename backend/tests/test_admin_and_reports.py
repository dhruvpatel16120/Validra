"""Integration tests for Admin endpoints, Reports, Dashboard, and Rules."""

import pytest
from app.core.security import create_access_token


@pytest.fixture
def admin_token():
    return create_access_token({
        "sub": "admin-user-001",
        "email": "admin@validra.gov.in",
        "role": "admin",
        "name": "Super Admin"
    })


@pytest.fixture
def inspector_token():
    return create_access_token({
        "sub": "inspector-user-002",
        "email": "inspector@validra.gov.in",
        "role": "inspector",
        "name": "Inspector Field"
    })


def test_public_rules_checklist(client):
    """Test GET /api/rules returns checklist."""
    res = client.get("/api/rules")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data


def test_dashboard_endpoint(client, inspector_token):
    """Test GET /api/dashboard with inspector auth."""
    headers = {"Authorization": f"Bearer {inspector_token}"}
    res = client.get("/api/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_scans" in data
    assert "compliance_rate" in data
    assert "trend" in data
    assert "top_violations" in data


def test_admin_dashboard_endpoint(client, admin_token):
    """Test GET /api/admin/dashboard with admin auth."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/admin/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_scans" in data
    assert "total_users" in data
    assert "total_reports" in data


def test_admin_forbidden_for_non_admin(client, inspector_token):
    """Test that inspector cannot access /api/admin routes."""
    headers = {"Authorization": f"Bearer {inspector_token}"}
    res = client.get("/api/admin/dashboard", headers=headers)
    assert res.status_code == 403


def test_admin_rules_crud(client, admin_token):
    """Test Admin Legal Metrology rule creation and listing."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create rule
    create_payload = {
        "field_name": "test_declaration",
        "clause_reference": "Rule 99(1)",
        "description": "Test statutory declaration",
        "validation_type": "presence",
        "applicable_categories": ["general"],
        "is_active": True
    }
    create_res = client.post("/api/admin/rules", json=create_payload, headers=headers)
    assert create_res.status_code == 201
    rule_data = create_res.json()
    rule_id = rule_data["rule_id"]
    assert rule_data["field_name"] == "test_declaration"

    # List rules
    list_res = client.get("/api/admin/rules", headers=headers)
    assert list_res.status_code == 200
    assert any(r["rule_id"] == rule_id for r in list_res.json()["items"])

    # Update rule
    update_res = client.patch(
        f"/api/admin/rules/{rule_id}",
        json={"description": "Updated description"},
        headers=headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["description"] == "Updated description"

    # Deactivate rule
    del_res = client.delete(f"/api/admin/rules/{rule_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["deactivated"] is True


def test_admin_scans_and_csv_export(client, admin_token):
    """Test querying admin scans and exporting to CSV."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Query scans list
    list_res = client.get("/api/admin/scans", headers=headers)
    assert list_res.status_code == 200
    assert "items" in list_res.json()

    # CSV Export
    csv_res = client.get("/api/admin/scans?export_csv=true", headers=headers)
    assert csv_res.status_code == 200
    assert csv_res.headers["content-type"].startswith("text/csv")
    assert "Scan ID,Product Name,Brand" in csv_res.text


def test_admin_reports_queue(client, admin_token):
    """Test querying admin reports queue."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/admin/reports", headers=headers)
    assert res.status_code == 200
    assert "items" in res.json()


def test_reportlab_pdf_generation_direct():
    """Test generating ReportLab PDF certificate directly."""
    from app.services.report_service import generate_pdf_report

    pdf_bytes = generate_pdf_report(
        report_id="11111111-2222-3333-4444-555555555555",
        scan_id="66666666-7777-8888-9999-000000000000",
        product_name="Wheat Flour 5kg",
        brand="Aashirvaad",
        category="food",
        status="compliant",
        reported_by="Inspector Sharma",
        reported_at=None,
        violations=[],
        all_results=[
            {
                "field_name": "mrp",
                "clause_reference": "Rule 6(1)(e)",
                "extracted_value": "Rs. 240",
                "is_applicable": True,
                "is_compliant": True,
            },
            {
                "field_name": "net_quantity",
                "clause_reference": "Rule 6(1)(f)",
                "extracted_value": "5 kg",
                "is_applicable": True,
                "is_compliant": True,
            },
        ],
        compliance_score=100.0,
    )
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 500
    assert pdf_bytes.startswith(b"%PDF")


def test_report_pdf_endpoint_not_found(client):
    """Test GET /api/reports/{id}/pdf returns 404 for nonexistent report."""
    res = client.get("/api/reports/00000000-0000-0000-0000-000000000000/pdf")
    assert res.status_code == 404


def test_inspection_pdf_endpoint_not_found(client):
    """Test GET /api/inspections/{id}/pdf returns 404 for nonexistent inspection."""
    res = client.get("/api/inspections/00000000-0000-0000-0000-000000000000/pdf")
    assert res.status_code == 404

