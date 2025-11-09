"""
CineTrack Home/Feed Page Object.

This module contains the page object for the main feed page where users
see activity from friends and movie reviews.
"""

from selenium.webdriver.common.by import By
from tests.pages.base_page import BasePage


class CineTrackHomePage(BasePage):
    """Page object for CineTrack main feed/home page."""
    
    def __init__(self, driver):
        """Initialize CineTrack home page."""
        super().__init__(driver)
        self.base_url = "https://dj07hexl3m0a6.cloudfront.net"
        
        # Page elements locators
        self.welcome_message = (By.XPATH, "//h2[contains(text(), '¡Bienvenido!')]")
        self.activity_feed = (By.CLASS_NAME, "activity-feed")
        self.user_avatar = (By.XPATH, "//img[contains(@alt, 'Avatar user') or contains(@src, 'avatar')]")
        self.panel_navigation = (By.XPATH, "//h4[text()='Panel']")
        
        # Movie review elements
        self.movie_reviews = (By.XPATH, "//div[contains(@class, 'review') or contains(text(), 'Escribio una reseña')]")
        self.movie_titles = (By.XPATH, "//h3[contains(text(), 'The Conjuring') or contains(text(), 'Superman') or contains(text(), 'F1')]")
        self.movie_posters = (By.XPATH, "//img[contains(@src, 'ltrbxd.com') or contains(@alt, 'post')]")
        self.review_text = (By.XPATH, "//div[contains(text(), 'me dejó') or contains(text(), 'sorprendió')]")
        
        # User interaction elements
        self.user_names = (By.XPATH, "//h4[contains(text(), 'Paul Rudd') or contains(text(), 'Jane Foster')]")
        self.user_handles = (By.XPATH, "//text()[contains(., '@antman_wasp') or contains(., '@jane_foster')]")
        self.timestamps = (By.XPATH, "//text()[contains(., 'ago') or contains(., 'day ago')]")
        
        # Navigation elements
        self.network_link = (By.XPATH, "//a[@href='/follows' or contains(text(), 'Network')]")
        self.activity_friends_link = (By.XPATH, "//a[contains(text(), 'Actividad Amigos')]")
        
        # Following section
        self.following_section = (By.XPATH, "//h2[contains(text(), 'Usuarios a los que sigues')]")
        self.no_following_message = (By.XPATH, "//text()[contains(., 'Usted no sigue a nadie')]")
        
        # Footer elements
        self.footer_links = (By.XPATH, "//a[contains(text(), 'Sobre Nosotros') or contains(text(), 'Términos')]")
        self.copyright_text = (By.XPATH, "//text()[contains(., 'cineTrack - Todos los derechos')]")
    
    def navigate_to_home(self):
        """Navigate to home page."""
        return self.navigate_to("")
    
    def is_page_loaded(self):
        """Check if home page is properly loaded."""
        return (self.is_element_visible(self.welcome_message) and 
                self.is_element_visible(self.panel_navigation))
    
    def get_welcome_message(self):
        """Get the welcome message text."""
        return self.get_text(self.welcome_message)
    
    def get_movie_reviews(self):
        """Get all movie review elements."""
        return self.find_elements(self.movie_reviews)
    
    def get_movie_titles(self):
        """Get all movie titles displayed on the page."""
        elements = self.find_elements(self.movie_titles)
        return [elem.text for elem in elements if elem.text]
    
    def get_user_names(self):
        """Get all user names from reviews."""
        elements = self.find_elements(self.user_names)
        return [elem.text for elem in elements if elem.text]
    
    def is_movie_poster_visible(self, movie_name):
        """Check if a specific movie poster is visible."""
        poster_locator = (By.XPATH, f"//img[contains(@alt, '{movie_name}') or contains(@src, '{movie_name.lower()}')]")
        return self.is_element_visible(poster_locator)
    
    def get_review_content(self):
        """Get the text content of reviews."""
        elements = self.find_elements(self.review_text)
        return [elem.text for elem in elements if elem.text]
    
    def click_network_link(self):
        """Click on the Network navigation link."""
        return self.click_element(self.network_link)
    
    def is_following_section_visible(self):
        """Check if the following section is visible."""
        return self.is_element_visible(self.following_section)
    
    def has_no_following_message(self):
        """Check if 'no following' message is displayed."""
        return self.is_element_visible(self.no_following_message)
    
    def get_footer_links(self):
        """Get footer navigation links."""
        elements = self.find_elements(self.footer_links)
        return [elem.text for elem in elements if elem.text]
    
    def scroll_to_review(self, review_index=0):
        """Scroll to a specific review by index."""
        reviews = self.find_elements(self.movie_reviews)
        if reviews and len(reviews) > review_index:
            return self.scroll_to_element((By.XPATH, f"({self.movie_reviews[1]})[{review_index + 1}]"))
        return False
    
    def count_visible_reviews(self):
        """Count the number of visible movie reviews."""
        reviews = self.find_elements(self.movie_reviews)
        return len(reviews)
    
    def is_user_avatar_visible(self):
        """Check if user avatar is visible in the header."""
        return self.is_element_visible(self.user_avatar)
    
    def verify_page_elements(self):
        """Verify that all expected page elements are present."""
        elements_check = {
            'welcome_message': self.is_element_visible(self.welcome_message),
            'panel_navigation': self.is_element_visible(self.panel_navigation),
            'following_section': self.is_element_visible(self.following_section),
            'user_avatar': self.is_element_visible(self.user_avatar)
        }
        return elements_check
    
    def get_page_info(self):
        """Get comprehensive page information for testing."""
        return {
            'url': self.get_current_url(),
            'title': self.get_page_title(),
            'welcome_message': self.get_welcome_message(),
            'movie_titles': self.get_movie_titles(),
            'user_names': self.get_user_names(),
            'review_count': self.count_visible_reviews(),
            'has_no_following': self.has_no_following_message()
        }