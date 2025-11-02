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
    
    if args.quick:
        cmd.extend(['-m', 'smoke'])
    elif args.unit:
        cmd.extend(['-m', 'unit'])
    elif args.integration:
        cmd.extend(['-m', 'integration'])
    elif args.e2e:
        cmd.extend(['-m', 'e2e'])
    
    if args.coverage:
        cmd.extend(['--cov=.', '--cov-report=html', '--cov-report=term'])
    
    print("Running tests...")
    result = subprocess.run(cmd)
    sys.exit(result.returncode)


def setup_environment():
    for dir_path in ['reports', 'tests/reports']:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
    print("Setup complete!")


if __name__ == '__main__':
    main()