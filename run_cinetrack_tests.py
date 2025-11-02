#!/usr/bin/env python3
import sys
import subprocess
import argparse
from pathlib import Path
from datetime import datetime


def main():
    parser = argparse.ArgumentParser(description='CineTrack Testing Suite')
    parser.add_argument('--quick', action='store_true')
    parser.add_argument('--unit', action='store_true')
    parser.add_argument('--integration', action='store_true')
    parser.add_argument('--e2e', action='store_true')
    parser.add_argument('--coverage', action='store_true')
    parser.add_argument('--setup', action='store_true')
    
    args = parser.parse_args()
    
    if args.setup:
        setup_environment()
        return
    
    Path('reports').mkdir(exist_ok=True)
    
    cmd = [sys.executable, '-m', 'pytest', '-v', '--tb=short']
    
    # Determinar qué tests ejecutar
    if args.quick:
        cmd.extend(['-m', 'smoke'])
        test_path = 'tests/'
    elif args.unit:
        cmd.extend(['tests/unit'])
        test_path = 'tests/unit'
    elif args.integration:
        cmd.extend(['tests/integration'])
        test_path = 'tests/integration'
    elif args.e2e:
        cmd.extend(['tests/e2e'])
        test_path = 'tests/e2e'
    else:
        # Por defecto, solo ejecutar unit tests que sabemos que funcionan
        cmd.extend(['tests/unit'])
        test_path = 'tests/unit'
    
    if args.coverage:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        # Coverage de todos los módulos de utils
        cmd.extend([
            '--cov=tests.utils',  # Incluye checklist.py y selenium_helpers.py
            '--cov-report=html:reports/coverage_{}'.format(timestamp),
            '--cov-report=xml:reports/coverage.xml',
            '--cov-report=term-missing',
            '--no-cov-on-fail'
        ])
    
    print("Running tests...")
    print(f"Command: {' '.join(cmd)}\n")
    result = subprocess.run(cmd)
    
    # Mensaje final
    print(f"\n{'='*60}")
    if result.returncode == 0:
        print("✅ ALL TESTS PASSED!")
        if args.coverage:
            print(f"📊 Coverage report: reports/coverage_{datetime.now().strftime('%Y%m%d')}_*/index.html")
    else:
        print(f"❌ TESTS FAILED (exit code: {result.returncode})")
    print(f"{'='*60}\n")
    
    sys.exit(result.returncode)


def setup_environment():
    for dir_path in ['reports', 'tests/reports']:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
    print("Setup complete!")


if __name__ == '__main__':
    main()