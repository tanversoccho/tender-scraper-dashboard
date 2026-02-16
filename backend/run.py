#!/usr/bin/env python
"""
Tender Scraper Backend Runner
Run this script to start the backend server
"""

import os
import sys
import subprocess
import webbrowser
from time import sleep

def main():
    print("=" * 60)
    print("📊 Tender Scraper Dashboard - Backend Server")
    print("=" * 60)

    # Check if virtual environment exists
    if not os.path.exists('venv'):
        print("📦 Creating virtual environment...")
        subprocess.run([sys.executable, '-m', 'venv', 'venv'])

    # Activate virtual environment and install requirements
    if sys.platform == 'win32':
        pip_path = os.path.join('venv', 'Scripts', 'pip')
        python_path = os.path.join('venv', 'Scripts', 'python')
    else:
        pip_path = os.path.join('venv', 'bin', 'pip')
        python_path = os.path.join('venv', 'bin', 'python')

    print("📦 Installing requirements...")
    subprocess.run([pip_path, 'install', '-r', 'requirements.txt'])

    print("🚀 Starting Flask server...")
    print("📱 API will be available at: http://localhost:5000")
    print("=" * 60)

    # Open browser after 2 seconds
    sleep(2)
    webbrowser.open('http://localhost:5000/api/health')

    # Run the app
    os.environ['FLASK_APP'] = 'app.py'
    os.environ['FLASK_ENV'] = 'development'
    subprocess.run([python_path, 'app.py'])

if __name__ == '__main__':
    main()
