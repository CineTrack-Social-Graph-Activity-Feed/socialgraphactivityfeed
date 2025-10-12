"""
Unit tests for test utilities.

This module contains unit tests for the testing infrastructure
components like checklist, selenium helpers, etc.
"""

import pytest
from datetime import datetime
from tests.utils.checklist import TestChecklist, TestStep


class TestTestStep:
    """Unit tests for TestStep class."""
    
    @pytest.mark.unit
    def test_test_step_creation(self):
        """Test TestStep object creation and properties."""
        step = TestStep(name="Test Step", ok=True, message="Success")
        
        assert step.name == "Test Step"
        assert step.ok is True
        assert step.message == "Success"
        assert isinstance(step.timestamp, datetime)
        assert step.duration_ms is None
        assert step.screenshot_path is None
        assert step.extra_data == {}
    
    @pytest.mark.unit
    def test_test_step_to_dict(self):
        """Test TestStep serialization to dictionary."""
        step = TestStep(
            name="Test Step",
            ok=False,
            message="Failed",
            duration_ms=150.5,
            screenshot_path="/path/to/screenshot.png",
            extra_data={"key": "value"}
        )
        
        result = step.to_dict()
        
        assert result["name"] == "Test Step"
        assert result["ok"] is False
        assert result["message"] == "Failed"
        assert result["duration_ms"] == 150.5
        assert result["screenshot_path"] == "/path/to/screenshot.png"
        assert result["extra_data"] == {"key": "value"}
        assert "timestamp" in result


