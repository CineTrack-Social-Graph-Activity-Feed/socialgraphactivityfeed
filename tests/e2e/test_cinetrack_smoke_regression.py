"""
Smoke Tests Suite for CineTrack Application.

This module contains critical smoke tests that verify basic functionality
and should be run frequently in CI/CD pipelines for quick feedback.
"""

import pytest
import time
from tests.pages.cinetrack_home_page import CineTrackHomePage
from tests.pages.cinetrack_network_page import CineTrackNetworkPage


class TestCineTrackSmokeTests:
    """Critical smoke tests for CineTrack application."""
    
    @pytest.mark.smoke
    @pytest.mark.critical
    def test_application_is_accessible(self, driver, checklist):
        """CRITICAL: Verify the application is accessible and loads."""
        home_page = CineTrackHomePage(driver)
        
        # Test basic accessibility
        checklist.check(
            "Application URL is accessible",
            home_page.navigate_to_home(),
            "Successfully connected to CineTrack application"
        )
        
        # Verify page has basic content
        page_title = home_page.get_page_title()
        checklist.check(
            "Page has valid title", 
            len(page_title) > 0,
            f"Page title: '{page_title}'"
        )
        
        # Verify core UI elements load
        checklist.check(
            "Core UI elements load",
            home_page.is_page_loaded(),
            "Essential page elements are visible"
        )
        
        checklist.assert_all_passed("CRITICAL: Application is accessible and functional")
    
    @pytest.mark.smoke
    @pytest.mark.critical
    def test_main_content_displays(self, driver, checklist):
        """CRITICAL: Verify main content (feed) displays correctly."""
        home_page = CineTrackHomePage(driver)
        
        # Navigate to homepage
        checklist.check(
            "Navigate to main page",
            home_page.navigate_to_home(),
            "Homepage loaded successfully"
        )
        
        # Verify welcome message
        welcome_msg = home_page.get_welcome_message()
        checklist.check(
            "Welcome message displays",
            "Bienvenido" in welcome_msg or len(welcome_msg) > 0,
            f"Welcome message: '{welcome_msg}'"
        )
        
        # Verify content feed has data
        movie_titles = home_page.get_movie_titles()
        checklist.check(
            "Content feed has movies",
            len(movie_titles) > 0,
            f"Found {len(movie_titles)} movies in feed"
        )
        
        # Verify user interactions are visible
        user_names = home_page.get_user_names()
        checklist.check(
            "User activity is visible",
            len(user_names) > 0,
            f"Found {len(user_names)} active users"
        )
        
        checklist.assert_all_passed("CRITICAL: Main content displays correctly")
    
    @pytest.mark.smoke
    def test_basic_navigation_works(self, driver, checklist):
        """Verify basic navigation between pages functions."""
        home_page = CineTrackHomePage(driver)
        network_page = CineTrackNetworkPage(driver)
        
        # Start on homepage
        checklist.check(
            "Load homepage",
            home_page.navigate_to_home(),
            "Homepage loaded"
        )
        
        initial_url = home_page.get_current_url()
        
        # Test navigation to network page
        checklist.check(
            "Navigate to network page",
            home_page.click_network_link(),
            "Network navigation clicked"
        )
        
        # Allow navigation time
        time.sleep(2)
        
        # Verify navigation occurred
        current_url = driver.current_url
        navigation_successful = (
            "follows" in current_url or 
            current_url != initial_url or
            network_page.is_page_loaded()
        )
        
        checklist.check(
            "Navigation to network successful",
            navigation_successful,
            f"Navigation result: {current_url}"
        )
        
        checklist.assert_all_passed("Basic navigation functions correctly")
    
    @pytest.mark.smoke
    def test_responsive_ui_elements(self, driver, checklist):
        """Verify UI elements respond to basic interactions."""
        home_page = CineTrackHomePage(driver)
        
        # Load page
        checklist.check(
            "Load page for UI testing",
            home_page.navigate_to_home(),
            "Page loaded for UI testing"
        )
        
        # Test scrolling functionality
        initial_position = driver.execute_script("return window.pageYOffset;")
        
        # Attempt to scroll
        driver.execute_script("window.scrollTo(0, 500);")
        time.sleep(1)
        
        new_position = driver.execute_script("return window.pageYOffset;")
        scrolling_works = new_position != initial_position
        
        checklist.check(
            "Page scrolling works",
            scrolling_works,
            f"Scroll position changed from {initial_position} to {new_position}"
        )
        
        # Test page refresh
        refresh_successful = home_page.refresh_page()
        checklist.check(
            "Page refresh works",
            refresh_successful,
            "Page refresh completed successfully"
        )
        
        # Verify content still loads after refresh
        movies_after_refresh = len(home_page.get_movie_titles())
        checklist.check(
            "Content loads after refresh",
            movies_after_refresh > 0,
            f"Movies still visible after refresh: {movies_after_refresh}"
        )
        
        checklist.assert_all_passed("UI elements respond correctly to interactions")
    
    @pytest.mark.smoke
    @pytest.mark.performance
    def test_acceptable_load_times(self, driver, checklist):
        """Verify application loads within acceptable time limits."""
        home_page = CineTrackHomePage(driver)
        
        # Test initial load time
        start_time = time.time()
        load_successful = home_page.navigate_to_home()
        load_time = time.time() - start_time
        
        checklist.check(
            "Initial load within time limit",
            load_successful and load_time < 15.0,  # 15 second limit for smoke test
            f"Page loaded in {load_time:.2f} seconds"
        )
        
        # Test content rendering time
        start_render = time.time()
        has_content = (
            len(home_page.get_movie_titles()) > 0 or
            len(home_page.get_user_names()) > 0
        )
        render_time = time.time() - start_render
        
        checklist.check(
            "Content renders quickly",
            has_content and render_time < 5.0,
            f"Content rendered in {render_time:.2f} seconds"
        )
        
        checklist.assert_all_passed("Application meets basic performance requirements")
    
    @pytest.mark.smoke
    def test_error_handling_basics(self, driver, checklist):
        """Verify basic error handling doesn't break the application."""
        home_page = CineTrackHomePage(driver)
        
        # Test navigation to non-existent page
        invalid_url = f"{home_page.base_url}/invalid-page-test"
        driver.get(invalid_url)
        time.sleep(2)
        
        # Verify app doesn't completely break
        page_source = driver.page_source.lower()
        has_some_content = len(page_source) > 100  # Basic content check
        
        checklist.check(
            "Invalid URL doesn't break app",
            has_some_content,
            "Application responds to invalid URLs gracefully"
        )
        
        # Test recovery to valid page
        recovery_successful = home_page.navigate_to_home()
        checklist.check(
            "Recovery to valid page works",
            recovery_successful,
            "Successfully recovered from invalid URL"
        )
        
        # Verify normal functionality after recovery
        normal_content = len(home_page.get_movie_titles()) > 0
        checklist.check(
            "Normal functionality restored",
            normal_content,
            "Application restored to normal operation"
        )
        
        checklist.assert_all_passed("Basic error handling functions correctly")


