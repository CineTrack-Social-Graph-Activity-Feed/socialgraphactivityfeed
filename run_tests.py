#!/usr/bin/env python3
"""
Professional test runner for SocialGraphActivityFeed project.

This script provides a comprehensive test execution interface with
multiple options for different testing scenarios and reporting.
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path
from datetime import datetime


class TestRunner:
    """Professional test runner with comprehensive options."""
    
    def __init__(self):
        """Initialize the test runner."""
        self.project_root = Path(__file__).parent.parent
        self.tests_root = self.project_root / "tests"
        self.reports_dir = self.tests_root / "reports"
        
        # Ensure reports directory exists
        self.reports_dir.mkdir(exist_ok=True, parents=True)
    
    def run_command(self, command: list, description: str = "") -> int:
        """
        Run a command and handle output.
        
        Args:
            command: Command list to execute
            description: Description of what the command does
            
        Returns:
            int: Return code from command execution
        """
        if description:
            print(f"\n{'='*60}")
            print(f"🚀 {description}")
            print(f"{'='*60}")
        
        print(f"💻 Running: {' '.join(command)}")
        print()
        
        try:
            result = subprocess.run(command, cwd=self.project_root, check=False)
            return result.returncode
        except KeyboardInterrupt:
            print("\n❌ Test execution interrupted by user")
            return 130
        except Exception as e:
            print(f"❌ Error running command: {e}")
            return 1
    
    def run_unit_tests(self, coverage: bool = True, verbose: bool = True) -> int:
        """Run unit tests."""
        command = ["python", "-m", "pytest", "tests/unit/"]
        
        if verbose:
            command.append("-v")
        
        if coverage:
            command.extend([
                "--cov=tests/utils",
                "--cov-report=term-missing",
                "--cov-report=html:tests/reports/unit_coverage"
            ])
        
        command.extend([
            "--html=tests/reports/unit_test_report.html",
            "--self-contained-html"
        ])
        
        return self.run_command(command, "Running Unit Tests")
    
    def run_integration_tests(self, coverage: bool = True, verbose: bool = True) -> int:
        """Run integration tests."""
        command = ["python", "-m", "pytest", "tests/integration/"]
        
        if verbose:
            command.append("-v")
        
        if coverage:
            command.extend([
                "--cov=Backend/servidor",
                "--cov-report=term-missing",
                "--cov-report=html:tests/reports/integration_coverage"
            ])
        
        command.extend([
            "--html=tests/reports/integration_test_report.html",
            "--self-contained-html"
        ])
        
        return self.run_command(command, "Running Integration Tests")
    
    def run_e2e_tests(self, browser: str = "chrome", headless: bool = False, 
                      base_url: str = None, verbose: bool = True) -> int:
        """Run E2E tests."""
        command = ["python", "-m", "pytest", "tests/e2e/", "tests/selenium/"]
        
        if verbose:
            command.append("-v")
        
        command.extend([f"--browser={browser}"])
        
        if headless:
            command.append("--headless")
        
        if base_url:
            command.extend([f"--base-url={base_url}"])
        
        command.extend([
            "--html=tests/reports/e2e_test_report.html",
            "--self-contained-html",
            "-m", "e2e"
        ])
        
        return self.run_command(command, f"Running E2E Tests (Browser: {browser})")
    
    def run_smoke_tests(self, browser: str = "chrome", headless: bool = True) -> int:
        """Run smoke tests only."""
        command = [
            "python", "-m", "pytest",
            "tests/e2e/", "tests/selenium/",
            "-v",
            f"--browser={browser}",
            "--html=tests/reports/smoke_test_report.html",
            "--self-contained-html",
            "-m", "smoke"
        ]
        
        if headless:
            command.append("--headless")
        
        return self.run_command(command, f"Running Smoke Tests (Browser: {browser})")
    
    def run_all_tests(self, browser: str = "chrome", headless: bool = False, 
                      base_url: str = None, fast: bool = False) -> int:
        """Run all test suites."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        command = ["python", "-m", "pytest"]
        
        if fast:
            command.append("--fast")
        
        command.extend([
            "-v",
            "--tb=short",
            f"--browser={browser}",
            "--cov=Backend/servidor",
            "--cov=Frontend/front-cinetrack/src", 
            "--cov=tests",
            "--cov-report=html:tests/reports/full_coverage",
            "--cov-report=xml:tests/reports/coverage.xml",
            "--cov-report=term-missing",
            f"--html=tests/reports/full_test_report_{timestamp}.html",
            "--self-contained-html"
        ])
        
        if headless:
            command.append("--headless")
        
        if base_url:
            command.extend([f"--base-url={base_url}"])
        
        return self.run_command(command, "Running All Tests with Full Coverage")
    
    def run_parallel_tests(self, workers: int = 4, browser: str = "chrome") -> int:
        """Run tests in parallel."""
        command = [
            "python", "-m", "pytest",
            "-v",
            "-n", str(workers),
            f"--browser={browser}",
            "--html=tests/reports/parallel_test_report.html",
            "--self-contained-html",
            "--tb=short"
        ]
        
        return self.run_command(command, f"Running Tests in Parallel ({workers} workers)")
    
    def install_dependencies(self) -> int:
        """Install test dependencies."""
        command = ["python", "-m", "pip", "install", "-r", "tests/requirements.txt"]
        return self.run_command(command, "Installing Test Dependencies")
    
    def setup_test_environment(self) -> int:
        """Set up the complete test environment."""
        print("🔧 Setting up test environment...")
        
        # Install dependencies
        if self.install_dependencies() != 0:
            return 1
        
        # Create necessary directories
        directories = [
            self.reports_dir / "screenshots",
            self.reports_dir / "coverage_html",
            self.reports_dir / "logs"
        ]
        
        for directory in directories:
            directory.mkdir(exist_ok=True, parents=True)
            print(f"✅ Created directory: {directory}")
        
        print("✅ Test environment setup complete!")
        return 0
    
    def generate_coverage_report(self) -> int:
        """Generate coverage report from existing data."""
        command = [
            "python", "-m", "coverage", "html",
            "-d", "tests/reports/coverage_html"
        ]
        
        return self.run_command(command, "Generating Coverage Report")
    
    def clean_reports(self) -> int:
        """Clean up old test reports."""
        import shutil
        
        if self.reports_dir.exists():
            for item in self.reports_dir.iterdir():
                if item.is_file() and item.suffix in ['.html', '.xml', '.json', '.log']:
                    item.unlink()
                elif item.is_dir() and item.name.endswith('_coverage'):
                    shutil.rmtree(item)
            
            print("✅ Test reports cleaned")
        
        return 0


