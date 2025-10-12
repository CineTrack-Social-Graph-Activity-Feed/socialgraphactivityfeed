"""
Enhanced Checklist for comprehensive test reporting.

This module provides an improved checklist system for tracking test steps,
generating detailed reports, and supporting multiple output formats.
"""

import json
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


@dataclass
class TestStep:
    """Represents a single test step with result and metadata."""
    
    name: str
    ok: bool
    message: str = ""
    timestamp: datetime = field(default_factory=datetime.now)
    duration_ms: Optional[float] = None
    screenshot_path: Optional[str] = None
    extra_data: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert step to dictionary for serialization."""
        return {
            "name": self.name,
            "ok": self.ok,
            "message": self.message,
            "timestamp": self.timestamp.isoformat(),
            "duration_ms": self.duration_ms,
            "screenshot_path": self.screenshot_path,
            "extra_data": self.extra_data
        }


@dataclass
class TestChecklist:
    """
    Enhanced test checklist for comprehensive test reporting.
    
    Provides step tracking, timing, screenshots, and detailed reporting
    capabilities for automated testing.
    """
    
    test_name: str
    module_name: str
    started_at: datetime
    steps: List[TestStep] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    environment: str = "unknown"
    browser: str = "unknown"
    test_data: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Initialize additional attributes after creation."""
        self._current_step_start: Optional[datetime] = None
    
    def start_step(self, name: str) -> None:
        """
        Start timing a test step.
        
        Args:
            name: Name of the step being started
        """
        self._current_step_start = datetime.now()
        logger.info(f"Starting step: {name}")
    
    def check(self, name: str, condition: bool, message: str = "", 
              screenshot_path: Optional[str] = None, 
              extra_data: Optional[Dict[str, Any]] = None) -> None:
        """
        Add a test step result to the checklist.
        
        Args:
            name: Name of the test step
            condition: Whether the step passed (True) or failed (False)
            message: Optional message with details
            screenshot_path: Optional path to screenshot for this step
            extra_data: Optional additional data for this step
        """
        duration_ms = None
        if self._current_step_start:
            duration_ms = (datetime.now() - self._current_step_start).total_seconds() * 1000
            self._current_step_start = None
        
        step = TestStep(
            name=name,
            ok=bool(condition),
            message=message,
            duration_ms=duration_ms,
            screenshot_path=screenshot_path,
            extra_data=extra_data or {}
        )
        
        self.steps.append(step)
        
        # Log the result
        status = "PASS" if condition else "FAIL"
        log_message = f"Step '{name}': {status}"
        if message:
            log_message += f" - {message}"
        if duration_ms:
            log_message += f" ({duration_ms:.1f}ms)"
        
        if condition:
            logger.info(log_message)
        else:
            logger.error(log_message)
    
    def add_tag(self, tag: str) -> None:
        """Add a tag to the test."""
        if tag not in self.tags:
            self.tags.append(tag)
    
    def set_environment_info(self, environment: str = None, browser: str = None) -> None:
        """Set environment information for the test."""
        if environment:
            self.environment = environment
        if browser:
            self.browser = browser
    
    def add_test_data(self, key: str, value: Any) -> None:
        """Add test data for reference."""
        self.test_data[key] = value
    
    @property
    def total(self) -> int:
        """Get total number of steps."""
        return len(self.steps)
    
    @property
    def passed(self) -> int:
        """Get number of passed steps."""
        return sum(1 for step in self.steps if step.ok)
    
    @property
    def failed(self) -> int:
        """Get number of failed steps."""
        return self.total - self.passed
    
    @property
    def pass_rate(self) -> float:
        """Get pass rate as percentage."""
        if self.total == 0:
            return 0.0
        return (self.passed / self.total) * 100
    
    @property
    def duration_seconds(self) -> float:
        """Get total test duration in seconds."""
        if not self.steps:
            return 0.0
        
        end_time = max(step.timestamp for step in self.steps)
        return (end_time - self.started_at).total_seconds()
    
    @property
    def is_success(self) -> bool:
        """Check if all steps passed."""
        return self.failed == 0 and self.total > 0
    
    def get_failed_steps(self) -> List[TestStep]:
        """Get list of failed steps."""
        return [step for step in self.steps if not step.ok]
    
    def summary_dict(self) -> Dict[str, Any]:
        """
        Generate comprehensive summary dictionary.
        
        Returns:
            Dict with complete test summary including metadata and results
        """
        return {
            "test_name": self.test_name,
            "module": self.module_name,
            "started_at": self.started_at.strftime("%Y-%m-%d %H:%M:%S"),
            "duration_seconds": self.duration_seconds,
            "environment": self.environment,
            "browser": self.browser,
            "tags": self.tags,
            "test_data": self.test_data,
            "summary": {
                "total_steps": self.total,
                "passed_steps": self.passed,
                "failed_steps": self.failed,
                "pass_rate": round(self.pass_rate, 2),
                "success": self.is_success
            },
            "steps": [step.to_dict() for step in self.steps],
            "failed_steps": [step.to_dict() for step in self.get_failed_steps()]
        }
    
    def to_json(self, filepath: Optional[Path] = None) -> str:
        """
        Convert checklist to JSON format.
        
        Args:
            filepath: Optional path to save JSON file
            
        Returns:
            JSON string representation
        """
        json_data = json.dumps(self.summary_dict(), indent=2, ensure_ascii=False)
        
        if filepath:
            filepath.write_text(json_data, encoding='utf-8')
            logger.info(f"Test results saved to: {filepath}")
        
        return json_data
    
    def assert_all_passed(self, custom_message: str = None) -> None:
        """
        Assert that all steps passed, raising AssertionError if not.
        
        Args:
            custom_message: Optional custom error message
            
        Raises:
            AssertionError: If any steps failed
        """
        if not self.is_success:
            failed_step_names = [step.name for step in self.get_failed_steps()]
            error_msg = custom_message or f"Test failed: {self.failed}/{self.total} steps failed"
            error_msg += f"\nFailed steps: {', '.join(failed_step_names)}"
            raise AssertionError(error_msg)


# Backward compatibility alias
Checklist = TestChecklist