class TestCineTrackRegressionSuite:
    """Comprehensive regression tests for core functionality."""
    
    @pytest.mark.regression
    def test_homepage_content_regression(self, driver, checklist):
        """Regression test for homepage content consistency."""
        home_page = CineTrackHomePage(driver)
        
        # Load homepage
        checklist.check(
            "Load homepage for regression test",
            home_page.navigate_to_home(),
            "Homepage loaded for regression testing"
        )
        
        # Verify expected movies are still present
        expected_movies = ["The Conjuring: Last Rites", "Superman", "F1"]
        movie_titles = home_page.get_movie_titles()
        
        movies_found = []
        for expected_movie in expected_movies:
            found = any(expected_movie in title for title in movie_titles)
            movies_found.append(found)
            checklist.check(
                f"'{expected_movie}' still in feed",
                found,
                f"Movie presence verified: {found}"
            )
        
        # Verify expected users are still active
        expected_users = ["Paul Rudd", "Jane Foster"]
        user_names = home_page.get_user_names()
        
        users_found = []
        for expected_user in expected_users:
            found = any(expected_user in name for name in user_names)
            users_found.append(found)
            checklist.check(
                f"'{expected_user}' still active",
                found,
                f"User activity verified: {found}"
            )
        
        # Overall regression check
        regression_pass = (sum(movies_found) >= 2 and sum(users_found) >= 1)
        checklist.check(
            "Overall content regression check",
            regression_pass,
            f"Movies: {sum(movies_found)}/{len(expected_movies)}, Users: {sum(users_found)}/{len(expected_users)}"
        )
        
        checklist.assert_all_passed("Homepage content regression test passed")
    
    @pytest.mark.regression
    def test_navigation_regression(self, driver, checklist):
        """Regression test for navigation functionality."""
        home_page = CineTrackHomePage(driver)
        network_page = CineTrackNetworkPage(driver)
        
        # Test home -> network -> home navigation flow
        checklist.check(
            "Start navigation regression test",
            home_page.navigate_to_home(),
            "Started at homepage"
        )
        
        # Navigate to network
        nav_to_network = home_page.click_network_link()
        time.sleep(2)
        
        checklist.check(
            "Navigate to network page",
            nav_to_network,
            "Navigation to network initiated"
        )
        
        # Verify network page loads
        network_loaded = (
            network_page.is_page_loaded() or
            "follows" in driver.current_url
        )
        checklist.check(
            "Network page loads correctly",
            network_loaded,
            f"Network page status: {network_loaded}"
        )
        
        # Navigate back to home
        driver.back()
        time.sleep(2)
        
        # Verify we're back at homepage
        back_to_home = home_page.is_page_loaded()
        checklist.check(
            "Back navigation to homepage",
            back_to_home,
            "Successfully navigated back to homepage"
        )
        
        checklist.assert_all_passed("Navigation regression test passed")
    
    @pytest.mark.regression
    @pytest.mark.performance
    def test_performance_regression(self, driver, checklist):
        """Regression test for performance characteristics."""
        home_page = CineTrackHomePage(driver)
        
        # Test multiple page loads for performance consistency
        load_times = []
        
        for i in range(3):
            start_time = time.time()
            load_success = home_page.navigate_to_home()
            load_time = time.time() - start_time
            
            load_times.append(load_time)
            
            checklist.check(
                f"Load {i+1} performance",
                load_success and load_time < 12.0,  # 12 second threshold
                f"Load {i+1}: {load_time:.2f} seconds"
            )
            
            # Brief pause between loads
            time.sleep(1)
        
        # Check performance consistency
        avg_load_time = sum(load_times) / len(load_times)
        max_load_time = max(load_times)
        
        checklist.check(
            "Average load time acceptable",
            avg_load_time < 8.0,
            f"Average load time: {avg_load_time:.2f} seconds"
        )
        
        checklist.check(
            "Maximum load time acceptable", 
            max_load_time < 15.0,
            f"Maximum load time: {max_load_time:.2f} seconds"
        )
        
        checklist.assert_all_passed("Performance regression test passed")
    
    @pytest.mark.regression
    def test_data_integrity_regression(self, driver, checklist):
        """Regression test for data integrity and consistency."""
        home_page = CineTrackHomePage(driver)
        
        # Load page multiple times and verify data consistency
        data_snapshots = []
        
        for i in range(2):
            home_page.navigate_to_home()
            time.sleep(1)
            
            snapshot = {
                'movies': sorted(home_page.get_movie_titles()),
                'users': sorted(home_page.get_user_names()),
                'review_count': len(home_page.get_review_content())
            }
            data_snapshots.append(snapshot)
            
            checklist.check(
                f"Data snapshot {i+1} collected",
                len(snapshot['movies']) > 0 and len(snapshot['users']) > 0,
                f"Snapshot {i+1}: {len(snapshot['movies'])} movies, {len(snapshot['users'])} users"
            )
        
        # Compare data consistency
        if len(data_snapshots) >= 2:
            movies_consistent = data_snapshots[0]['movies'] == data_snapshots[1]['movies']
            users_consistent = data_snapshots[0]['users'] == data_snapshots[1]['users']
            
            checklist.check(
                "Movie data consistency",
                movies_consistent,
                f"Movie data consistent across loads: {movies_consistent}"
            )
            
            checklist.check(
                "User data consistency",
                users_consistent,
                f"User data consistent across loads: {users_consistent}"
            )
        
        checklist.assert_all_passed("Data integrity regression test passed")