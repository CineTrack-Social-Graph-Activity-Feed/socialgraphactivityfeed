"""
CineTrack Network Page Object.

This module contains the page object for the network/follows page where users
can manage their connections and see who they follow.
"""

from selenium.webdriver.common.by import By
from tests.pages.base_page import BasePage


class CineTrackNetworkPage(BasePage):
    """Page object for CineTrack network/follows page."""
    
    def __init__(self, driver):
        """Initialize CineTrack network page."""
        super().__init__(driver)
        self.base_url = "https://dj07hexl3m0a6.cloudfront.net"
        
        # Page elements locators
        self.page_header = (By.XPATH, "//h1[contains(text(), 'Network') or contains(text(), 'Seguir')]")
        self.users_list = (By.CLASS_NAME, "users-list")
        self.user_cards = (By.CLASS_NAME, "user-card")
        
        # User interaction elements
        self.follow_buttons = (By.XPATH, "//button[contains(text(), 'Seguir') or contains(text(), 'Follow')]")
        self.unfollow_buttons = (By.XPATH, "//button[contains(text(), 'Dejar de seguir') or contains(text(), 'Unfollow')]")
        self.user_avatars = (By.XPATH, "//img[contains(@src, 'pravatar.cc') or contains(@alt, 'avatar')]")
        self.user_profiles = (By.CLASS_NAME, "user-profile")
        
        # Search and filter elements
        self.search_input = (By.XPATH, "//input[@placeholder*='Buscar' or @type='search']")
        self.search_button = (By.XPATH, "//button[contains(text(), 'Buscar')]")
        self.filter_options = (By.CLASS_NAME, "filter-option")
        
        # Following status elements
        self.following_count = (By.XPATH, "//span[contains(@class, 'following-count')]")
        self.followers_count = (By.XPATH, "//span[contains(@class, 'followers-count')]")
        
        # Navigation elements
        self.back_to_feed_link = (By.XPATH, "//a[@href='/' or contains(text(), 'Feed') or contains(text(), 'Inicio')]")
        
        # Empty state elements
        self.empty_state_message = (By.XPATH, "//div[contains(text(), 'No sigues a nadie') or contains(text(), 'No users found')]")
        self.suggested_users = (By.CLASS_NAME, "suggested-users")
    
    def navigate_to_network(self):
        """Navigate to network page."""
        return self.navigate_to("/follows")
    
    def is_page_loaded(self):
        """Check if network page is properly loaded."""
        return (self.wait_for_url_contains("follows") or 
                self.is_element_visible(self.users_list) or
                self.is_element_visible(self.empty_state_message))
    
    def get_user_cards(self):
        """Get all user card elements."""
        return self.find_elements(self.user_cards)
    
    def get_users_count(self):
        """Get count of visible users."""
        users = self.get_user_cards()
        return len(users)
    
    def follow_user_by_index(self, index=0):
        """Follow a user by their index in the list."""
        follow_buttons = self.find_elements(self.follow_buttons)
        if follow_buttons and len(follow_buttons) > index:
            follow_buttons[index].click()
            return True
        return False
    
    def unfollow_user_by_index(self, index=0):
        """Unfollow a user by their index in the list."""
        unfollow_buttons = self.find_elements(self.unfollow_buttons)
        if unfollow_buttons and len(unfollow_buttons) > index:
            unfollow_buttons[index].click()
            return True
        return False
    
    def search_users(self, search_term):
        """Search for users using search functionality."""
        if self.enter_text(self.search_input, search_term):
            return self.click_element(self.search_button)
        return False
    
    def get_follow_buttons_count(self):
        """Get count of follow buttons (unfollowed users)."""
        buttons = self.find_elements(self.follow_buttons)
        return len(buttons)
    
    def get_unfollow_buttons_count(self):
        """Get count of unfollow buttons (followed users)."""
        buttons = self.find_elements(self.unfollow_buttons)
        return len(buttons)
    
    def get_following_count(self):
        """Get following count from display."""
        element = self.find_element(self.following_count)
        return element.text if element else "0"
    
    def get_followers_count(self):
        """Get followers count from display."""
        element = self.find_element(self.followers_count)
        return element.text if element else "0"
    
    def has_empty_state(self):
        """Check if empty state message is shown."""
        return self.is_element_visible(self.empty_state_message)
    
    def has_suggested_users(self):
        """Check if suggested users section is visible."""
        return self.is_element_visible(self.suggested_users)
    
    def click_back_to_feed(self):
        """Click link to go back to main feed."""
        return self.click_element(self.back_to_feed_link)
    
    def get_user_avatars_count(self):
        """Get count of visible user avatars."""
        avatars = self.find_elements(self.user_avatars)
        return len(avatars)
    
    def verify_page_elements(self):
        """Verify that expected page elements are present."""
        elements_check = {
            'users_list_or_empty_state': (self.is_element_visible(self.users_list) or 
                                        self.is_element_visible(self.empty_state_message)),
            'has_navigation': (self.is_element_visible(self.back_to_feed_link) or 
                             'follows' in self.get_current_url()),
            'has_user_elements': (self.get_users_count() > 0 or 
                                self.has_empty_state())
        }
        return elements_check
    
    def get_network_page_info(self):
        """Get comprehensive network page information."""
        return {
            'url': self.get_current_url(),
            'title': self.get_page_title(),
            'users_count': self.get_users_count(),
            'follow_buttons': self.get_follow_buttons_count(),
            'unfollow_buttons': self.get_unfollow_buttons_count(),
            'has_empty_state': self.has_empty_state(),
            'has_suggested_users': self.has_suggested_users(),
            'avatars_count': self.get_user_avatars_count()
        }