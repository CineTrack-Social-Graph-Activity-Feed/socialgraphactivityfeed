"""
Unit tests for Selenium Helpers module.

Tests the critical WebDriver utilities that power all E2E tests.
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.common.exceptions import TimeoutException, NoSuchElementException

from tests.utils.selenium_helpers import WebDriverUtils, wait_vis, wait_css


class TestWebDriverUtils:
    """Test suite for WebDriverUtils class."""
    
    @pytest.fixture
    def mock_driver(self):
        """Create a mock WebDriver for testing."""
        driver = Mock(spec=WebDriver)
        driver.execute_script = Mock()
        driver.switch_to = Mock()
        return driver
    
    @pytest.fixture
    def mock_element(self):
        """Create a mock WebElement for testing."""
        element = Mock(spec=WebElement)
        element.text = "Sample Text"
        element.click = Mock()
        element.send_keys = Mock()
        element.clear = Mock()
        return element
    
    @pytest.fixture
    def utils(self, mock_driver):
        """Create WebDriverUtils instance with mock driver."""
        return WebDriverUtils(mock_driver, default_timeout=10)
    
    def test_init_default_timeout(self, mock_driver):
        """Test WebDriverUtils initialization with default timeout."""
        utils = WebDriverUtils(mock_driver)
        assert utils.driver == mock_driver
        assert utils.default_timeout == 15
        assert utils.wait is not None
    
    def test_init_custom_timeout(self, mock_driver):
        """Test WebDriverUtils initialization with custom timeout."""
        utils = WebDriverUtils(mock_driver, default_timeout=20)
        assert utils.default_timeout == 20
    
    @patch('tests.utils.selenium_helpers.WebDriverWait')
    def test_wait_for_element_visible_success(self, mock_wait_class, utils, mock_element):
        """Test successful element visibility wait."""
        # Setup mock
        mock_wait_instance = Mock()
        mock_wait_class.return_value = mock_wait_instance
        mock_wait_instance.until.return_value = mock_element
        
        # Test
        locator = (By.ID, "test-id")
        result = utils.wait_for_element_visible(locator)
        
        # Verify
        assert result == mock_element
        mock_wait_class.assert_called_with(utils.driver, 10)
    
    @patch('tests.utils.selenium_helpers.WebDriverWait')
    def test_wait_for_element_visible_timeout(self, mock_wait_class, utils):
        """Test element visibility wait with timeout."""
        # Setup mock to raise TimeoutException
        mock_wait_instance = Mock()
        mock_wait_class.return_value = mock_wait_instance
        mock_wait_instance.until.side_effect = TimeoutException()
        
        # Test
        locator = (By.ID, "test-id")
        with pytest.raises(TimeoutException):
            utils.wait_for_element_visible(locator)
    
    @patch('tests.utils.selenium_helpers.WebDriverWait')
    def test_wait_for_element_clickable_success(self, mock_wait_class, utils, mock_element):
        """Test successful element clickable wait."""
        mock_wait_instance = Mock()
        mock_wait_class.return_value = mock_wait_instance
        mock_wait_instance.until.return_value = mock_element
        
        locator = (By.CLASS_NAME, "clickable-btn")
        result = utils.wait_for_element_clickable(locator)
        
        assert result == mock_element
    
    @patch('tests.utils.selenium_helpers.WebDriverWait')
    def test_safe_click_success(self, mock_wait_class, utils, mock_element):
        """Test successful safe click."""
        mock_wait_instance = Mock()
        mock_wait_class.return_value = mock_wait_instance
        mock_wait_instance.until.return_value = mock_element
        
        locator = (By.ID, "click-me")
        result = utils.safe_click(locator)
        
        assert result is True
        mock_element.click.assert_called_once()
    
    @patch('tests.utils.selenium_helpers.WebDriverWait')
    def test_safe_click_failure(self, mock_wait_class, utils):
        """Test safe click with element not found."""
        mock_wait_instance = Mock()
        mock_wait_class.return_value = mock_wait_instance
        mock_wait_instance.until.side_effect = TimeoutException()
        
        locator = (By.ID, "missing-element")
        result = utils.safe_click(locator)
        
        assert result is False
    
    @patch('tests.utils.selenium_helpers.WebDriverWait')
    def test_safe_send_keys_success_with_clear(self, mock_wait_class, utils, mock_element):
        """Test successful safe send keys with clear first."""
        mock_wait_instance = Mock()
        mock_wait_class.return_value = mock_wait_instance
        mock_wait_instance.until.return_value = mock_element
        
        locator = (By.NAME, "username")
        text = "testuser"
        result = utils.safe_send_keys(locator, text, clear_first=True)
        
        assert result is True
        mock_element.clear.assert_called_once()
        mock_element.send_keys.assert_called_once_with(text)
    
    @patch('tests.utils.selenium_helpers.WebDriverWait')
    def test_safe_send_keys_no_clear(self, mock_wait_class, utils, mock_element):
        """Test safe send keys without clearing first."""
        mock_wait_instance = Mock()
        mock_wait_class.return_value = mock_wait_instance
        mock_wait_instance.until.return_value = mock_element
        
        locator = (By.NAME, "comment")
        text = "Additional text"
        result = utils.safe_send_keys(locator, text, clear_first=False)
        
        assert result is True
        mock_element.clear.assert_not_called()
        mock_element.send_keys.assert_called_once_with(text)
    
    @patch('tests.utils.selenium_helpers.WebDriverWait')
    def test_get_text_safe_success(self, mock_wait_class, utils, mock_element):
        """Test successful safe text retrieval."""
        mock_wait_instance = Mock()
        mock_wait_class.return_value = mock_wait_instance
        mock_wait_instance.until.return_value = mock_element
        mock_element.text = "  Sample Text  "
        
        locator = (By.TAG_NAME, "h1")
        result = utils.get_text_safe(locator)
        
        assert result == "Sample Text"  # Should be stripped
    
    @patch('tests.utils.selenium_helpers.WebDriverWait')
    def test_get_text_safe_element_not_found(self, mock_wait_class, utils):
        """Test safe text retrieval with element not found."""
        mock_wait_instance = Mock()
        mock_wait_class.return_value = mock_wait_instance
        mock_wait_instance.until.side_effect = TimeoutException()
        
        locator = (By.ID, "missing-text")
        result = utils.get_text_safe(locator)
        
        assert result is None
    
    @patch('tests.utils.selenium_helpers.WebDriverWait')
    def test_is_element_present_true(self, mock_wait_class, utils, mock_element):
        """Test element presence check - element present."""
        mock_wait_instance = Mock()
        mock_wait_class.return_value = mock_wait_instance
        mock_wait_instance.until.return_value = mock_element
        
        locator = (By.ID, "present-element")
        result = utils.is_element_present(locator)
        
        assert result is True
    
    @patch('tests.utils.selenium_helpers.WebDriverWait')
    def test_is_element_present_false(self, mock_wait_class, utils):
        """Test element presence check - element not present."""
        mock_wait_instance = Mock()
        mock_wait_class.return_value = mock_wait_instance
        mock_wait_instance.until.side_effect = TimeoutException()
        
        locator = (By.ID, "absent-element")
        result = utils.is_element_present(locator, timeout=1)
        
        assert result is False
    
    @patch('tests.utils.selenium_helpers.WebDriverWait')
    def test_scroll_to_element_success(self, mock_wait_class, utils, mock_element):
        """Test successful scroll to element."""
        mock_wait_instance = Mock()
        mock_wait_class.return_value = mock_wait_instance
        mock_wait_instance.until.return_value = mock_element
        
        locator = (By.ID, "scroll-target")
        
        with patch('time.sleep'):  # Mock sleep to speed up tests
            result = utils.scroll_to_element(locator)
        
        assert result is True
        utils.driver.execute_script.assert_called_once()
        
    @patch('tests.utils.selenium_helpers.WebDriverWait')
    def test_wait_for_page_load_success(self, mock_wait_class, utils):
        """Test successful page load wait."""
        mock_wait_instance = Mock()
        mock_wait_class.return_value = mock_wait_instance
        mock_wait_instance.until.return_value = True
        
        result = utils.wait_for_page_load()
        
        assert result is True
    
    @patch('tests.utils.selenium_helpers.WebDriverWait')
    def test_wait_for_page_load_timeout(self, mock_wait_class, utils):
        """Test page load wait with timeout."""
        mock_wait_instance = Mock()
        mock_wait_class.return_value = mock_wait_instance
        mock_wait_instance.until.side_effect = TimeoutException()
        
        result = utils.wait_for_page_load(timeout=5)
        
        assert result is False


class TestCompatibilityFunctions:
    """Test backward compatibility functions."""
    
    @patch('tests.utils.selenium_helpers.WebDriverUtils')
    def test_wait_vis_function(self, mock_utils_class):
        """Test wait_vis backward compatibility function."""
        mock_driver = Mock()
        mock_element = Mock()
        mock_utils_instance = Mock()
        mock_utils_class.return_value = mock_utils_instance
        mock_utils_instance.wait_for_element_visible.return_value = mock_element
        
        locator = (By.ID, "test-element")
        result = wait_vis(mock_driver, locator, timeout=20)
        
        assert result == mock_element
        mock_utils_class.assert_called_once_with(mock_driver, 20)
        mock_utils_instance.wait_for_element_visible.assert_called_once_with(locator, 20)
    
    @patch('tests.utils.selenium_helpers.WebDriverUtils')
    def test_wait_css_function(self, mock_utils_class):
        """Test wait_css backward compatibility function."""
        mock_driver = Mock()
        mock_element = Mock()
        mock_utils_instance = Mock()
        mock_utils_class.return_value = mock_utils_instance
        mock_utils_instance.wait_for_element_visible.return_value = mock_element
        
        selector = ".my-class"
        result = wait_css(mock_driver, selector, timeout=10)
        
        assert result == mock_element
        mock_utils_class.assert_called_once_with(mock_driver, 10)
        mock_utils_instance.wait_for_element_visible.assert_called_once_with(
            (By.CSS_SELECTOR, selector), 10
        )


@pytest.mark.unit
class TestFrameContextManager:
    """Test frame switching context manager functionality."""
    
    def test_frame_context_manager_creation(self):
        """Test that frame context manager can be created."""
        mock_driver = Mock()
        utils = WebDriverUtils(mock_driver)
        
        # Test that the context manager is created without errors
        frame_locator = (By.ID, "test-frame")
        context_manager = utils.switch_to_frame_and_back(frame_locator)
        
        assert context_manager is not None
        # Note: Full context manager testing would require more complex mocking
        # of frame switching behavior, which could be added in integration tests