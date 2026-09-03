import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure app package is in Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
