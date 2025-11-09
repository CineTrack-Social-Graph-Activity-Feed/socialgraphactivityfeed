"""
Base Page Object class for all page objects.

Provides common functionality and utilities that all page objects inherit.
"""

from typing import Optional, Tuple, List
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from tests.utils.selenium_helpers import WebDriverUtils


class BasePage:
    """
    Base page object class that provides common functionality for all pages.
    
    This class encapsulates common web page interactions and provides
    a foundation for specific page object implementations.
    """
    
    def __init__(self, driver: WebDriver, base_url: str = ""):
        """
        Initialize base page object.
        
        Args:
            driver: WebDriver instance
            base_url: Base URL of the application
        """
        self.driver = driver
        self.base_url = base_url
        self.utils = WebDriverUtils(driver)
        
        # Common page elements that might exist on multiple pages
        self.loading_spinner = (By.CLASS_NAME, "loading")
        self.error_message = (By.CLASS_NAME, "error-message")
        self.success_message = (By.CLASS_NAME, "success-message")
    
    def navigate_to(self, path: str = "") -> None:
        """
        Navigate to a specific path.
        
        Args:
            path: Path to append to base URL
        """
        url = f"{self.base_url.rstrip('/')}/{path.lstrip('/')}" if path else self.base_url
        self.driver.get(url)
        self.wait_for_page_load()
    
    def wait_for_page_load(self, timeout: int = 30) -> bool:
        """
        Wait for page to fully load.
        
        Args:
            timeout: Maximum time to wait for page load
            
        Returns:
            bool: True if page loaded successfully
        """
        return self.utils.wait_for_page_load(timeout)
    
    def wait_for_element_visible(self, locator: Tuple[By, str], timeout: int = 15) -> WebElement:
        """
        Wait for an element to be visible.
        
        Args:
            locator: Element locator tuple
            timeout: Maximum wait time
            
        Returns:
            WebElement: The visible element
        """
        return self.utils.wait_for_element_visible(locator, timeout)
    
    def wait_for_element_clickable(self, locator: Tuple[By, str], timeout: int = 15) -> WebElement:
        """
        Wait for an element to be clickable.
        
        Args:
            locator: Element locator tuple
            timeout: Maximum wait time
            
        Returns:
            WebElement: The clickable element
        """
        return self.utils.wait_for_element_clickable(locator, timeout)
    
    def click_element(self, locator: Tuple[By, str], timeout: int = 15) -> bool:
        """
        Click an element safely.
        
        Args:
            locator: Element locator tuple
            timeout: Maximum wait time
            
        Returns:
            bool: True if click was successful
        """
        return self.utils.safe_click(locator, timeout)
    
    def send_keys_to_element(self, locator: Tuple[By, str], text: str, 
                            clear_first: bool = True, timeout: int = 15) -> bool:
        """
        Send keys to an element safely.
        
        Args:
            locator: Element locator tuple
            text: Text to send
            clear_first: Whether to clear the field first
            timeout: Maximum wait time
            
        Returns:
            bool: True if sending keys was successful
        """
        return self.utils.safe_send_keys(locator, text, clear_first, timeout)
    
    def get_element_text(self, locator: Tuple[By, str], timeout: int = 15) -> Optional[str]:
        """
        Get text from an element safely.
        
        Args:
            locator: Element locator tuple
            timeout: Maximum wait time
            
        Returns:
            Optional[str]: Element text or None if not found
        """
        return self.utils.get_text_safe(locator, timeout)
    
    def is_element_present(self, locator: Tuple[By, str], timeout: int = 3) -> bool:
        """
        Check if an element is present.
        
        Args:
            locator: Element locator tuple
            timeout: Maximum wait time
            
        Returns:
            bool: True if element is present
        """
        return self.utils.is_element_present(locator, timeout)
    
    def is_element_visible(self, locator: Tuple[By, str], timeout: int = 3) -> bool:
        """
        Check if an element is visible.
        
        Args:
            locator: Element locator tuple
            timeout: Maximum wait time
            
        Returns:
            bool: True if element is visible
        """
        return self.utils.is_element_visible(locator, timeout)
    
    def scroll_to_element(self, locator: Tuple[By, str], timeout: int = 15) -> bool:
        """
        Scroll to an element.
        
        Args:
            locator: Element locator tuple
            timeout: Maximum wait time
            
        Returns:
            bool: True if scroll was successful
        """
        return self.utils.scroll_to_element(locator, timeout)
    
    def wait_for_loading_to_complete(self, timeout: int = 30) -> bool:
        """
        Wait for any loading indicators to disappear.
        
        Args:
            timeout: Maximum wait time
            
        Returns:
            bool: True if loading completed
        """
        try:
            if self.is_element_present(self.loading_spinner, timeout=1):
                self.utils.wait.until_not(
                    lambda driver: self.is_element_visible(self.loading_spinner, timeout=1)
                )
            return True
        except TimeoutException:
            return False
    
    def get_error_message(self) -> Optional[str]:
        """
        Get error message if present.
        
        Returns:
            Optional[str]: Error message text or None
        """
        return self.get_element_text(self.error_message, timeout=3)
    
    def get_success_message(self) -> Optional[str]:
        """
        Get success message if present.
        
        Returns:
            Optional[str]: Success message text or None
        """
        return self.get_element_text(self.success_message, timeout=3)
    
    def take_screenshot(self, filename: str) -> str:
        """
        Take a screenshot and save it.
        
        Args:
            filename: Filename for the screenshot
            
        Returns:
            str: Path to the saved screenshot
        """
        from pathlib import Path
        screenshots_dir = Path("tests/reports/screenshots")
        screenshots_dir.mkdir(parents=True, exist_ok=True)
        
        screenshot_path = screenshots_dir / filename
        self.driver.save_screenshot(str(screenshot_path))
        return str(screenshot_path)
    
    @property
    def current_url(self) -> str:
        """Get current page URL."""
        return self.driver.current_url
    
    @property
    def page_title(self) -> str:
        """Get current page title."""
        return self.driver.title