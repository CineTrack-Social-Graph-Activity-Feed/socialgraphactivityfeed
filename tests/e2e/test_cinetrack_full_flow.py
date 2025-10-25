"""
End-to-End tests for CineTrack Social Graph Activity Feed.

This module contains comprehensive E2E tests that verify the complete
user journey and core functionality of the CineTrack application.
"""

import pytest
import time
from tests.pages.cinetrack_home_page import CineTrackHomePage
from tests.pages.cinetrack_network_page import CineTrackNetworkPage


class TestCineTrackE2E:
    """End-to-End tests for CineTrack application."""
    
    @pytest.mark.e2e
    @pytest.mark.smoke
    def test_home_page_loads_successfully(self, driver, checklist):
        """Test that the CineTrack home page loads with expected content."""
        home_page = CineTrackHomePage(driver)
        
        # Navigate to home page
        checklist.check(
            "Navigate to CineTrack home page",
            home_page.navigate_to_home(),
            "Successfully navigated to home page"
        )
        
        # Verify page is loaded
        checklist.check(
            "Verify home page is loaded",
            home_page.is_page_loaded(),
            "Home page loaded with expected elements"
        )
        
        # Check welcome message
        welcome_msg = home_page.get_welcome_message()
        checklist.check(
            "Verify welcome message is displayed",
            "Bienvenido" in welcome_msg,
            f"Welcome message found: {welcome_msg}"
        )
        
        # Verify user avatar is visible
        checklist.check(
            "Verify user avatar is visible",
            home_page.is_user_avatar_visible(),
            "User avatar displayed in navigation"
        )
        
        checklist.assert_all_passed("Home page loads successfully with all expected elements")
    
    @pytest.mark.e2e
    @pytest.mark.smoke
    def test_activity_feed_displays_content(self, driver, checklist):
        """Test that the activity feed displays movie reviews and user activity."""
        home_page = CineTrackHomePage(driver)
        
        # Navigate to home page
        checklist.check(
            "Navigate to home page",
            home_page.navigate_to_home(),
            "Home page loaded"
        )
        
        # Verify movie titles are displayed
        movie_titles = home_page.get_movie_titles()
        checklist.check(
            "Verify movie titles are displayed",
            len(movie_titles) > 0,
            f"Found {len(movie_titles)} movies: {movie_titles}"
        )
        
        # Verify user names are displayed
        user_names = home_page.get_user_names()
        checklist.check(
            "Verify user names are displayed",
            len(user_names) > 0,
            f"Found {len(user_names)} users: {user_names}"
        )
        
        # Verify review content exists
        review_content = home_page.get_review_content()
        checklist.check(
            "Verify review content is displayed",
            len(review_content) > 0,
            f"Found {len(review_content)} review texts"
        )
        
        # Count visible reviews
        review_count = home_page.count_visible_reviews()
        checklist.check(
            "Verify multiple reviews are visible",
            review_count >= 1,
            f"Found {review_count} visible reviews"
        )
        
        checklist.assert_all_passed("Activity feed displays expected movie reviews and user content")
    
    @pytest.mark.e2e
    def test_navigation_to_network_page(self, driver, checklist):
        """Test navigation from home page to network page."""
        home_page = CineTrackHomePage(driver)
        network_page = CineTrackNetworkPage(driver)
        
        # Start on home page
        checklist.check(
            "Navigate to home page",
            home_page.navigate_to_home(),
            "Home page loaded successfully"
        )
        
        # Click network link
        checklist.check(
            "Click network navigation link",
            home_page.click_network_link(),
            "Network link clicked"
        )
        
        # Wait for network page to load
        time.sleep(2)  # Allow navigation to complete
        
        # Verify network page is loaded
        checklist.check(
            "Verify network page is loaded",
            network_page.is_page_loaded(),
            "Network page loaded successfully"
        )
        
        # Verify URL contains 'follows'
        current_url = network_page.get_current_url()
        checklist.check(
            "Verify URL contains 'follows'",
            'follows' in current_url,
            f"URL is: {current_url}"
        )
        
        checklist.assert_all_passed("Successfully navigated from home to network page")
    
    @pytest.mark.e2e
    def test_network_page_functionality(self, driver, checklist):
        """Test network page displays user connections correctly."""
        network_page = CineTrackNetworkPage(driver)
        
        # Navigate directly to network page
        checklist.check(
            "Navigate to network page",
            network_page.navigate_to_network(),
            "Network page loaded"
        )
        
        # Verify page elements
        page_elements = network_page.verify_page_elements()
        checklist.check(
            "Verify network page elements",
            all(page_elements.values()),
            f"Page elements status: {page_elements}"
        )
        
        # Check if empty state or users are displayed
        has_users = network_page.get_users_count() > 0
        has_empty_state = network_page.has_empty_state()
        
        checklist.check(
            "Verify users or empty state is displayed",
            has_users or has_empty_state,
            f"Users count: {network_page.get_users_count()}, Has empty state: {has_empty_state}"
        )
        
        # Get comprehensive page info
        network_info = network_page.get_network_page_info()
        checklist.check(
            "Collect network page information",
            True,
            f"Network info: {network_info}"
        )
        
        checklist.assert_all_passed("Network page functions correctly with expected behavior")
    
    @pytest.mark.e2e
    def test_movie_content_verification(self, driver, checklist):
        """Test that specific movie content is displayed correctly."""
        home_page = CineTrackHomePage(driver)
        
        # Navigate to home page
        checklist.check(
            "Navigate to home page",
            home_page.navigate_to_home(),
            "Home page loaded"
        )
        
        # Verify specific movies are displayed
        expected_movies = ["The Conjuring: Last Rites", "Superman", "F1"]
        movie_titles = home_page.get_movie_titles()
        
        for movie in expected_movies:
            is_present = any(movie in title for title in movie_titles)
            checklist.check(
                f"Verify '{movie}' is displayed",
                is_present,
                f"Movie '{movie}' found in titles: {movie_titles}"
            )
        
        # Verify user reviews contain expected users
        expected_users = ["Paul Rudd", "Jane Foster"]
        user_names = home_page.get_user_names()
        
        for user in expected_users:
            is_present = any(user in name for name in user_names)
            checklist.check(
                f"Verify user '{user}' appears in reviews",
                is_present,
                f"User '{user}' found in names: {user_names}"
            )
        
        checklist.assert_all_passed("All expected movie content and users are displayed correctly")
    
    @pytest.mark.e2e
    def test_page_responsive_elements(self, driver, checklist):
        """Test that page elements respond correctly to interactions."""
        home_page = CineTrackHomePage(driver)
        
        # Navigate to home page
        checklist.check(
            "Navigate to home page",
            home_page.navigate_to_home(),
            "Home page loaded"
        )
        
        # Test scrolling to different reviews
        initial_review_count = home_page.count_visible_reviews()
        checklist.check(
            "Count initial visible reviews",
            initial_review_count >= 1,
            f"Initial reviews visible: {initial_review_count}"
        )
        
        # Scroll to review if available
        if initial_review_count > 0:
            scroll_result = home_page.scroll_to_review(0)
            checklist.check(
                "Test scrolling to review",
                scroll_result,
                "Successfully scrolled to first review"
            )
        
        # Verify page elements after interaction
        elements_check = home_page.verify_page_elements()
        checklist.check(
            "Verify page elements after interaction",
            all(elements_check.values()),
            f"Elements status: {elements_check}"
        )
        
        # Get comprehensive page information
        page_info = home_page.get_page_info()
        checklist.check(
            "Collect comprehensive page information",
            True,
            f"Page info: {page_info}"
        )
        
        checklist.assert_all_passed("Page elements respond correctly to user interactions")
    
    @pytest.mark.e2e
    def test_full_user_journey(self, driver, checklist):
        """Test complete user journey through the application."""
        home_page = CineTrackHomePage(driver)
        network_page = CineTrackNetworkPage(driver)
        
        # Step 1: Load home page and verify content
        checklist.check(
            "Load home page",
            home_page.navigate_to_home(),
            "Home page loaded successfully"
        )
        
        # Step 2: Verify feed content
        movie_count = len(home_page.get_movie_titles())
        checklist.check(
            "Verify feed has movie content",
            movie_count > 0,
            f"Found {movie_count} movies in feed"
        )
        
        # Step 3: Navigate to network page
        checklist.check(
            "Navigate to network page",
            home_page.click_network_link(),
            "Clicked network navigation link"
        )
        
        # Wait for navigation
        time.sleep(2)
        
        # Step 4: Verify network page functionality
        checklist.check(
            "Verify network page loaded",
            network_page.is_page_loaded(),
            "Network page loaded successfully"
        )
        
        # Step 5: Check network content
        network_info = network_page.get_network_page_info()
        checklist.check(
            "Analyze network page content",
            True,
            f"Network analysis: {network_info}"
        )
        
        # Step 6: Navigate back to home (if possible)
        if network_page.click_back_to_feed():
            time.sleep(2)
            checklist.check(
                "Navigate back to home page",
                home_page.is_page_loaded(),
                "Successfully returned to home page"
            )
        else:
            # Alternative navigation
            home_page.navigate_to_home()
            checklist.check(
                "Alternative navigation to home",
                home_page.is_page_loaded(),
                "Navigated back to home via direct URL"
            )
        
        checklist.assert_all_passed("Complete user journey executed successfully")
    
    @pytest.mark.e2e
    @pytest.mark.slow
    def test_performance_and_load_times(self, driver, checklist):
        """Test application performance and load times."""
        home_page = CineTrackHomePage(driver)
        
        # Measure home page load time
        start_time = time.time()
        checklist.check(
            "Navigate to home page (timed)",
            home_page.navigate_to_home(),
            "Home page navigation initiated"
        )
        
        load_time = time.time() - start_time
        checklist.check(
            "Verify acceptable load time",
            load_time < 10.0,  # 10 seconds threshold
            f"Page loaded in {load_time:.2f} seconds"
        )
        
        # Verify all critical elements load
        elements_check = home_page.verify_page_elements()
        checklist.check(
            "Verify all critical elements loaded",
            all(elements_check.values()),
            f"Elements loaded: {elements_check}"
        )
        
        # Test page refresh performance
        start_refresh = time.time()
        refresh_result = home_page.refresh_page()
        refresh_time = time.time() - start_refresh
        
        checklist.check(
            "Test page refresh performance",
            refresh_result and refresh_time < 8.0,
            f"Page refreshed in {refresh_time:.2f} seconds"
        )
        
        checklist.assert_all_passed("Application meets performance expectations")