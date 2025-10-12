"""
Selenium WebDriver utilities and helpers.

This module provides common utilities, wait conditions, and helper methods
for Selenium-based E2E tests.
"""

import time
from typing import Tuple, Optional, List, Union
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.common.exceptions import TimeoutException, NoSuchElementException


class WebDriverUtils:
    """Utility class for common WebDriver operations."""
    
    def __init__(self, driver: WebDriver, default_timeout: int = 15):
        """
        Initialize WebDriver utilities.
        
        Args:
            driver: WebDriver instance
            default_timeout: Default timeout for wait operations
        """
        self.driver = driver
        self.default_timeout = default_timeout
        self.wait = WebDriverWait(driver, default_timeout)
    
    def wait_for_element_visible(self, locator: Tuple[By, str], timeout: Optional[int] = None) -> WebElement:
        """
        Wait for an element to be visible and return it.
        
        Args:
            locator: Tuple of (By, selector_string)
            timeout: Custom timeout, uses default if None
            
        Returns:
            WebElement: The visible element
            
        Raises:
            TimeoutException: If element is not visible within timeout
        """
        wait_time = timeout or self.default_timeout
        wait = WebDriverWait(self.driver, wait_time)
        return wait.until(EC.visibility_of_element_located(locator))
    
    def wait_for_element_clickable(self, locator: Tuple[By, str], timeout: Optional[int] = None) -> WebElement:
        """
        Wait for an element to be clickable and return it.
        
        Args:
            locator: Tuple of (By, selector_string)
            timeout: Custom timeout, uses default if None
            
        Returns:
            WebElement: The clickable element
        """
        wait_time = timeout or self.default_timeout
        wait = WebDriverWait(self.driver, wait_time)
        return wait.until(EC.element_to_be_clickable(locator))
    
    def wait_for_elements_visible(self, locator: Tuple[By, str], timeout: Optional[int] = None) -> List[WebElement]:
        """
        Wait for multiple elements to be visible and return them.
        
        Args:
            locator: Tuple of (By, selector_string)
            timeout: Custom timeout, uses default if None
            
        Returns:
            List[WebElement]: List of visible elements
        """
        wait_time = timeout or self.default_timeout
        wait = WebDriverWait(self.driver, wait_time)
        return wait.until(EC.visibility_of_all_elements_located(locator))
    
    def wait_for_text_present(self, locator: Tuple[By, str], text: str, timeout: Optional[int] = None) -> bool:
        """
        Wait for specific text to be present in an element.
        
        Args:
            locator: Tuple of (By, selector_string)
            text: Text to wait for
            timeout: Custom timeout, uses default if None
            
        Returns:
            bool: True if text is present
        """
        wait_time = timeout or self.default_timeout
        wait = WebDriverWait(self.driver, wait_time)
        return wait.until(EC.text_to_be_present_in_element(locator, text))
    
    def safe_click(self, locator: Tuple[By, str], timeout: Optional[int] = None) -> bool:
        """
        Safely click an element with wait and error handling.
        
        Args:
            locator: Tuple of (By, selector_string)
            timeout: Custom timeout, uses default if None
            
        Returns:
            bool: True if click was successful
        """
        try:
            element = self.wait_for_element_clickable(locator, timeout)
            element.click()
            return True
        except (TimeoutException, NoSuchElementException):
            return False
    
    def safe_send_keys(self, locator: Tuple[By, str], text: str, 
                       clear_first: bool = True, timeout: Optional[int] = None) -> bool:
        """
        Safely send keys to an element with wait and error handling.
        
        Args:
            locator: Tuple of (By, selector_string)
            text: Text to send
            clear_first: Whether to clear the field first
            timeout: Custom timeout, uses default if None
            
        Returns:
            bool: True if sending keys was successful
        """
        try:
            element = self.wait_for_element_visible(locator, timeout)
            if clear_first:
                element.clear()
            element.send_keys(text)
            return True
        except (TimeoutException, NoSuchElementException):
            return False
    
    def get_text_safe(self, locator: Tuple[By, str], timeout: Optional[int] = None) -> Optional[str]:
        """
        Safely get text from an element.
        
        Args:
            locator: Tuple of (By, selector_string)
            timeout: Custom timeout, uses default if None
            
        Returns:
            Optional[str]: Element text or None if not found
        """
        try:
            element = self.wait_for_element_visible(locator, timeout)
            return element.text.strip()
        except (TimeoutException, NoSuchElementException):
            return None
    
    def is_element_present(self, locator: Tuple[By, str], timeout: int = 3) -> bool:
        """
        Check if an element is present in the DOM.
        
        Args:
            locator: Tuple of (By, selector_string)
            timeout: Timeout for checking presence
            
        Returns:
            bool: True if element is present
        """
        try:
            wait = WebDriverWait(self.driver, timeout)
            wait.until(EC.presence_of_element_located(locator))
            return True
        except TimeoutException:
            return False
    
    def is_element_visible(self, locator: Tuple[By, str], timeout: int = 3) -> bool:
        """
        Check if an element is visible.
        
        Args:
            locator: Tuple of (By, selector_string)
            timeout: Timeout for checking visibility
            
        Returns:
            bool: True if element is visible
        """
        try:
            wait = WebDriverWait(self.driver, timeout)
            wait.until(EC.visibility_of_element_located(locator))
            return True
        except TimeoutException:
            return False
    
    def scroll_to_element(self, locator: Tuple[By, str], timeout: Optional[int] = None) -> bool:
        """
        Scroll to an element to bring it into view.
        
        Args:
            locator: Tuple of (By, selector_string)
            timeout: Custom timeout, uses default if None
            
        Returns:
            bool: True if scroll was successful
        """
        try:
            element = self.wait_for_element_visible(locator, timeout)
            self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", element)
            time.sleep(0.5)  # Small delay for smooth scrolling
            return True
        except (TimeoutException, NoSuchElementException):
            return False
    
    def wait_for_page_load(self, timeout: Optional[int] = None) -> bool:
        """
        Wait for page to be completely loaded.
        
        Args:
            timeout: Custom timeout, uses default if None
            
        Returns:
            bool: True if page loaded successfully
        """
        wait_time = timeout or self.default_timeout
        try:
            wait = WebDriverWait(self.driver, wait_time)
            wait.until(lambda driver: driver.execute_script("return document.readyState") == "complete")
            return True
        except TimeoutException:
            return False
    
    def switch_to_frame_and_back(self, frame_locator: Union[Tuple[By, str], str, int, WebElement]):
        """
        Context manager for switching to a frame and automatically switching back.
        
        Args:
            frame_locator: Frame locator (element, name, id, or index)
        """
        class FrameContextManager:
            def __init__(self, driver, frame_loc):
                self.driver = driver
                self.frame_locator = frame_loc
            
            def __enter__(self):
                if isinstance(self.frame_locator, tuple):
                    frame_element = WebDriverWait(self.driver, 10).until(
                        EC.presence_of_element_located(self.frame_locator)
                    )
                    self.driver.switch_to.frame(frame_element)
                else:
                    self.driver.switch_to.frame(self.frame_locator)
                return self.driver
            
            def __exit__(self, exc_type, exc_val, exc_tb):
                self.driver.switch_to.default_content()
        
        return FrameContextManager(self.driver, frame_locator)


# Convenience functions for backward compatibility
def wait_vis(driver: WebDriver, locator: Tuple[By, str], timeout: int = 15) -> WebElement:
    """Wait for element visibility - backward compatibility function."""
    utils = WebDriverUtils(driver, timeout)
    return utils.wait_for_element_visible(locator, timeout)

def wait_css(driver: WebDriver, selector: str, timeout: int = 15) -> WebElement:
    """Wait for CSS selector visibility - backward compatibility function."""
    utils = WebDriverUtils(driver, timeout)
    return utils.wait_for_element_visible((By.CSS_SELECTOR, selector), timeout)