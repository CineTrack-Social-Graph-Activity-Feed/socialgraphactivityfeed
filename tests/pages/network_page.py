"""
Network/Follows Page Object for social graph management.

Contains locators and methods for interacting with the follows/followers page.
"""

from typing import List, Optional, Tuple
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from tests.pages.base_page import BasePage
from tests.utils.checklist import TestChecklist
import time


class NetworkPage(BasePage):
    """
    Page object for the network/follows page.
    
    Provides methods for managing follows, followers, and user interactions.
    """
    
    # Page URL
    PAGE_PATH = "/follows"
    
    # Tab locators
    TAB_SEGUIDOS = (By.XPATH, "//div[contains(@class,'tabs')]/button[contains(@class,'tab-button') and normalize-space()='SEGUIDOS']")
    TAB_SEGUIDORES = (By.XPATH, "//div[contains(@class,'tabs')]/button[contains(@class,'tab-button') and normalize-space()='SEGUIDORES']")
    
    # User list locators
    USER_LIST = (By.CSS_SELECTOR, ".user-list")
    USER_ROWS = (By.CSS_SELECTOR, ".user-list .user-row")
    FOLLOW_BUTTONS = (By.CSS_SELECTOR, ".follow-btn")
    
    # User info locators
    USER_AVATAR = (By.CLASS_NAME, "user-avatar")
    USER_NAME = (By.CLASS_NAME, "user-name")
    USER_USERNAME = (By.CLASS_NAME, "user-username")
    
    # Confirmation dialog locators
    CONFIRM_BUTTON = (By.CSS_SELECTOR, ".confirm-btn")
    CANCEL_BUTTON = (By.CSS_SELECTOR, ".cancel-btn")
    MODAL_DIALOG = (By.CLASS_NAME, "modal")
    
    def navigate_to_network(self) -> None:
        """Navigate to the network/follows page."""
        self.navigate_to(self.PAGE_PATH)
    
    def wait_for_network_page_load(self, timeout: int = 15) -> bool:
        """
        Wait for the network page to load completely.
        
        Args:
            timeout: Maximum wait time
            
        Returns:
            bool: True if page loaded successfully
        """
        try:
            # Wait for tabs to be visible
            self.wait_for_element_visible(self.TAB_SEGUIDOS, timeout)
            self.wait_for_element_visible(self.TAB_SEGUIDORES, timeout)
            
            # Wait for user list to load
            self.wait_for_element_visible(self.USER_LIST, timeout)
            self.wait_for_loading_to_complete()
            
            return True
        except Exception:
            return False
    
    def switch_to_seguidos_tab(self) -> bool:
        """
        Switch to the 'Seguidos' (Following) tab.
        
        Returns:
            bool: True if tab switch was successful
        """
        try:
            tab = self.wait_for_element_clickable(self.TAB_SEGUIDOS)
            tab.click()
            
            # Wait for tab to become active
            self.utils.wait.until(
                lambda driver: "active" in driver.find_element(*self.TAB_SEGUIDOS).get_attribute("class")
            )
            
            time.sleep(1)  # Allow content to load
            return True
        except Exception:
            return False
    
    def switch_to_seguidores_tab(self) -> bool:
        """
        Switch to the 'Seguidores' (Followers) tab.
        
        Returns:
            bool: True if tab switch was successful
        """
        try:
            tab = self.wait_for_element_clickable(self.TAB_SEGUIDORES)
            tab.click()
            
            # Wait for tab to become active or seguidos tab to become inactive
            self.utils.wait.until(
                lambda driver: "active" in driver.find_element(*self.TAB_SEGUIDORES).get_attribute("class")
                or "active" not in driver.find_element(*self.TAB_SEGUIDOS).get_attribute("class")
            )
            
            time.sleep(1)  # Allow content to load
            return True
        except Exception:
            return False
    
    def get_user_rows(self) -> List[WebElement]:
        """
        Get all user rows in the current view.
        
        Returns:
            List[WebElement]: List of user row elements
        """
        try:
            return self.driver.find_elements(*self.USER_ROWS)
        except Exception:
            return []
    
    def find_user_with_follow_button(self, button_text: str = "seguir") -> Optional[Tuple[WebElement, WebElement]]:
        """
        Find a user with a specific follow button text.
        
        Args:
            button_text: Text to look for in follow button (case insensitive)
            
        Returns:
            Optional[Tuple[WebElement, WebElement]]: (user_row, follow_button) or None
        """
        user_rows = self.get_user_rows()
        
        for row in user_rows:
            try:
                follow_btn = row.find_element(*self.FOLLOW_BUTTONS)
                if follow_btn.text.strip().lower() == button_text.lower():
                    return row, follow_btn
            except Exception:
                continue
        
        return None
    
    def follow_user(self, user_row: WebElement, follow_button: WebElement) -> Tuple[bool, str]:
        """
        Follow a user by clicking their follow button.
        
        Args:
            user_row: The user row element
            follow_button: The follow button element
            
        Returns:
            Tuple[bool, str]: (Success status, button text after action)
        """
        try:
            # Click follow button
            follow_button.click()
            
            # Wait for button text to change to "siguiendo" or "dejar de seguir"
            self.utils.wait.until(
                lambda driver: follow_button.text.strip().lower() in ("siguiendo", "dejar de seguir")
            )
            
            time.sleep(1)  # Allow UI to update
            new_text = follow_button.text.strip()
            
            return True, new_text
        except Exception as e:
            return False, str(e)
    
    def unfollow_user(self, user_row: WebElement, follow_button: WebElement) -> Tuple[bool, str]:
        """
        Unfollow a user by clicking their follow button and confirming.
        
        Args:
            user_row: The user row element
            follow_button: The follow button element
            
        Returns:
            Tuple[bool, str]: (Success status, button text after action)
        """
        try:
            # Click unfollow button
            follow_button.click()
            
            # Wait for confirmation dialog and click confirm
            time.sleep(0.5)
            confirm_btn = self.wait_for_element_clickable(self.CONFIRM_BUTTON, timeout=10)
            confirm_btn.click()
            
            # Wait for button text to change back to "seguir"
            self.utils.wait.until(
                lambda driver: follow_button.text.strip().lower() == "seguir"
            )
            
            time.sleep(1)  # Allow UI to update
            new_text = follow_button.text.strip()
            
            return True, new_text
        except Exception as e:
            return False, str(e)
    
    def get_user_name(self, user_row: WebElement) -> Optional[str]:
        """
        Get the display name of a user from their row.
        
        Args:
            user_row: The user row element
            
        Returns:
            Optional[str]: User display name or None
        """
        try:
            name_element = user_row.find_element(*self.USER_NAME)
            return name_element.text.strip()
        except Exception:
            return None
    
    def get_user_username(self, user_row: WebElement) -> Optional[str]:
        """
        Get the username of a user from their row.
        
        Args:
            user_row: The user row element
            
        Returns:
            Optional[str]: Username or None
        """
        try:
            username_element = user_row.find_element(*self.USER_USERNAME)
            return username_element.text.strip()
        except Exception:
            return None
    
    def get_follow_button_text(self, user_row: WebElement) -> Optional[str]:
        """
        Get the text of the follow button for a user.
        
        Args:
            user_row: The user row element
            
        Returns:
            Optional[str]: Follow button text or None
        """
        try:
            follow_btn = user_row.find_element(*self.FOLLOW_BUTTONS)
            return follow_btn.text.strip()
        except Exception:
            return None
    
    def perform_network_flow(self, checklist: TestChecklist) -> None:
        """
        Perform a complete network interaction flow for testing.
        
        Args:
            checklist: Test checklist for tracking steps
        """
        # Step 1: Load network page
        checklist.start_step("Load Network Page")
        load_success = self.wait_for_network_page_load()
        checklist.check("Cargar Follows", load_success,
                       "Network page loaded successfully" if load_success else "Failed to load network page")
        
        if not load_success:
            return
        
        # Step 2: Switch to Seguidores tab
        checklist.start_step("Switch to Seguidores")
        tab_success = self.switch_to_seguidores_tab()
        checklist.check("Cambiar a pestaña SEGUIDORES", tab_success,
                       "Switched to Seguidores tab" if tab_success else "Failed to switch to Seguidores tab")
        
        # Step 3: Find user to follow
        target_user = self.find_user_with_follow_button("seguir")
        checklist.check("Encontrar usuario para seguir", target_user is not None,
                       "Found user with 'Seguir' button" if target_user else "No users available to follow")
        
        if not target_user:
            return
        
        user_row, follow_btn = target_user
        user_name = self.get_user_name(user_row) or "Unknown User"
        
        # Step 4: Follow user
        checklist.start_step("Follow User")
        follow_success, follow_result = self.follow_user(user_row, follow_btn)
        checklist.check("Seguir Usuario", follow_success,
                       f"Successfully followed {user_name}. Button text: {follow_result}" 
                       if follow_success else f"Failed to follow {user_name}: {follow_result}")
        
        # Step 5: Unfollow user
        if follow_success:
            checklist.start_step("Unfollow User")
            unfollow_success, unfollow_result = self.unfollow_user(user_row, follow_btn)
            checklist.check("Dejar de Seguir Usuario", unfollow_success,
                           f"Successfully unfollowed {user_name}. Button text: {unfollow_result}"
                           if unfollow_success else f"Failed to unfollow {user_name}: {unfollow_result}")
        else:
            checklist.check("Dejar de Seguir Usuario", False, "Cannot unfollow - follow action failed")
        
        # Final verification
        all_passed = checklist.passed == checklist.total
        checklist.check("Network flow completo", all_passed,
                       f"All network steps completed successfully ({checklist.passed}/{checklist.total})" if all_passed
                       else f"Some network steps failed ({checklist.passed}/{checklist.total})")