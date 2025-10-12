"""
Feed Page Object for social graph activity feed.

Contains locators and methods for interacting with the main feed page.
"""

from typing import List, Optional, Tuple
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from tests.pages.base_page import BasePage
from tests.utils.checklist import TestChecklist


class FeedPage(BasePage):
    """
    Page object for the main activity feed page.
    
    Provides methods for interacting with posts, likes, comments,
    and other feed-related functionality.
    """
    
    # Page URL
    PAGE_PATH = "/feed"
    
    # Main feed locators
    FEED_CONTAINER = (By.CLASS_NAME, "feed-container")
    POST_CARDS = (By.CLASS_NAME, "post")
    LOADING_MORE = (By.CLASS_NAME, "loading-more")
    
    # Post interaction locators
    LIKE_BUTTON = (By.CLASS_NAME, "like-post-btn")
    LIKE_COUNT = (By.CSS_SELECTOR, ".action > span")
    COMMENT_INPUT = (By.CLASS_NAME, "comment-post-input")
    COMMENT_SUBMIT = (By.CLASS_NAME, "comment-post-btn")
    COMMENT_ITEMS = (By.CLASS_NAME, "comment")
    COMMENT_DELETE = (By.CLASS_NAME, "delete-comment-btn")
    
    # Post content locators
    POST_AUTHOR = (By.CLASS_NAME, "post-author")
    POST_CONTENT = (By.CLASS_NAME, "post-content")
    POST_TIMESTAMP = (By.CLASS_NAME, "post-timestamp")
    POST_IMAGE = (By.CLASS_NAME, "post-image")
    
    def navigate_to_feed(self) -> None:
        """Navigate to the feed page."""
        self.navigate_to(self.PAGE_PATH)
    
    def wait_for_feed_to_load(self, timeout: int = 15) -> bool:
        """
        Wait for the feed to load completely.
        
        Args:
            timeout: Maximum wait time
            
        Returns:
            bool: True if feed loaded successfully
        """
        try:
            self.wait_for_element_visible(self.FEED_CONTAINER, timeout)
            self.wait_for_loading_to_complete()
            return True
        except Exception:
            return False
    
    def get_post_cards(self) -> List[WebElement]:
        """
        Get all visible post cards in the feed.
        
        Returns:
            List[WebElement]: List of post card elements
        """
        try:
            return self.driver.find_elements(*self.POST_CARDS)
        except Exception:
            return []
    
    def get_first_post(self) -> Optional[WebElement]:
        """
        Get the first post in the feed.
        
        Returns:
            Optional[WebElement]: First post element or None
        """
        posts = self.get_post_cards()
        return posts[0] if posts else None
    
    def like_post(self, post_element: WebElement) -> Tuple[bool, str]:
        """
        Like a specific post.
        
        Args:
            post_element: The post element to like
            
        Returns:
            Tuple[bool, str]: (Success status, like count after action)
        """
        try:
            like_button = post_element.find_element(*self.LIKE_BUTTON)
            like_count_element = post_element.find_element(*self.LIKE_COUNT)
            
            # Get count before clicking
            count_before = like_count_element.text.strip()
            
            # Click like button
            like_button.click()
            
            # Wait for count to change
            self.utils.wait.until(
                lambda driver: post_element.find_element(*self.LIKE_COUNT).text.strip() != count_before
            )
            
            # Get count after clicking
            count_after = like_count_element.text.strip()
            
            return True, count_after
        except Exception as e:
            return False, str(e)
    
    def unlike_post(self, post_element: WebElement) -> Tuple[bool, str]:
        """
        Unlike a specific post (same action as like, but semantically different).
        
        Args:
            post_element: The post element to unlike
            
        Returns:
            Tuple[bool, str]: (Success status, like count after action)
        """
        return self.like_post(post_element)  # Same action
    
    def add_comment(self, post_element: WebElement, comment_text: str) -> Tuple[bool, Optional[WebElement]]:
        """
        Add a comment to a specific post.
        
        Args:
            post_element: The post element to comment on
            comment_text: Text of the comment
            
        Returns:
            Tuple[bool, Optional[WebElement]]: (Success status, new comment element)
        """
        try:
            comment_input = post_element.find_element(*self.COMMENT_INPUT)
            comment_submit = post_element.find_element(*self.COMMENT_SUBMIT)
            
            # Clear and enter comment text
            comment_input.clear()
            comment_input.send_keys(comment_text)
            
            # Submit comment
            comment_submit.click()
            
            # Wait for new comment to appear
            import time
            time.sleep(2)  # Allow time for comment to be added
            
            # Find the new comment (assuming it appears at the top)
            comments = post_element.find_elements(*self.COMMENT_ITEMS)
            new_comment = None
            
            for comment in comments:
                if comment_text in comment.text:
                    new_comment = comment
                    break
            
            return new_comment is not None, new_comment
        except Exception as e:
            return False, None
    
    def delete_comment(self, comment_element: WebElement) -> bool:
        """
        Delete a specific comment.
        
        Args:
            comment_element: The comment element to delete
            
        Returns:
            bool: True if deletion was successful
        """
        try:
            delete_button = comment_element.find_element(*self.COMMENT_DELETE)
            delete_button.click()
            
            # Wait a moment for deletion to process
            import time
            time.sleep(1)
            
            return True
        except Exception:
            return False
    
    def get_post_author(self, post_element: WebElement) -> Optional[str]:
        """
        Get the author name of a post.
        
        Args:
            post_element: The post element
            
        Returns:
            Optional[str]: Author name or None
        """
        try:
            author_element = post_element.find_element(*self.POST_AUTHOR)
            return author_element.text.strip()
        except Exception:
            return None
    
    def get_post_content(self, post_element: WebElement) -> Optional[str]:
        """
        Get the content text of a post.
        
        Args:
            post_element: The post element
            
        Returns:
            Optional[str]: Post content or None
        """
        try:
            content_element = post_element.find_element(*self.POST_CONTENT)
            return content_element.text.strip()
        except Exception:
            return None
    
    def get_like_count(self, post_element: WebElement) -> Optional[str]:
        """
        Get the like count for a post.
        
        Args:
            post_element: The post element
            
        Returns:
            Optional[str]: Like count text or None
        """
        try:
            like_count_element = post_element.find_element(*self.LIKE_COUNT)
            return like_count_element.text.strip()
        except Exception:
            return None
    
    def scroll_to_load_more_posts(self) -> bool:
        """
        Scroll down to trigger loading more posts.
        
        Returns:
            bool: True if scroll was successful
        """
        try:
            # Scroll to bottom of page
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            
            # Wait for loading indicator or new posts
            import time
            time.sleep(2)
            
            return True
        except Exception:
            return False
    
    def perform_feed_interaction_flow(self, checklist: TestChecklist, 
                                    comment_text: str = "Comentario auto QA") -> None:
        """
        Perform a complete feed interaction flow for testing.
        
        Args:
            checklist: Test checklist for tracking steps
            comment_text: Text to use for comment testing
        """
        # Step 1: Load feed
        checklist.start_step("Load Feed")
        success = self.wait_for_feed_to_load()
        checklist.check("Cargar Feed", success, 
                       "Feed loaded successfully" if success else "Failed to load feed")
        
        if not success:
            return
        
        # Step 2: Get first post
        first_post = self.get_first_post()
        checklist.check("Encontrar primera publicación", first_post is not None,
                       "First post found" if first_post else "No posts found in feed")
        
        if not first_post:
            return
        
        # Step 3: Like post
        checklist.start_step("Like Post")
        like_success, like_count = self.like_post(first_post)
        checklist.check("Dar Like a Publicación", like_success,
                       f"Like count: {like_count}" if like_success else f"Error: {like_count}")
        
        # Step 4: Unlike post
        if like_success:
            checklist.start_step("Unlike Post")
            unlike_success, unlike_count = self.unlike_post(first_post)
            checklist.check("Quitar Like a Publicación", unlike_success,
                           f"Like count after unlike: {unlike_count}" if unlike_success else f"Error: {unlike_count}")
        
        # Step 5: Add comment
        checklist.start_step("Add Comment")
        comment_success, new_comment = self.add_comment(first_post, comment_text)
        checklist.check("Crear Comentario", comment_success,
                       f"Comment '{comment_text}' added" if comment_success else "Failed to add comment")
        
        # Step 6: Delete comment
        if comment_success and new_comment:
            checklist.start_step("Delete Comment")
            delete_success = self.delete_comment(new_comment)
            checklist.check("Eliminar Comentario", delete_success,
                           "Comment deleted successfully" if delete_success else "Failed to delete comment")
        else:
            checklist.check("Eliminar Comentario", False, "No comment to delete")
        
        # Final verification
        all_passed = checklist.passed == checklist.total
        checklist.check("Feed flow completo", all_passed,
                       f"All steps completed successfully ({checklist.passed}/{checklist.total})" if all_passed 
                       else f"Some steps failed ({checklist.passed}/{checklist.total})")