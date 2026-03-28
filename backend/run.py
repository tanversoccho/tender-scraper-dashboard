#!/usr/bin/env python

import os
import subprocess
import sys
import importlib.util

# Fix Windows console encoding issues
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')


def is_requirements_installed():
    """Check if key packages from requirements.txt are installed"""
    key_packages = ['flask', 'requests', 'bs4']

    for package in key_packages:
        if importlib.util.find_spec(package) is None:
            return False
    return True


def main():
    # Use ASCII or safe characters for Windows console
    if sys.platform == 'win32':
        print("=" * 60)
        print(">> Tender Scraper Dashboard - Backend Server <<")
        print("=" * 60)
    else:
        print("=" * 60)
        print("📊 Tender Scraper Dashboard - Backend Server")
        print("=" * 60)

    # Check if virtual environment exists
    if not os.path.exists('venv'):
        print("[1/3] Creating virtual environment...")
        subprocess.run([sys.executable, '-m', 'venv', 'venv'])
        need_install = True
    else:
        need_install = not is_requirements_installed()

    # Set paths based on OS
    if sys.platform == 'win32':
        pip_path = os.path.join('venv', 'Scripts', 'pip')
        python_path = os.path.join('venv', 'Scripts', 'python')
    else:
        pip_path = os.path.join('venv', 'bin', 'pip')
        python_path = os.path.join('venv', 'bin', 'python')

    if need_install:
        print("[2/3] Installing requirements...")
        subprocess.run([pip_path, 'install', '-r', 'requirements.txt'])
    else:
        print("[2/3] Requirements already installed, skipping...")

    print("[3/3] Starting Flask server...")
    print("API available at: http://localhost:5000")
    print("=" * 60)

    # Run the app
    os.environ['FLASK_APP'] = 'app.py'
    os.environ['FLASK_ENV'] = 'development'

    # Set PYTHONIOENCODING for better Unicode support
    os.environ['PYTHONIOENCODING'] = 'utf-8'

    subprocess.run([python_path, 'app.py'])


if __name__ == '__main__':
    main()
