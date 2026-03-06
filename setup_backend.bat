@echo off
echo Setting up Python backend for Tender Scraper Dashboard...
echo.

cd backend

echo Creating virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo Failed to create virtual environment. Make sure Python is installed.
    pause
    exit /b %errorlevel%
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Upgrading pip...
python -m pip install --upgrade pip

echo Installing requirements...
if exist requirements.txt (
    pip install -r requirements.txt
) else (
    echo requirements.txt not found. Installing common packages...
    pip install flask flask-cors pandas numpy openpyxl requests beautifulsoup4 selenium cloudscraper
)

echo.
echo Creating requirements.txt...
pip freeze > requirements.txt

echo.
echo Backend setup complete!
echo.
echo To start the backend:
echo   cd backend
echo   venv\Scripts\activate
echo   python app.py
echo.
echo Or from project root:
echo   npm run start:backend
echo.
pause