def main():
    """Main entry point for the test runner."""
    parser = argparse.ArgumentParser(
        description="Professional test runner for SocialGraphActivityFeed",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_tests.py --unit                    # Run unit tests only
  python run_tests.py --e2e --browser firefox   # Run E2E tests with Firefox
  python run_tests.py --all --headless         # Run all tests in headless mode
  python run_tests.py --smoke                   # Run smoke tests only
  python run_tests.py --setup                  # Setup test environment
  python run_tests.py --parallel --workers 8   # Run tests in parallel
        """
    )
    
    # Test type selection
    test_group = parser.add_mutually_exclusive_group(required=True)
    test_group.add_argument("--unit", action="store_true", help="Run unit tests")
    test_group.add_argument("--integration", action="store_true", help="Run integration tests")
    test_group.add_argument("--e2e", action="store_true", help="Run E2E tests")
    test_group.add_argument("--smoke", action="store_true", help="Run smoke tests")
    test_group.add_argument("--all", action="store_true", help="Run all tests")
    test_group.add_argument("--parallel", action="store_true", help="Run tests in parallel")
    test_group.add_argument("--setup", action="store_true", help="Setup test environment")
    test_group.add_argument("--clean", action="store_true", help="Clean test reports")
    test_group.add_argument("--coverage-report", action="store_true", help="Generate coverage report")
    
    # Browser options
    parser.add_argument("--browser", choices=["chrome", "firefox"], default="chrome",
                       help="Browser for E2E tests (default: chrome)")
    parser.add_argument("--headless", action="store_true", 
                       help="Run browser in headless mode")
    
    # Test configuration
    parser.add_argument("--base-url", help="Base URL for E2E tests")
    parser.add_argument("--no-coverage", action="store_true", help="Disable coverage reporting")
    parser.add_argument("--fast", action="store_true", help="Skip slow tests")
    parser.add_argument("--workers", type=int, default=4, help="Number of parallel workers")
    parser.add_argument("--quiet", action="store_true", help="Reduce output verbosity")
    
    args = parser.parse_args()
    
    runner = TestRunner()
    verbose = not args.quiet
    coverage = not args.no_coverage
    
    # Execute based on arguments
    if args.setup:
        return runner.setup_test_environment()
    elif args.clean:
        return runner.clean_reports()
    elif args.coverage_report:
        return runner.generate_coverage_report()
    elif args.unit:
        return runner.run_unit_tests(coverage=coverage, verbose=verbose)
    elif args.integration:
        return runner.run_integration_tests(coverage=coverage, verbose=verbose)
    elif args.e2e:
        return runner.run_e2e_tests(
            browser=args.browser, 
            headless=args.headless,
            base_url=args.base_url,
            verbose=verbose
        )
    elif args.smoke:
        return runner.run_smoke_tests(browser=args.browser, headless=args.headless)
    elif args.parallel:
        return runner.run_parallel_tests(workers=args.workers, browser=args.browser)
    elif args.all:
        return runner.run_all_tests(
            browser=args.browser,
            headless=args.headless,
            base_url=args.base_url,
            fast=args.fast
        )
    
    return 0


if __name__ == "__main__":
    sys.exit(main())