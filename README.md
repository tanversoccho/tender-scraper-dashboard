# Project Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 14+** - [Download Node.js](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** (optional, for cloning the repository)

## 🏗️ Project Structure

project/
├── backend/          # Flask backend server
│   ├── scrapers/     # Web scraping modules
│   ├── services/     # Backend services
│   └── routes/       # API routes
├── src/              # React frontend
│   ├── components/   # React components
│   ├── pages/        # Page components
│   └── services/     # Frontend API services
├── public/           # Static assets
└── doc/              # Documentation files

## 🚀 Installation & Setup

### 1️⃣ Clone or Download the Project

```bash
# If using git
git clone https://github.com/tanversoccho/tender-scraper-dashboard.git
```

### 2️⃣ Backend Setup (Python/Flask)

#### Windows Users:
Run the automated setup script:
```bash
setup_backend.bat
```

#### macOS/Linux Users:
```bash
chmod +x setup.sh
./setup.sh
```

#### Manual Backend Setup:

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Install additional required packages (if not in requirements.txt)
pip install flask flask-cors pandas openpyxl requests beautifulsoup4 selenium stem

# Run the backend server
python run.py
```

The backend server will start at: `http://localhost:5000`

### 3️⃣ Frontend Setup (React)

Open a **new terminal** for the frontend setup:

```bash
# Install Node.js dependencies
npm install

# Or if using yarn
yarn install

# Start the development server
npm start

# Or with yarn
yarn start
```

The frontend application will open at: `http://localhost:3000`

## 🔧 Configuration

### Backend Configuration (`backend/config.py`)

Create or modify `config.py` to configure:

```python
class Config:
    # Flask settings
    SECRET_KEY = 'your-secret-key-here'
    DEBUG = True
    
    # Tor settings (if using Tor for scraping)
    TOR_HOST = '127.0.0.1'
    TOR_PORT = 9050
    TOR_CONTROL_PORT = 9051
    TOR_PASSWORD = 'your-tor-password'
    
    # Scraping settings
    REQUEST_TIMEOUT = 30
    MAX_RETRIES = 3
    RETRY_DELAY = 1
    
    # Export settings
    EXPORT_PATH = './exports'
```

## 📦 Dependencies

### Backend Dependencies (`requirements.txt`)
```
Flask==2.3.3
flask-cors==4.0.0
pandas==2.0.3
openpyxl==3.1.2
requests==2.31.0
beautifulsoup4==4.12.2
selenium==4.12.0
stem==1.8.2
lxml==4.9.3
```

### Frontend Dependencies (`package.json`)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.4.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  }
}
```

## 🎯 Running the Application

### Development Mode

1. **Start Backend Server:**
   ```bash
   cd backend
   python run.py
   ```

2. **Start Frontend Server:**
   ```bash
   npm start
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Production Build

#### Build Frontend:
```bash
npm run build
```

#### Run Backend in Production:
```bash
cd backend
python app.py
```

## 📊 Features

The application provides tender and job scraping from multiple sources:

- **ADB** (Asian Development Bank)
- **BD Jobs** (Bangladesh job portal)
- **BPPA** (Bangladesh Public Procurement Authority)
- **Care International**
- **PKSF** (Palli Karma-Sahayak Foundation)
- **UNDP** (United Nations Development Programme)
- **World Bank**

## 🔍 Troubleshooting

### Common Issues & Solutions

#### 1. **Backend won't start - Port 5000 in use**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

#### 2. **Python package installation fails**
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install with --user flag
pip install --user -r requirements.txt
```

#### 3. **Frontend build errors**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

#### 4. **Tor connection issues**
- Ensure Tor service is running
- Check Tor configuration in `config.py`
- Verify Tor is listening on the correct port

## 📝 Usage Guide

### Scraping Tenders
1. Navigate to different tabs (ADB, World Bank, etc.)
2. Click "Fetch Data" to scrape latest tenders
3. View results in the table/grid format

### Exporting Data
1. Go to "Data Export" page
2. Select the data source
3. Choose export format (Excel/CSV)
4. Click "Export" to download

### Memory Management
- The application includes memory tracking
- Use "Clear Cache" button to free up memory
- Monitor memory usage in the stats grid

## 🛠️ Development

### Adding a New Scraper
1. Create new scraper file in `backend/scrapers/`
2. Implement scraping logic
3. Add route in `backend/routes/tor_routes.py`
4. Create frontend component in `src/components/`

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/adb/tenders` | GET | Fetch ADB tenders |
| `/api/worldbank/tenders` | GET | Fetch World Bank tenders |
| `/api/bdjobs/jobs` | GET | Fetch BD Jobs |
| `/api/export` | POST | Export data to Excel |
| `/api/memory/stats` | GET | Get memory usage stats |

## 📁 Important Files

- `backend/run.py` - Backend entry point
- `backend/app.py` - Flask application configuration
- `src/App.jsx` - Main React component
- `src/services/api.js` - API service layer
- `run.bat` - Quick start script for Windows

## 🔐 Security Notes

- Change default secret keys before production
- Use environment variables for sensitive data
- Consider rate limiting for scraping endpoints
- Implement authentication if deploying publicly

