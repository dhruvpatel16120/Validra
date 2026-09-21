"""Test suite for JWT Dual-Security verification, Extraction Normalization, and Core Endpoints."""

import pytest
from datetime import timedelta
from jose import jwt
from app.core.config import settings
from app.core.security import create_access_token, decode_and_verify_jwt, get_jwt_secret
from app.services.extraction_service import _coerce
from app.services.rule_engine import check_language_compliant


def test_jwt_verification_valid():
    """Verify valid token decodes correctly with user claims."""
    token = create_access_token({
        "sub": "user-uuid-12345",
        "email": "inspector.test@validra.gov.in",
        "role": "inspector",
        "name": "Inspector Sharma",
    })
    claims = decode_and_verify_jwt(token)
    assert claims["user_id"] == "user-uuid-12345"
    assert claims["email"] == "inspector.test@validra.gov.in"
    assert claims["role"] == "inspector"
    assert claims["full_name"] == "Inspector Sharma"


def test_jwt_verification_tampered():
    """Verify tampered token is rejected."""
    token = create_access_token({"sub": "user-123", "email": "legit@test.com"})
    # Tamper with the signature
    tampered_token = token[:-5] + "XXXXX"
    with pytest.raises(Exception):
        decode_and_verify_jwt(tampered_token)


def test_jwt_verification_expired():
    """Verify expired token raises error."""
    token = create_access_token(
        {"sub": "user-123", "email": "legit@test.com"},
        expires_delta=timedelta(seconds=-10)
    )
    with pytest.raises(Exception):
        decode_and_verify_jwt(token)


def test_extraction_coercion_units():
    """Test unit normalization in extraction service."""
    # Test kg to g conversion
    payload_kg = {
        "commodity_name": "Basmati Rice",
        "net_quantity": "5 kg",
        "package_weight_value": "5",
        "package_weight_unit": "kg",
        "category": "food",
    }
    result_kg = _coerce(payload_kg)
    assert result_kg["package_weight_value"] == 5000.0
    assert result_kg["package_weight_unit"] == "g"
    assert result_kg["category"] == "food"

    # Test litre to ml conversion
    payload_litre = {
        "commodity_name": "Mustard Oil",
        "net_quantity": "1 litre",
        "package_weight_value": "1",
        "package_weight_unit": "litre",
        "category": "food",
    }
    result_litre = _coerce(payload_litre)
    assert result_litre["package_weight_value"] == 1000.0
    assert result_litre["package_weight_unit"] == "ml"


def test_language_compliance():
    """Test Devanagari and English language validation."""
    devanagari_text = "शुद्ध घी 500 ग्राम"
    english_text = "Pure Desi Ghee 500g"
    mixed_text = "Ghee घी MRP 350"
    non_compliant_text = "1234567890 !@#$%"

    assert check_language_compliant(devanagari_text) is True
    assert check_language_compliant(english_text) is True
    assert check_language_compliant(mixed_text) is True
    assert check_language_compliant(non_compliant_text) is False


def test_health_check_endpoint(client):
    """Test health check route."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_verify_token_endpoint(client):
    """Test POST /api/auth/verify-token with NextAuth token."""
    token = create_access_token({
        "sub": "user-999",
        "email": "officer@validra.gov.in",
        "role": "inspector",
        "name": "Field Officer"
    })
    response = client.post("/api/auth/verify-token", json={"token": token})
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["email"] == "officer@validra.gov.in"
    assert data["role"] == "inspector"


def test_verify_token_invalid_endpoint(client):
    """Test POST /api/auth/verify-token with bad token."""
    response = client.post("/api/auth/verify-token", json={"token": "invalid.jwt.token"})
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
