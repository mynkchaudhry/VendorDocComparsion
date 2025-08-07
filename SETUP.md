# VenXtra Setup Guide

## 🚀 Quick Start

Your VenXtra AI-powered vendor comparison dashboard is ready to run! Follow these steps:

### Prerequisites Installed ✅
- Python 3.8+ with virtual environment
- Node.js 16+ with npm
- All dependencies installed

### Configuration ✅
Your `.env` file is already configured with:
- MongoDB Atlas connection to `venextra` database
- Groq API key for LLaMA 3 processing
- All required secrets and settings

## Starting the Application

### Option 1: Use the Start Scripts
```bash
# Terminal 1 - Start Backend
./start-backend.sh

# Terminal 2 - Start Frontend  
./start-frontend.sh
```

### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd venxtra-backend
source venv/bin/activate
python start.py

# Terminal 2 - Frontend
cd venxtra-frontend
npm run dev
```

## Access URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## First Steps

1. **Register** a new account at http://localhost:3000/register
2. **Create your first project** from the dashboard
3. **Add vendors** to your project
4. **Upload documents** (PDF, DOCX, XLSX) for each vendor
5. **Compare vendors** once documents are processed

## Features Ready to Use

### ✅ Authentication System
- User registration and login
- JWT token-based security
- Protected routes

### ✅ Project Management
- Create unlimited projects
- Organize vendors by project
- Clean dashboard interface

### ✅ Document Processing
- Upload PDF, DOCX, XLSX files
- AI-powered text extraction
- Background processing with status updates

### ✅ Groq LLM Integration
- Uses LLaMA 3.3-70B model
- Extracts structured vendor data
- DVNest format compliance

### ✅ Vendor Comparison
- Side-by-side vendor analysis
- Pricing comparison with lowest price detection
- Terms and conditions breakdown
- Interactive comparison tables

### ✅ Modern UI/UX
- Responsive design (mobile + desktop)
- Tailwind CSS styling
- Real-time processing indicators
- Drag-and-drop file uploads

## Architecture Overview

```
VenXtra/
├── venxtra-backend/          # FastAPI backend
│   ├── app/
│   │   ├── models.py         # MongoDB models
│   │   ├── routers/          # API endpoints
│   │   ├── parsers.py        # Document parsing
│   │   ├── groq_client.py    # AI integration
│   │   └── main.py           # FastAPI app
│   ├── venv/                 # Virtual environment
│   └── .env                  # Configuration
└── venxtra-frontend/         # React frontend
    ├── src/
    │   ├── pages/            # Main pages
    │   ├── components/       # Reusable components
    │   └── utils/            # API client
    └── package.json          # Dependencies
```

## Data Flow

1. **Upload** → Documents saved and parsed (PDF, DOCX, XLSX)
2. **Process** → Raw text sent to Groq LLM for analysis
3. **Extract** → Structured data in DVNest format
4. **Store** → MongoDB with both raw and structured data
5. **Compare** → Interactive comparison interface

## Troubleshooting

### Backend Issues
- Ensure virtual environment is activated
- Check MongoDB connection in logs
- Verify Groq API key is valid

### Frontend Issues
- Clear browser cache
- Check console for errors
- Ensure backend is running on port 8000

### File Upload Issues
- Max file size: 50MB
- Supported formats: PDF, DOCX, DOC, XLSX, XLS
- Check processing status in vendor details

## Production Deployment

### Backend
- Use a production WSGI server
- Set up MongoDB Atlas or managed database
- Configure environment variables
- Enable CORS for your frontend domain

### Frontend
- Build: `npm run build`
- Deploy `dist` folder to CDN/static hosting
- Update API base URL for production

Your VenXtra dashboard is fully functional and ready for vendor document analysis! 🎉