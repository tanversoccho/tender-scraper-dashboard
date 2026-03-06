# setup_backend.ps1
Write-Host "Setting up Python backend for Tender Scraper Dashboard..." -ForegroundColor Green
Write-Host ""

Set-Location -Path "backend"

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found: $pythonVersion" -ForegroundColor Cyan
} catch {
    Write-Host "Python is not installed or not in PATH. Please install Python 3.8 or higher." -ForegroundColor Red
    exit 1
}

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to create virtual environment." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Virtual environment already exists." -ForegroundColor Cyan
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install requirements
if (Test-Path "requirements.txt") {
    Write-Host "Installing requirements from requirements.txt..." -ForegroundColor Yellow
    pip install -r requirements.txt
} else {
    Write-Host "requirements.txt not found. Installing common packages..." -ForegroundColor Yellow
    $packages = @(
        "flask",
        "flask-cors",
        "pandas",
        "numpy",
        "openpyxl",
        "requests",
        "beautifulsoup4",
        "selenium",
        "cloudscraper",
        "python-dateutil",
        "urllib3",
        "werkzeug"
    )
    pip install $packages
    
    # Create requirements.txt
    Write-Host "Creating requirements.txt..." -ForegroundColor Yellow
    pip freeze > requirements.txt
}

Write-Host ""
Write-Host "Current installed packages:" -ForegroundColor Cyan
pip list

Write-Host ""
Write-Host "Backend setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the backend:" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  .\venv\Scripts\Activate" -ForegroundColor White
Write-Host "  python app.py" -ForegroundColor White
Write-Host ""
Write-Host "Or from project root:" -ForegroundColor Yellow
Write-Host "  npm run start:backend" -ForegroundColor White

Set-Location -Path ".."
