"""Unit tests for administrative security audit logs and incident monitoring."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

client = TestClient(app)


def get_admin_headers():
    token = create_access_token(
        data={"sub": "cmu4i6axh0000lts0168h7r8q", "email": "admin@validra.gov.in", "role": "admin"}
    )
    return {"Authorization": f"Bearer {token}"}


def get_inspector_headers():
    token = create_access_token(
        data={"sub": "cmu4i7wyq0000ltbc76s7m9f5", "email": "inspector@validra.gov.in", "role": "inspector"}
    )
    return {"Authorization": f"Bearer {token}"}


def test_list_audit_logs_unauthorized():
    """Unauthenticated users cannot view security audit trail."""
    resp = client.get("/api/admin/audit-logs")
    assert resp.status_code in [401, 403]


def test_list_audit_logs_forbidden_for_inspector():
    """Field inspectors cannot view administrative security audit trail."""
    headers = get_inspector_headers()
    resp = client.get("/api/admin/audit-logs", headers=headers)
    assert resp.status_code == 403


def test_create_and_acknowledge_audit_log():
    """Admin can append an event and acknowledge an active alert."""
    headers = get_admin_headers()
    create_payload = {
        "action": "IP_BLOCKED",
        "entity_type": "security",
        "entity_id": "203.0.113.55",
        "severity": "HIGH",
        "status": "SECURITY_ALERT",
        "description": "Suspicious payload injection detected; IP isolated.",
        "metadata": {"reason": "SQLi attempt in user agent"},
    }

    create_resp = client.post("/api/admin/audit-logs", json=create_payload, headers=headers)
    assert create_resp.status_code == 201
    created = create_resp.json()
    log_id = created["id"]
    assert created["status"] == "SECURITY_ALERT"
    assert created["acknowledged_by"] is None

    # Acknowledge the alert
    ack_resp = client.post(f"/api/admin/audit-logs/{log_id}/acknowledge", headers=headers)
    assert ack_resp.status_code == 200
    ack_data = ack_resp.json()
    assert ack_data["status"] == "ACKNOWLEDGED"
    assert ack_data["acknowledged_by"] is not None
    assert ack_data["acknowledged_at"] is not None


def test_list_audit_logs_success():
    """Admin can query security audit logs."""
    headers = get_admin_headers()
    resp = client.get("/api/admin/audit-logs", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    if len(data) > 0:
        first = data[0]
        assert "id" in first
        assert "action" in first
        assert "severity" in first
        assert "status" in first


def test_audit_logs_filter_by_severity():
    """Querying with severity filter returns matching items."""
    headers = get_admin_headers()
    # Create a CRITICAL event first
    client.post(
        "/api/admin/audit-logs",
        json={
            "action": "BRUTE_FORCE_TRIGGER",
            "entity_type": "security",
            "entity_id": "AUTH_PORTAL",
            "severity": "CRITICAL",
            "status": "SECURITY_ALERT",
            "description": "Multiple consecutive failed logins.",
        },
        headers=headers,
    )
    resp = client.get("/api/admin/audit-logs?severity=CRITICAL", headers=headers)
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) > 0
    for item in items:
        assert item["severity"] == "CRITICAL"


def test_audit_logs_stats():
    """Admin can retrieve telemetry counts."""
    headers = get_admin_headers()
    resp = client.get("/api/admin/audit-logs/stats", headers=headers)
    assert resp.status_code == 200
    stats = resp.json()
    assert "total_events" in stats
    assert "critical_alerts" in stats
    assert "unacknowledged_alerts" in stats



def test_export_audit_csv():
    """Admin can download court-admissible CSV export."""
    headers = get_admin_headers()
    resp = client.get("/api/admin/audit-logs/export", headers=headers)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("content-type", "")
    assert "Event ID,Timestamp (UTC)" in resp.text
