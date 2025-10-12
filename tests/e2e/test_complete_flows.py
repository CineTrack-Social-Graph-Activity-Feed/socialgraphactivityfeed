"""
End-to-End tests for the Social Graph Activity Feed.

This module contains comprehensive E2E tests using Page Objects
and modern testing practices.
"""

import pytest
import os
from tests.pages.feed_page import FeedPage
from tests.pages.network_page import NetworkPage
from tests.utils.checklist import TestChecklist


class TestFeedFunctionality:
    """Test suite for feed functionality."""
    
    @pytest.mark.e2e
    @pytest.mark.smoke
    def test_feed_interaction_complete_flow(self, driver, test_config):
        """
        Test complete feed interaction flow including like, unlike, comment, and delete comment.
        
        This test verifies:
        1. Feed loads properly
        2. User can like a post
        3. User can unlike a post
        4. User can add a comment
        5. User can delete a comment
        """
        # Initialize page object and checklist
        feed_page = FeedPage(driver, test_config["base_url"])
        checklist = TestChecklist(
            test_name="test_feed_interaction_complete_flow",
            module_name="test_e2e_feed",
            started_at=pytest.current_test_start_time if hasattr(pytest, 'current_test_start_time') else None
        )
        checklist.set_environment_info(test_config["environment"], test_config["browser"])
        
        try:
            # Navigate to feed
            feed_page.navigate_to_feed()
            
            # Perform complete feed interaction flow
            feed_page.perform_feed_interaction_flow(checklist, "Comentario automatizado E2E")
            
            # Assert all steps passed
            checklist.assert_all_passed("Feed interaction flow should complete successfully")
            
        except Exception as e:
            # Take screenshot on failure
            screenshot_path = feed_page.take_screenshot(f"feed_flow_failure_{pytest.current_test_name}.png")
            checklist.check("Test execution", False, f"Unexpected error: {str(e)}", screenshot_path)
            raise
        finally:
            # Log results
            checklist.to_json()
    
    @pytest.mark.e2e
    @pytest.mark.regression
    def test_feed_loading_performance(self, driver, test_config):
        """
        Test feed loading performance and verify essential elements.
        
        This test verifies:
        1. Feed loads within acceptable time
        2. At least one post is visible
        3. All essential UI elements are present
        """
        feed_page = FeedPage(driver, test_config["base_url"])
        checklist = TestChecklist(
            test_name="test_feed_loading_performance",
            module_name="test_e2e_feed",
            started_at=pytest.current_test_start_time if hasattr(pytest, 'current_test_start_time') else None
        )
        checklist.set_environment_info(test_config["environment"], test_config["browser"])
        
        try:
            # Measure load time
            import time
            start_time = time.time()
            
            feed_page.navigate_to_feed()
            load_success = feed_page.wait_for_feed_to_load(timeout=10)
            
            load_time = time.time() - start_time
            
            checklist.check("Feed loads within 10 seconds", load_success, 
                           f"Feed loaded in {load_time:.2f} seconds")
            
            if load_success:
                # Check for posts
                posts = feed_page.get_post_cards()
                checklist.check("At least one post visible", len(posts) > 0, 
                               f"Found {len(posts)} posts")
                
                # Check first post has essential elements
                if posts:
                    first_post = posts[0]
                    author = feed_page.get_post_author(first_post)
                    content = feed_page.get_post_content(first_post)
                    like_count = feed_page.get_like_count(first_post)
                    
                    checklist.check("Post has author", author is not None, f"Author: {author}")
                    checklist.check("Post has content", content is not None, f"Content length: {len(content) if content else 0}")
                    checklist.check("Post has like count", like_count is not None, f"Like count: {like_count}")
            
            checklist.assert_all_passed("Feed performance test should pass")
            
        except Exception as e:
            screenshot_path = feed_page.take_screenshot(f"feed_performance_failure_{pytest.current_test_name}.png")
            checklist.check("Test execution", False, f"Unexpected error: {str(e)}", screenshot_path)
            raise
        finally:
            checklist.to_json()


