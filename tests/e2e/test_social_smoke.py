"""
Smoke Tests Suite for CineTrack Social Module.

This module contains critical smoke tests that verify the Social Graph Activity Feed
is accessible and functional. Focuses only on social features (feed, network, follows).
"""

import pytest
import time
from tests.pages.cinetrack_home_page import CineTrackHomePage
from tests.pages.cinetrack_network_page import CineTrackNetworkPage


class TestSocialModuleSmokeTests:
    """Critical smoke tests for Social Graph Activity Feed module."""
    
    @pytest.mark.smoke
    @pytest.mark.critical
    def test_social_feed_is_accessible(self, driver, checklist):
        """CRITICAL: Verify the social feed application is accessible and loads."""
        home_page = CineTrackHomePage(driver)
        
        # Test basic accessibility
        checklist.check(
            "Social feed URL is accessible",
            home_page.navigate_to_home(),
            "Successfully connected to Social Feed application"
        )
        
        # Verify page loads
        checklist.check(
            "Page loads successfully",
            home_page.is_page_loaded(),
            "Essential page elements are visible"
        )
        
        checklist.assert_all_passed("CRITICAL: Social feed application is accessible")
    
    @pytest.mark.smoke
    @pytest.mark.critical
    def test_social_activity_feed_displays(self, driver, checklist):
        """CRITICAL: Verify social activity feed displays user interactions."""
        home_page = CineTrackHomePage(driver)
        
        # Navigate to feed
        checklist.check(
            "Navigate to feed page",
            home_page.navigate_to_home(),
            "Feed page loaded successfully"
        )
        
        # Verify social feed has content (publications from followed users)
        movie_titles = home_page.get_movie_titles()
        checklist.check(
            "Social feed has publications",
            len(movie_titles) > 0,
            f"Found {len(movie_titles)} publications in social feed"
        )
        
        # Verify user social activity is visible
        user_names = home_page.get_user_names()
        checklist.check(
            "User activity is visible in feed",
            len(user_names) > 0,
            f"Found {len(user_names)} users with social activity"
        )
        
        checklist.assert_all_passed("CRITICAL: Social activity feed displays correctly")
    
    @pytest.mark.smoke
    def test_network_page_accessible(self, driver, checklist):
        """Verify social network page (follows/followers) is accessible."""
        home_page = CineTrackHomePage(driver)
        network_page = CineTrackNetworkPage(driver)
        
        # Load feed page
        checklist.check(
            "Load feed page",
            home_page.navigate_to_home(),
            "Feed page loaded"
        )
        
        # Navigate to network page
        checklist.check(
            "Click network navigation",
            home_page.click_network_link(),
            "Network link clicked"
        )
        
        time.sleep(2)  # Allow navigation
        
        # Verify we're on network page
        current_url = driver.current_url
        on_network_page = (
            "follows" in current_url.lower() or 
            "network" in current_url.lower() or
            network_page.is_page_loaded()
        )
        
        checklist.check(
            "Network page loads",
            on_network_page,
            f"Currently on: {current_url}"
        )
        
        checklist.assert_all_passed("Social network page is accessible")
    
    @pytest.mark.smoke
    @pytest.mark.performance
    def test_feed_loads_within_acceptable_time(self, driver, checklist):
        """Verify social feed loads within acceptable time limits."""
        home_page = CineTrackHomePage(driver)
        
        # Test initial load time
        start_time = time.time()
        load_successful = home_page.navigate_to_home()
        load_time = time.time() - start_time
        
        checklist.check(
            "Feed loads within 15 seconds",
            load_successful and load_time < 15.0,
            f"Social feed loaded in {load_time:.2f} seconds"
        )
        
        # Verify content renders
        has_content = (
            len(home_page.get_movie_titles()) > 0 or
            len(home_page.get_user_names()) > 0
        )
        
        checklist.check(
            "Social content renders successfully",
            has_content,
            "Feed content is visible"
        )
        
        checklist.assert_all_passed("Social feed performance is acceptable")
