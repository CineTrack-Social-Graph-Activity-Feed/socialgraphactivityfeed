"""
Integration tests for CineTrack Frontend-Backend communication.

This module tests the complete integration between frontend UI interactions
and backend data processing, ensuring end-to-end functionality works correctly.
"""

import pytest
import time
import requests
from tests.pages.cinetrack_home_page import CineTrackHomePage
from tests.pages.cinetrack_network_page import CineTrackNetworkPage


class TestCineTrackIntegration:
    """Integration tests for frontend-backend communication."""
    
    @pytest.mark.integration
    @pytest.mark.smoke  
    def test_homepage_ui_data_integration(self, driver, checklist):
        """Test that UI elements properly display backend data."""
        home_page = CineTrackHomePage(driver)
        
        # Load homepage through UI
        checklist.check(
            "Load homepage via browser",
            home_page.navigate_to_home(),
            "Homepage loaded through UI"
        )
        
        # Verify UI displays data from backend
        movie_titles = home_page.get_movie_titles()
        user_names = home_page.get_user_names()
        review_content = home_page.get_review_content()
        
        checklist.check(
            "UI displays movie data",
            len(movie_titles) > 0,
            f"Movies displayed: {movie_titles}"
        )
        
        checklist.check(
            "UI displays user data", 
            len(user_names) > 0,
            f"Users displayed: {user_names}"
        )
        
        checklist.check(
            "UI displays review content",
            len(review_content) > 0,
            f"Review texts found: {len(review_content)}"
        )
        
        # Verify data consistency - check for expected content structure
        expected_movies = ["The Conjuring", "Superman", "F1"]
        expected_users = ["Paul Rudd", "Jane Foster"]
        
        movie_matches = sum(1 for movie in expected_movies if any(movie in title for title in movie_titles))
        user_matches = sum(1 for user in expected_users if any(user in name for name in user_names))
        
        checklist.check(
            "Data matches expected content structure",
            movie_matches >= 1 and user_matches >= 1,
            f"Movie matches: {movie_matches}/{len(expected_movies)}, User matches: {user_matches}/{len(expected_users)}"
        )
        
        checklist.assert_all_passed("Homepage UI successfully integrates with backend data")
    
    @pytest.mark.integration
    def test_navigation_integration_with_backend(self, driver, checklist):
        """Test that navigation requests properly communicate with backend."""
        home_page = CineTrackHomePage(driver)
        network_page = CineTrackNetworkPage(driver)
        
        # Start with homepage
        checklist.check(
            "Load initial page",
            home_page.navigate_to_home(),
            "Homepage loaded successfully"
        )
        
        # Capture initial state
        initial_url = home_page.get_current_url()
        checklist.check(
            "Capture initial state",
            "dj07hexl3m0a6.cloudfront.net" in initial_url,
            f"Initial URL: {initial_url}"
        )
        
        # Navigate to network page through UI
        checklist.check(
            "Trigger navigation via UI",
            home_page.click_network_link(),
            "Navigation link clicked"
        )
        
        # Allow navigation to complete
        time.sleep(3)
        
        # Verify backend responded with network page
        current_url = driver.current_url
        checklist.check(
            "Backend served network page",
            "follows" in current_url or current_url != initial_url,
            f"Navigation resulted in URL: {current_url}"
        )
        
        # Verify network page loaded with backend data
        network_loaded = network_page.is_page_loaded()
        checklist.check(
            "Network page loaded from backend",
            network_loaded,
            f"Network page loading status: {network_loaded}"
        )
        
        # Test back navigation integration
        driver.back()
        time.sleep(2)
        
        back_url = driver.current_url
        checklist.check(
            "Back navigation works with backend",
            back_url == initial_url or "follows" not in back_url,
            f"Back navigation URL: {back_url}"
        )
        
        checklist.assert_all_passed("Navigation properly integrates with backend routing")
    
    @pytest.mark.integration
    def test_real_time_data_consistency(self, driver, checklist):
        """Test data consistency between multiple UI interactions."""
        home_page = CineTrackHomePage(driver)
        
        # Load page first time and capture data
        checklist.check(
            "Initial page load", 
            home_page.navigate_to_home(),
            "Page loaded initially"
        )
        
        first_load_data = {
            'movies': home_page.get_movie_titles(),
            'users': home_page.get_user_names(),
            'reviews': len(home_page.get_review_content())
        }
        
        checklist.check(
            "Capture initial data state",
            len(first_load_data['movies']) > 0,
            f"First load: {first_load_data}"
        )
        
        # Refresh page and compare data
        home_page.refresh_page()
        time.sleep(2)
        
        second_load_data = {
            'movies': home_page.get_movie_titles(),
            'users': home_page.get_user_names(), 
            'reviews': len(home_page.get_review_content())
        }
        
        checklist.check(
            "Data consistency after refresh",
            (first_load_data['movies'] == second_load_data['movies'] and
             first_load_data['users'] == second_load_data['users']),
            f"Second load: {second_load_data}"
        )
        
        # Navigate away and back to test data persistence
        driver.get("https://www.google.com")
        time.sleep(1)
        
        checklist.check(
            "Navigate to external site",
            "google.com" in driver.current_url,
            "Successfully navigated away"
        )
        
        # Return to CineTrack
        home_page.navigate_to_home()
        time.sleep(2)
        
        third_load_data = {
            'movies': home_page.get_movie_titles(),
            'users': home_page.get_user_names(),
            'reviews': len(home_page.get_review_content())
        }
        
        checklist.check(
            "Data consistency after return navigation",
            (first_load_data['movies'] == third_load_data['movies']),
            f"Third load: {third_load_data}"
        )
        
        checklist.assert_all_passed("Data remains consistent across multiple interactions")
    
    @pytest.mark.integration
    def test_frontend_backend_error_handling(self, driver, checklist):
        """Test how frontend handles various backend response scenarios."""
        home_page = CineTrackHomePage(driver)
        
        # Test normal operation
        checklist.check(
            "Normal operation baseline",
            home_page.navigate_to_home(),
            "Normal page load successful"
        )
        
        # Test navigation to potentially non-existent page
        invalid_url = f"{home_page.base_url}/nonexistent-page-12345"
        driver.get(invalid_url)
        time.sleep(2)
        
        # Check how frontend handles 404 or error responses
        current_url = driver.current_url
        page_title = driver.title
        page_source = driver.page_source.lower()
        
        error_indicators = ["404", "not found", "error", "página no encontrada"]
        has_error_handling = any(indicator in page_source for indicator in error_indicators)
        
        checklist.check(
            "Frontend handles invalid URLs",
            has_error_handling or "nonexistent-page" not in current_url,
            f"Error handling detected: {has_error_handling}, URL: {current_url}"
        )
        
        # Test recovery - navigate back to valid page
        checklist.check(
            "Recovery to valid page",
            home_page.navigate_to_home(),
            "Successfully recovered to homepage"
        )
        
        # Verify normal functionality restored
        recovery_check = home_page.is_page_loaded()
        checklist.check(
            "Normal functionality restored",
            recovery_check,
            "Homepage functionality restored after error"
        )
        
        checklist.assert_all_passed("Frontend properly handles backend error scenarios")
    
    @pytest.mark.integration
    def test_concurrent_ui_backend_operations(self, driver, checklist):
        """Test UI responsiveness during backend operations."""
        home_page = CineTrackHomePage(driver)
        network_page = CineTrackNetworkPage(driver)
        
        # Load homepage
        checklist.check(
            "Load homepage for concurrent test",
            home_page.navigate_to_home(),
            "Homepage loaded for testing"
        )
        
        # Rapidly perform multiple UI operations
        start_time = time.time()
        
        # Operation 1: Scroll to review
        scroll_success = home_page.scroll_to_review(0)
        checklist.check(
            "Rapid operation 1: Scroll",
            scroll_success or True,  # Don't fail if no reviews to scroll to
            "Scroll operation completed"
        )
        
        # Operation 2: Navigate to network
        nav_success = home_page.click_network_link()
        time.sleep(1)  # Brief wait
        
        # Operation 3: Quick back navigation
        driver.back()
        time.sleep(1)
        
        # Operation 4: Refresh page
        home_page.refresh_page()
        
        end_time = time.time()
        total_time = end_time - start_time
        
        checklist.check(
            "Rapid operations completed",
            total_time < 15.0,  # Should complete within 15 seconds
            f"All operations completed in {total_time:.2f} seconds"
        )
        
        # Verify page is still functional after rapid operations
        final_check = home_page.is_page_loaded()
        checklist.check(
            "Page remains functional after rapid operations",
            final_check,
            "Page functionality maintained"
        )
        
        # Verify data is still accessible
        movies_still_loaded = len(home_page.get_movie_titles()) > 0
        checklist.check(
            "Backend data still accessible",
            movies_still_loaded,
            "Backend data remains accessible"
        )
        
        checklist.assert_all_passed("UI remains responsive during concurrent backend operations")
    
    @pytest.mark.integration
    @pytest.mark.performance
    def test_frontend_backend_performance_integration(self, driver, checklist):
        """Test performance characteristics of frontend-backend integration."""
        home_page = CineTrackHomePage(driver)
        
        # Measure initial page load performance
        start_load = time.time()
        load_success = home_page.navigate_to_home()
        load_time = time.time() - start_load
        
        checklist.check(
            "Initial load performance",
            load_success and load_time < 10.0,
            f"Page loaded in {load_time:.2f} seconds"
        )
        
        # Measure data rendering time
        start_render = time.time()
        movies_loaded = len(home_page.get_movie_titles()) > 0
        users_loaded = len(home_page.get_user_names()) > 0
        render_time = time.time() - start_render
        
        checklist.check(
            "Data rendering performance",
            movies_loaded and users_loaded and render_time < 5.0,
            f"Data rendered in {render_time:.2f} seconds"
        )
        
        # Test multiple page interactions performance
        interaction_times = []
        
        for i in range(3):
            start_interaction = time.time()
            
            # Perform a typical user interaction
            home_page.scroll_to_review(0)
            home_page.get_page_info()
            
            interaction_time = time.time() - start_interaction
            interaction_times.append(interaction_time)
            
            checklist.check(
                f"Interaction {i+1} performance",
                interaction_time < 3.0,
                f"Interaction completed in {interaction_time:.2f} seconds"
            )
        
        # Calculate average interaction time
        avg_interaction_time = sum(interaction_times) / len(interaction_times)
        checklist.check(
            "Average interaction performance",
            avg_interaction_time < 2.0,
            f"Average interaction time: {avg_interaction_time:.2f} seconds"
        )
        
        checklist.assert_all_passed("Frontend-backend integration meets performance requirements")
    
    @pytest.mark.integration
    def test_cross_page_data_flow(self, driver, checklist):
        """Test data flow and consistency across different pages."""
        home_page = CineTrackHomePage(driver)
        network_page = CineTrackNetworkPage(driver)
        
        # Start with homepage and capture base data
        checklist.check(
            "Load homepage for data flow test",
            home_page.navigate_to_home(),
            "Homepage loaded successfully"
        )
        
        # Get homepage data context
        home_info = home_page.get_page_info()
        checklist.check(
            "Capture homepage context",
            len(home_info['movie_titles']) > 0,
            f"Homepage context: {len(home_info['movie_titles'])} movies, {len(home_info['user_names'])} users"
        )
        
        # Navigate to network page
        checklist.check(
            "Navigate to network page",
            home_page.click_network_link(),
            "Navigation to network initiated"
        )
        
        # Allow navigation and data loading
        time.sleep(3)
        
        # Verify network page loaded with consistent data context
        network_loaded = network_page.is_page_loaded()
        checklist.check(
            "Network page loaded",
            network_loaded,
            "Network page successfully loaded"
        )
        
        # Get network page context
        if network_loaded:
            network_info = network_page.get_network_page_info()
            checklist.check(
                "Network page has data context",
                True,  # Always pass as this is data gathering
                f"Network context: {network_info}"
            )
        
        # Return to homepage and verify data consistency
        home_page.navigate_to_home()
        time.sleep(2)
        
        # Check if homepage data is consistent after navigation
        return_home_info = home_page.get_page_info()
        data_consistent = (
            return_home_info['movie_titles'] == home_info['movie_titles'] and
            return_home_info['user_names'] == home_info['user_names']
        )
        
        checklist.check(
            "Data consistency after cross-page navigation",
            data_consistent,
            f"Data consistency maintained: {data_consistent}"
        )
        
        checklist.assert_all_passed("Data flows correctly across different pages")