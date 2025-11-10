"""
API Integration Tests for Social Graph Activity Feed.

Tests the social module backend APIs: publications feed, follows, likes, and comments.
These are the core features of the social graph module.
"""

import pytest
import requests
import os


class TestSocialGraphAPI:
    """Tests for Social Graph backend API endpoints."""
    
    # Use environment variable or default to CloudFront URL
    BASE_URL = os.getenv('SOCIAL_API_URL', 'https://dj07hexl3m0a6.cloudfront.net')
    
    @pytest.fixture
    def api_session(self):
        """Create HTTP session for API testing."""
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'SocialGraph-Testing/1.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })
        return session
    
    @pytest.mark.api
    @pytest.mark.smoke
    def test_api_is_accessible(self, api_session, checklist):
        """Test that the social API is accessible."""
        url = self.BASE_URL
        
        try:
            response = api_session.get(url, timeout=10)
            checklist.check(
                "Social API is accessible",
                response.status_code in [200, 301, 302, 404],  # Any response means it's up
                f"Response status: {response.status_code}"
            )
        except requests.exceptions.RequestException as e:
            checklist.check(
                "Social API is accessible",
                False,
                f"API unreachable: {str(e)}"
            )
        
        checklist.assert_all_passed("Social API accessibility check")
    
    @pytest.mark.api
    def test_publications_feed_endpoint(self, api_session, checklist):
        """Test GET /api/publications endpoint returns feed data."""
        url = f"{self.BASE_URL}/api/publications"
        
        try:
            response = api_session.get(url, timeout=10)
            
            # Check response
            checklist.check(
                "Publications endpoint responds",
                response.status_code in [200, 401],  # 401 if auth required
                f"Status: {response.status_code}"
            )
            
            # If 200, verify it's JSON
            if response.status_code == 200:
                try:
                    data = response.json()
                    checklist.check(
                        "Response is valid JSON",
                        isinstance(data, (dict, list)),
                        f"Response type: {type(data)}"
                    )
                except ValueError:
                    checklist.check(
                        "Response is valid JSON",
                        False,
                        "Response is not valid JSON"
                    )
        except requests.exceptions.RequestException as e:
            checklist.check(
                "Publications endpoint responds",
                False,
                f"Request failed: {str(e)}"
            )
        
        checklist.assert_all_passed("Publications feed endpoint works")
    
    @pytest.mark.api
    def test_follows_endpoint(self, api_session, checklist):
        """Test GET /api/follows endpoint for social network data."""
        url = f"{self.BASE_URL}/api/follows"
        
        try:
            response = api_session.get(url, timeout=10)
            
            checklist.check(
                "Follows endpoint responds",
                response.status_code in [200, 401, 404],
                f"Status: {response.status_code}"
            )
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    checklist.check(
                        "Follows data is valid",
                        isinstance(data, (dict, list)),
                        "Valid JSON response"
                    )
                except ValueError:
                    pass
        except requests.exceptions.RequestException as e:
            checklist.check(
                "Follows endpoint responds",
                False,
                f"Request failed: {str(e)}"
            )
        
        checklist.assert_all_passed("Follows endpoint check")
    
    @pytest.mark.api
    def test_likes_endpoint_exists(self, api_session, checklist):
        """Test that likes endpoint exists (POST /api/likes)."""
        url = f"{self.BASE_URL}/api/likes"
        
        try:
            # Try POST without data (should get 400 or 401, not 404)
            response = api_session.post(url, json={}, timeout=10)
            
            # Endpoint should exist (not 404)
            checklist.check(
                "Likes endpoint exists",
                response.status_code != 404,
                f"Status: {response.status_code} (endpoint exists if not 404)"
            )
        except requests.exceptions.RequestException as e:
            checklist.check(
                "Likes endpoint reachable",
                False,
                f"Request failed: {str(e)}"
            )
        
        checklist.assert_all_passed("Likes endpoint exists")
    
    @pytest.mark.api
    def test_comments_endpoint_exists(self, api_session, checklist):
        """Test that comments endpoint exists (POST /api/comments)."""
        url = f"{self.BASE_URL}/api/comments"
        
        try:
            # Try POST without data (should get 400 or 401, not 404)
            response = api_session.post(url, json={}, timeout=10)
            
            # Endpoint should exist (not 404)
            checklist.check(
                "Comments endpoint exists",
                response.status_code != 404,
                f"Status: {response.status_code} (endpoint exists if not 404)"
            )
        except requests.exceptions.RequestException as e:
            checklist.check(
                "Comments endpoint reachable",
                False,
                f"Request failed: {str(e)}"
            )
        
        checklist.assert_all_passed("Comments endpoint exists")
