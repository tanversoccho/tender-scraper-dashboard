#!/bin/bash

echo "Setting up Python backend for Tender Scraper Dashboard..."
echo ""

cd backend

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "Found: $(python3 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "Failed to create virtual environment."
        exit 1
    fi
else
    echo "Virtual environment already exists."
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
if [ -f "requirements.txt" ]; then
    echo "Installing requirements from requirements.txt..."
    pip install -r requirements.txt
else
    echo "requirements.txt not found. Installing common packages..."
    pip install flask flask-cors pandas numpy openpyxl requests beautifulsoup4 selenium cloudscraper python-dateutil urllib3 werkzeug
    
    # Create requirements.txt
    echo "Creating requirements.txt..."
    pip freeze > requirements.txt
fi

echo ""
echo "Current installed packages:"
pip list

echo ""
echo "Backend setup complete!"
echo ""
echo "To start the backend:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python app.py"
echo ""
echo "Or from project root:"
echo "  npm run start:backend"

cd ..