class TestNetworkFunctionality:
    """Test suite for network/follows functionality."""
    
    @pytest.mark.e2e
    @pytest.mark.smoke
    def test_network_follow_unfollow_flow(self, driver, test_config):
        """
        Test complete network interaction flow including follow and unfollow operations.
        
        This test verifies:
        1. Network page loads properly
        2. User can switch between tabs
        3. User can follow another user
        4. User can unfollow a user
        """
        # Initialize page object and checklist
        network_page = NetworkPage(driver, test_config["base_url"])
        checklist = TestChecklist(
            test_name="test_network_follow_unfollow_flow",
            module_name="test_e2e_network",
            started_at=pytest.current_test_start_time if hasattr(pytest, 'current_test_start_time') else None
        )
        checklist.set_environment_info(test_config["environment"], test_config["browser"])
        
        try:
            # Navigate to network page
            network_page.navigate_to_network()
            
            # Perform complete network interaction flow
            network_page.perform_network_flow(checklist)
            
            # Assert all steps passed
            checklist.assert_all_passed("Network interaction flow should complete successfully")
            
        except Exception as e:
            # Take screenshot on failure
            screenshot_path = network_page.take_screenshot(f"network_flow_failure_{pytest.current_test_name}.png")
            checklist.check("Test execution", False, f"Unexpected error: {str(e)}", screenshot_path)
            raise
        finally:
            # Log results
            checklist.to_json()
    
    @pytest.mark.e2e
    @pytest.mark.ui
    def test_network_page_navigation(self, driver, test_config):
        """
        Test navigation and UI elements on the network page.
        
        This test verifies:
        1. Network page loads
        2. Both tabs are visible and functional
        3. User lists are populated
        4. UI elements are properly rendered
        """
        network_page = NetworkPage(driver, test_config["base_url"])
        checklist = TestChecklist(
            test_name="test_network_page_navigation",
            module_name="test_e2e_network",
            started_at=pytest.current_test_start_time if hasattr(pytest, 'current_test_start_time') else None
        )
        checklist.set_environment_info(test_config["environment"], test_config["browser"])
        
        try:
            # Load network page
            network_page.navigate_to_network()
            load_success = network_page.wait_for_network_page_load()
            checklist.check("Network page loads", load_success, "Page loaded successfully")
            
            if load_success:
                # Test tab navigation
                seguidos_success = network_page.switch_to_seguidos_tab()
                checklist.check("Switch to Seguidos tab", seguidos_success, "Seguidos tab activated")
                
                seguidores_success = network_page.switch_to_seguidores_tab()
                checklist.check("Switch to Seguidores tab", seguidores_success, "Seguidores tab activated")
                
                # Check user list content
                user_rows = network_page.get_user_rows()
                checklist.check("User list populated", len(user_rows) > 0, f"Found {len(user_rows)} users")
                
                # Check first user has required elements
                if user_rows:
                    first_user = user_rows[0]
                    user_name = network_page.get_user_name(first_user)
                    follow_btn_text = network_page.get_follow_button_text(first_user)
                    
                    checklist.check("User has name", user_name is not None, f"User name: {user_name}")
                    checklist.check("User has follow button", follow_btn_text is not None, f"Button text: {follow_btn_text}")
            
            checklist.assert_all_passed("Network navigation test should pass")
            
        except Exception as e:
            screenshot_path = network_page.take_screenshot(f"network_navigation_failure_{pytest.current_test_name}.png")
            checklist.check("Test execution", False, f"Unexpected error: {str(e)}", screenshot_path)
            raise
        finally:
            checklist.to_json()


class TestIntegratedUserJourney:
    """Test suite for integrated user journeys across multiple pages."""
    
    @pytest.mark.e2e
    @pytest.mark.slow
    @pytest.mark.regression
    def test_complete_user_journey(self, driver, test_config):
        """
        Test a complete user journey across feed and network pages.
        
        This comprehensive test verifies:
        1. User can interact with feed (like, comment)
        2. User can navigate to network page
        3. User can manage follows/followers
        4. User can return to feed and continue interactions
        """
        # Initialize page objects and checklist
        feed_page = FeedPage(driver, test_config["base_url"])
        network_page = NetworkPage(driver, test_config["base_url"])
        checklist = TestChecklist(
            test_name="test_complete_user_journey",
            module_name="test_e2e_integrated",
            started_at=pytest.current_test_start_time if hasattr(pytest, 'current_test_start_time') else None
        )
        checklist.set_environment_info(test_config["environment"], test_config["browser"])
        checklist.add_tag("integration")
        checklist.add_tag("user_journey")
        
        try:
            # Phase 1: Feed Interaction
            checklist.start_step("Feed Phase")
            feed_page.navigate_to_feed()
            
            # Basic feed interaction
            if feed_page.wait_for_feed_to_load():
                first_post = feed_page.get_first_post()
                if first_post:
                    # Like and unlike
                    like_success, _ = feed_page.like_post(first_post)
                    checklist.check("Like post in journey", like_success, "Post liked successfully")
                    
                    if like_success:
                        unlike_success, _ = feed_page.unlike_post(first_post)
                        checklist.check("Unlike post in journey", unlike_success, "Post unliked successfully")
            
            # Phase 2: Network Interaction
            checklist.start_step("Network Phase")
            network_page.navigate_to_network()
            
            if network_page.wait_for_network_page_load():
                # Switch to seguidores and try to follow someone
                if network_page.switch_to_seguidores_tab():
                    target_user = network_page.find_user_with_follow_button("seguir")
                    if target_user:
                        user_row, follow_btn = target_user
                        follow_success, _ = network_page.follow_user(user_row, follow_btn)
                        checklist.check("Follow user in journey", follow_success, "User followed successfully")
                        
                        if follow_success:
                            unfollow_success, _ = network_page.unfollow_user(user_row, follow_btn)
                            checklist.check("Unfollow user in journey", unfollow_success, "User unfollowed successfully")
            
            # Phase 3: Return to Feed
            checklist.start_step("Return to Feed Phase")
            feed_page.navigate_to_feed()
            final_load = feed_page.wait_for_feed_to_load()
            checklist.check("Return to feed after network", final_load, "Successfully returned to feed")
            
            # Verify everything still works
            if final_load:
                posts_count = len(feed_page.get_post_cards())
                checklist.check("Feed still functional", posts_count > 0, f"Feed has {posts_count} posts")
            
            # Final assessment
            success_rate = checklist.pass_rate
            checklist.check("Complete journey success rate", success_rate >= 80.0, 
                           f"Success rate: {success_rate}% (minimum 80% required)")
            
            checklist.assert_all_passed("Complete user journey should be successful")
            
        except Exception as e:
            screenshot_path = feed_page.take_screenshot(f"user_journey_failure_{pytest.current_test_name}.png")
            checklist.check("Test execution", False, f"Unexpected error: {str(e)}", screenshot_path)
            raise
        finally:
            checklist.to_json()


# Pytest hooks for this module
@pytest.fixture(autouse=True)
def setup_test_timing(request):
    """Setup test timing for checklist integration."""
    import datetime
    pytest.current_test_start_time = datetime.datetime.now()
    pytest.current_test_name = request.node.name
    yield
    # Cleanup if needed