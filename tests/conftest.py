"""
Global pytest configuration and fixtures.

This file contains shared fixtures and configuration that can be used
across all test modules in the project.
"""

import os
import sys
import json
import pytest
import logging
from pathlib import Path
from dotenv import load_dotenv
from faker import Faker

# Add project root to Python path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

# Load environment variables
load_dotenv()

# Configure logging for tests
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(PROJECT_ROOT / 'tests' / 'reports' / 'test.log'),
        logging.StreamHandler()
    ]
)

@pytest.fixture(scope="session")
def project_root():
    """Return the project root directory."""
    return PROJECT_ROOT

@pytest.fixture(scope="session")
def test_config():
    """Load test configuration."""
    config = {
        "base_url": os.getenv("BASE_URL", "https://dj07hexl3m0a6.cloudfront.net"),
        "api_url": os.getenv("API_URL", "http://localhost:3000/api"),
        "timeout": int(os.getenv("TEST_TIMEOUT", "30")),
        "headless": os.getenv("HEADLESS", "false").lower() == "true",
        "browser": os.getenv("BROWSER", "chrome"),
        "environment": os.getenv("TEST_ENV", "staging")
    }
    return config

@pytest.fixture(scope="session")
def faker_instance():
    """Return a Faker instance for generating test data."""
    return Faker(['es_ES', 'en_US'])

@pytest.fixture
def test_data():
    """Generate common test data."""
    fake = Faker(['es_ES'])
    return {
        "user": {
            "username": fake.user_name(),
            "email": fake.email(),
            "name": fake.name(),
            "password": "TestPassword123!"
        },
        "publication": {
            "title": fake.sentence(nb_words=4),
            "content": fake.text(max_nb_chars=200),
            "tags": [fake.word() for _ in range(3)]
        },
        "comment": {
            "content": fake.sentence(nb_words=8)
        }
    }

@pytest.fixture(autouse=True)
def setup_test_environment(request):
    """Automatically setup test environment for each test."""
    # Create reports directory if it doesn't exist
    reports_dir = PROJECT_ROOT / 'tests' / 'reports'
    reports_dir.mkdir(exist_ok=True, parents=True)
    
    # Log test start
    logging.info(f"Starting test: {request.node.name}")
    
    yield
    
    # Log test completion
    logging.info(f"Completed test: {request.node.name}")

@pytest.fixture
def mock_api_response():
    """Mock API response for unit tests."""
    return {
        "success": True,
        "data": {"id": 1, "message": "Test data"},
        "error": None
    }

# Pytest hooks
def pytest_configure(config):
    """Configure pytest with custom settings."""
    # Add custom markers
    config.addinivalue_line("markers", "api: mark test as API test")
    config.addinivalue_line("markers", "ui: mark test as UI test")
    config.addinivalue_line("markers", "database: mark test as database test")

def pytest_collection_modifyitems(config, items):
    """Modify test collection to add automatic markers based on file location."""
    for item in items:
        # Add markers based on test file location
        if "unit" in str(item.fspath):
            item.add_marker(pytest.mark.unit)
        elif "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        elif "e2e" in str(item.fspath) or "selenium" in str(item.fspath):
            item.add_marker(pytest.mark.e2e)

def pytest_runtest_setup(item):
    """Setup hook that runs before each test."""
    # Skip slow tests if --fast flag is used
    if item.config.getoption("--fast") and "slow" in item.keywords:
        pytest.skip("Skipping slow test in fast mode")

def pytest_addoption(parser):
    """Add custom command line options."""
    parser.addoption(
        "--fast",
        action="store_true",
        default=False,
        help="Skip slow tests"
    )
    parser.addoption(
        "--env",
        action="store",
        default="staging",
        help="Test environment (dev, staging, prod)"
    )