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
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from tests.utils.checklist import TestChecklist

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
    """
    Load test configuration with environment-aware URLs.
    
    Uses environment variables to determine URLs:
    - In CI/CD: Uses FRONTEND_URL and BACKEND_URL env vars (deployed URLs)
    - In local dev: Defaults to localhost
    """
    # Determine if running in CI/CD
    is_ci = os.getenv("CI", "false").lower() == "true"
    
    # Use deployed URLs in CI/CD, localhost in local development
    if is_ci:
        base_url = os.getenv("FRONTEND_URL", "https://dj07hexl3m0a6.cloudfront.net")
        api_url = os.getenv("BACKEND_URL", "https://socialgraphbe.cine-track.com.ar/api")
    else:
        base_url = os.getenv("BASE_URL", "http://localhost:5173")
        api_url = os.getenv("API_URL", "http://localhost:3000/api")
    
    config = {
        "base_url": base_url,
        "api_url": api_url,
        "timeout": int(os.getenv("TEST_TIMEOUT", "30")),
        "headless": os.getenv("HEADLESS", "true" if is_ci else "false").lower() == "true",
        "browser": os.getenv("BROWSER", "chrome"),
        "environment": "ci" if is_ci else "development",
        "is_ci": is_ci
    }
    
    logging.info(f"Test configuration loaded:")
    logging.info(f"  Environment: {config['environment']}")
    logging.info(f"  Frontend URL: {config['base_url']}")
    logging.info(f"  Backend URL: {config['api_url']}")
    logging.info(f"  Headless: {config['headless']}")
    
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

@pytest.fixture(scope="function")
def driver(test_config):
    """WebDriver fixture for E2E tests."""
    options = Options()
    
    if test_config["headless"] or os.getenv("CI"):
        options.add_argument("--headless=new")
    
    options.add_argument("--start-maximized")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    
    try:
        driver_path = ChromeDriverManager().install()
        service = Service(driver_path)
        driver = webdriver.Chrome(service=service, options=options)
        driver.implicitly_wait(10)
        
        yield driver
        
        driver.quit()
    except Exception as e:
        pytest.skip(f"WebDriver not available: {e}")

@pytest.fixture(scope="function")
def checklist(request):
    """Checklist fixture for tracking test steps."""
    test_name = request.node.name
    module_name = request.node.module.__name__
    
    checklist = TestChecklist(
        test_name=test_name,
        module_name=module_name,
        started_at=datetime.now()
    )
    
    yield checklist
    
    # Log summary after test
    if checklist.failed > 0:
        logging.error(f"Test {test_name} had {checklist.failed} failed steps")
    else:
        logging.info(f"Test {test_name} completed successfully")

@pytest.fixture(scope="session")
def api_session():
    """Requests session for API tests."""
    import requests
    session = requests.Session()
    session.headers.update({
        "User-Agent": "CineTrack-Test-Suite/1.0",
        "Accept": "application/json"
    })
    
    yield session
    
    session.close()

@pytest.fixture
def setup_test_timing(request):
    """Track test execution time."""
    start_time = datetime.now()
    
    yield
    
    duration = (datetime.now() - start_time).total_seconds()
    logging.info(f"Test {request.node.name} took {duration:.2f}s")

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