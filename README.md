# SocialGraphActivityFeed - Professional Testing Framework

A comprehensive, modularized testing framework for the Social Graph Activity Feed project, designed with industry best practices and full coverage reporting.

## 🏗️ Architecture Overview

This testing framework follows modern testing practices with:
- **Modular Structure**: Separated unit, integration, and E2E tests
- **Page Object Model**: For maintainable UI tests
- **Comprehensive Coverage**: Code coverage tracking and reporting
- **Professional Reporting**: HTML reports, screenshots, and detailed logs
- **CI/CD Ready**: Designed for automated testing pipelines
- **Qase Integration Ready**: Prepared for migration to Qase test management

## 📁 Directory Structure

```
tests/
├── __init__.py                 # Tests package initialization
├── conftest.py                 # Global pytest configuration
├── pytest.ini                 # Pytest settings (root level)
├── .coveragerc                 # Coverage configuration
├── requirements.txt            # Test dependencies
├── README.md                  # This documentation
│
├── unit/                      # Unit Tests
│   ├── __init__.py
│   └── test_utils.py         # Tests for testing utilities
│
├── integration/              # Integration Tests
│   ├── __init__.py
│   └── test_api.py          # API integration tests (to be created)
│
├── e2e/                     # End-to-End Tests
│   ├── __init__.py
│   └── test_complete_flows.py  # Modern E2E tests with Page Objects
│
├── pages/                   # Page Object Model
│   ├── __init__.py
│   ├── base_page.py        # Base page class
│   ├── feed_page.py        # Feed page interactions
│   └── network_page.py     # Network/follows page interactions
│
├── utils/                   # Testing Utilities
│   ├── __init__.py
│   ├── selenium_helpers.py  # Selenium utility classes
│   └── checklist.py        # Enhanced test step tracking
│
├── fixtures/                # Test Data & Fixtures
│   └── __init__.py
│
├── selenium/               # Legacy Selenium Tests (being migrated)
│   ├── conftest.py         # Selenium-specific configuration
│   ├── pytest.ini         # Selenium pytest settings
│   ├── test_e2e_full_flow.py
│   ├── feed_flow.py
│   ├── network_flow.py
│   └── utils/
│       ├── checklist.py    # Legacy checklist (deprecated)
│       └── __init__.py
│
└── reports/                # Generated Reports
    ├── coverage_html/      # HTML coverage reports
    ├── screenshots/        # Test failure screenshots
    ├── logs/              # Test execution logs
    └── *.html             # Pytest HTML reports
```

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Navigate to project root
cd /path/to/socialgraphactivityfeed

# Install test dependencies
python -m pip install -r tests/requirements.txt

# Setup test environment (creates directories, etc.)
python run_tests.py --setup
```

### 2. Run Tests

#### Using the Professional Test Runner (Recommended)

```bash
# Run all tests with full coverage
python run_tests.py --all

# Run specific test types
python run_tests.py --unit                    # Unit tests only
python run_tests.py --integration             # Integration tests only
python run_tests.py --e2e                     # E2E tests only
python run_tests.py --smoke                   # Smoke tests only

# Run with different browsers
python run_tests.py --e2e --browser chrome    # Chrome (default)
python run_tests.py --e2e --browser firefox   # Firefox

# Run in headless mode (faster, no UI)
python run_tests.py --all --headless

# Run tests in parallel (faster execution)
python run_tests.py --parallel --workers 4

# Clean up old reports
python run_tests.py --clean
```

#### Using Pytest Directly

```bash
# Basic test execution
pytest

# Run with coverage
pytest --cov=Backend/servidor --cov=Frontend/front-cinetrack/src --cov-report=html

# Run specific markers
pytest -m "smoke"                # Smoke tests only
pytest -m "e2e and not slow"     # E2E tests excluding slow ones
pytest -m "unit or integration"  # Unit and integration tests

# Run with specific browser
pytest --browser=firefox --headless tests/e2e/

# Generate HTML report
pytest --html=tests/reports/report.html --self-contained-html
```

## 🧪 Test Categories & Markers

### Test Markers

- `@pytest.mark.unit` - Unit tests (fast, isolated)
- `@pytest.mark.integration` - Integration tests (API, database)
- `@pytest.mark.e2e` - End-to-end tests (full user flows)
- `@pytest.mark.smoke` - Critical functionality tests
- `@pytest.mark.regression` - Regression tests
- `@pytest.mark.slow` - Tests that take longer to execute
- `@pytest.mark.api` - API-specific tests
- `@pytest.mark.ui` - User interface tests

## 📊 Coverage & Reporting

### Coverage Configuration

The framework tracks coverage for:
- `Backend/servidor/` - Node.js backend code
- `Frontend/front-cinetrack/src/` - React frontend code
- `tests/` - Test utilities and helpers

### Generated Reports

1. **HTML Coverage Report**: `tests/reports/coverage_html/index.html`
2. **XML Coverage Report**: `tests/reports/coverage.xml` (CI/CD compatible)
3. **Pytest HTML Report**: `tests/reports/pytest_report.html`
4. **Test Screenshots**: `tests/reports/screenshots/` (on failures)
5. **Execution Logs**: `tests/reports/test.log`

## 🎯 Page Object Model

### Architecture

Our E2E tests use the Page Object Model for maintainable UI tests:

```python
from tests.pages.feed_page import FeedPage
from tests.pages.network_page import NetworkPage

def test_user_journey(driver, test_config):
    # Initialize page objects
    feed = FeedPage(driver, test_config["base_url"])
    network = NetworkPage(driver, test_config["base_url"])
    
    # Use page methods for interactions
    feed.navigate_to_feed()
    feed.like_first_post()
    
    network.navigate_to_network()
    network.follow_user("testuser")
```

## 🔧 Configuration

### Environment Variables

```bash
# Test configuration
export BASE_URL="https://dj07hexl3m0a6.cloudfront.net"
export API_URL="http://localhost:3000/api"
export TEST_ENV="staging"
export BROWSER="chrome"
export HEADLESS="false"
export TEST_TIMEOUT="30"
```

## 📈 Advanced Features

### Parallel Execution

```bash
# Run tests in parallel
python run_tests.py --parallel --workers 4
```

### Screenshot Capture

Screenshots are automatically captured on test failures and stored in `tests/reports/screenshots/`.

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: python run_tests.py --setup
      - name: Run tests
        run: python run_tests.py --all --headless
```

## 🔮 Migration to Qase

The framework is designed for easy migration to Qase test management with detailed step tracking and comprehensive execution metadata.

## �️ Development Guidelines

### Adding New Tests

1. **Unit Tests**: Add to `tests/unit/` for isolated component testing
2. **Integration Tests**: Add to `tests/integration/` for API/database testing
3. **E2E Tests**: Add to `tests/e2e/` using Page Object Model
4. **Page Objects**: Create new page classes in `tests/pages/`

### Best Practices

1. **Use descriptive test names**: `test_user_can_like_and_unlike_post`
2. **Add appropriate markers**: `@pytest.mark.smoke`, `@pytest.mark.e2e`
3. **Use Page Objects for UI tests**: Maintain separation of concerns
4. **Add error handling**: Include try/catch with screenshots
5. **Use checklist for detailed tracking**: Especially in E2E tests