class TestTestChecklist:
    """Unit tests for TestChecklist class."""
    
    @pytest.fixture
    def checklist(self):
        """Create a test checklist instance."""
        return TestChecklist(
            test_name="sample_test",
            module_name="test_module",
            started_at=datetime.now()
        )
    
    @pytest.mark.unit
    def test_checklist_creation(self, checklist):
        """Test TestChecklist object creation."""
        assert checklist.test_name == "sample_test"
        assert checklist.module_name == "test_module"
        assert isinstance(checklist.started_at, datetime)
        assert checklist.steps == []
        assert checklist.tags == []
        assert checklist.environment == "unknown"
        assert checklist.browser == "unknown"
        assert checklist.test_data == {}
    
    @pytest.mark.unit
    def test_check_method(self, checklist):
        """Test the check method for adding test steps."""
        checklist.check("Step 1", True, "Success message")
        checklist.check("Step 2", False, "Failure message")
        
        assert len(checklist.steps) == 2
        assert checklist.steps[0].name == "Step 1"
        assert checklist.steps[0].ok is True
        assert checklist.steps[0].message == "Success message"
        assert checklist.steps[1].name == "Step 2"
        assert checklist.steps[1].ok is False
        assert checklist.steps[1].message == "Failure message"
    
    @pytest.mark.unit
    def test_step_counts(self, checklist):
        """Test step counting properties."""
        checklist.check("Pass 1", True)
        checklist.check("Pass 2", True)
        checklist.check("Fail 1", False)
        
        assert checklist.total == 3
        assert checklist.passed == 2
        assert checklist.failed == 1
        assert round(checklist.pass_rate, 2) == 66.67  # Rounded to 2 decimal places
    
    @pytest.mark.unit
    def test_is_success_property(self, checklist):
        """Test the is_success property."""
        # Empty checklist should not be success
        assert checklist.is_success is False
        
        # All passing steps should be success
        checklist.check("Step 1", True)
        checklist.check("Step 2", True)
        assert checklist.is_success is True
        
        # Any failing step should make it not success
        checklist.check("Step 3", False)
        assert checklist.is_success is False
    
    @pytest.mark.unit
    def test_get_failed_steps(self, checklist):
        """Test getting failed steps."""
        checklist.check("Pass", True)
        checklist.check("Fail 1", False, "Error 1")
        checklist.check("Fail 2", False, "Error 2")
        
        failed_steps = checklist.get_failed_steps()
        
        assert len(failed_steps) == 2
        assert failed_steps[0].name == "Fail 1"
        assert failed_steps[1].name == "Fail 2"
        assert all(not step.ok for step in failed_steps)
    
    @pytest.mark.unit
    def test_add_tag(self, checklist):
        """Test adding tags to checklist."""
        checklist.add_tag("smoke")
        checklist.add_tag("regression")
        checklist.add_tag("smoke")  # Duplicate should not be added
        
        assert len(checklist.tags) == 2
        assert "smoke" in checklist.tags
        assert "regression" in checklist.tags
    
    @pytest.mark.unit
    def test_set_environment_info(self, checklist):
        """Test setting environment information."""
        checklist.set_environment_info(environment="staging", browser="chrome")
        
        assert checklist.environment == "staging"
        assert checklist.browser == "chrome"
        
        # Test partial updates
        checklist.set_environment_info(browser="firefox")
        assert checklist.environment == "staging"  # Should remain unchanged
        assert checklist.browser == "firefox"  # Should be updated
    
    @pytest.mark.unit
    def test_add_test_data(self, checklist):
        """Test adding test data."""
        checklist.add_test_data("user_id", 123)
        checklist.add_test_data("username", "testuser")
        
        assert checklist.test_data["user_id"] == 123
        assert checklist.test_data["username"] == "testuser"
    
    @pytest.mark.unit
    def test_summary_dict(self, checklist):
        """Test summary dictionary generation."""
        checklist.add_tag("unit")
        checklist.set_environment_info("test", "chrome")
        checklist.add_test_data("key", "value")
        checklist.check("Step 1", True, "Success")
        checklist.check("Step 2", False, "Failure")
        
        summary = checklist.summary_dict()
        
        assert summary["test_name"] == "sample_test"
        assert summary["module"] == "test_module"
        assert summary["environment"] == "test"
        assert summary["browser"] == "chrome"
        assert summary["tags"] == ["unit"]
        assert summary["test_data"] == {"key": "value"}
        
        assert summary["summary"]["total_steps"] == 2
        assert summary["summary"]["passed_steps"] == 1
        assert summary["summary"]["failed_steps"] == 1
        assert summary["summary"]["pass_rate"] == 50.0
        assert summary["summary"]["success"] is False
        
        assert len(summary["steps"]) == 2
        assert len(summary["failed_steps"]) == 1
    
    @pytest.mark.unit
    def test_assert_all_passed_success(self, checklist):
        """Test assert_all_passed when all steps pass."""
        checklist.check("Step 1", True)
        checklist.check("Step 2", True)
        
        # Should not raise any exception
        try:
            checklist.assert_all_passed()
        except AssertionError:
            pytest.fail("assert_all_passed should not raise exception when all steps pass")
    
    @pytest.mark.unit
    def test_assert_all_passed_failure(self, checklist):
        """Test assert_all_passed when some steps fail."""
        checklist.check("Step 1", True)
        checklist.check("Step 2", False, "This failed")
        
        with pytest.raises(AssertionError) as exc_info:
            checklist.assert_all_passed()
        
        error_message = str(exc_info.value)
        assert "Test failed: 1/2 steps failed" in error_message
        assert "Step 2" in error_message
    
    @pytest.mark.unit
    def test_assert_all_passed_custom_message(self, checklist):
        """Test assert_all_passed with custom error message."""
        checklist.check("Step 1", False)
        
        with pytest.raises(AssertionError) as exc_info:
            checklist.assert_all_passed("Custom error message")
        
        error_message = str(exc_info.value)
        assert "Custom error message" in error_message
    
    @pytest.mark.unit
    def test_to_json(self, checklist, tmp_path):
        """Test JSON serialization."""
        checklist.check("Step 1", True, "Success")
        checklist.check("Step 2", False, "Failure")
        
        # Test JSON string generation
        json_str = checklist.to_json()
        assert isinstance(json_str, str)
        assert "sample_test" in json_str
        assert "Step 1" in json_str
        assert "Step 2" in json_str
        
        # Test file saving
        json_file = tmp_path / "test_results.json"
        checklist.to_json(json_file)
        
        assert json_file.exists()
        content = json_file.read_text(encoding='utf-8')
        assert "sample_test" in content
    
    @pytest.mark.unit
    def test_duration_calculation(self, checklist):
        """Test duration calculation between steps."""
        import time
        
        start_time = checklist.started_at
        
        # Add some steps with small delays
        checklist.check("Step 1", True)
        time.sleep(0.1)  # 100ms delay
        checklist.check("Step 2", True)
        
        duration = checklist.duration_seconds
        assert duration > 0
        assert duration < 1.0  # Should be less than 1 second
    
    @pytest.mark.unit
    def test_empty_checklist_properties(self):
        """Test properties of empty checklist."""
        empty_checklist = TestChecklist(
            test_name="empty",
            module_name="test",
            started_at=datetime.now()
        )
        
        assert empty_checklist.total == 0
        assert empty_checklist.passed == 0
        assert empty_checklist.failed == 0
        assert empty_checklist.pass_rate == 0.0
        assert empty_checklist.is_success is False
        assert empty_checklist.get_failed_steps() == []
        assert empty_checklist.duration_seconds == 0.0