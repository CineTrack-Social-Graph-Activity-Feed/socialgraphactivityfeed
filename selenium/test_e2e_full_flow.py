# tests/selenium/test_full_flow.py
import pytest
from .feed_flow import feed_like_comment_flow
from .network_flow import network_follow_unfollow_flow

@pytest.mark.e2e
def test_full_user_journey(driver, checklist):
    feed_like_comment_flow(driver, checklist)
    network_follow_unfollow_flow(driver, checklist)

    assert checklist.passed == checklist.total, "Fallaron pasos"
