# VenXtra - Vendor Document Comparison System

A comprehensive document analysis and vendor comparison platform built with FastAPI and React. VenXtra helps businesses efficiently compare vendor proposals, contracts, and documents through AI-powered analysis and structured data extraction.

## 🚀 Features

### Core Features
- **Multi-Vendor Document Management**: Upload and organize documents by vendor and project
- **AI-Powered Text Extraction**: Automatic text extraction from PDFs, Word documents, and Excel files
- **Structured Data Analysis**: AI extracts key information like pricing, terms, and vendor details
- **Duplicate Detection**: SHA-256 based file hashing prevents duplicate uploads per vendor
- **Cross-Vendor Document Sharing**: Same document can exist across different vendors
- **Real-Time Processing**: Live status updates with automatic polling
- **Document Preview**: View extracted content with search functionality
- **Original Document Download**: Access to original uploaded files

### Security Features
- **JWT Authentication**: Secure user authentication with refresh tokens
- **File Security Scanning**: Malware detection and content validation
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive file type and size validation
- **User Isolation**: Project-based access control

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                     │
├─────────────────────────────────────────────────────────────┤
│  • React Router • Tailwind CSS • React Query • Zustand     │
│  • File Upload • Document Preview • Comparison Dashboard    │
└─────────────────────────────────────────────────────────────┘
                                  │
                                  │ HTTP/REST API
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                      │
├─────────────────────────────────────────────────────────────┤
│  • FastAPI • Beanie ODM • JWT Auth • Background Tasks      │
│  • File Processing • AI Integration • Security Scanning    │
└─────────────────────────────────────────────────────────────┘
                                  │
                   ┌──────────────┼──────────────┐
                   ▼              ▼              ▼
              ┌─────────┐    ┌──────────┐   ┌─────────┐
              │ MongoDB │    │ Groq AI  │   │ File    │
              │ Database│    │ Service  │   │ Storage │
              └─────────┘    └──────────┘   └─────────┘
```

## 📋 System Flow

### 1. User Authentication Flow
```
User Registration/Login → JWT Token Generation → Token Validation → Access Control
```

### 2. Document Processing Flow
```
File Upload → Security Scan → Text Extraction → Duplicate Check → 
Storage → Background AI Processing → Status Updates → Structured Data Extraction
```

### 3. Document Analysis Flow
```
Raw Text → AI Analysis (Groq) → Structured Data Extraction → 
Database Storage → Real-time Status Updates → User Notification
```

### 4. Comparison Flow
```
Multi-Vendor Selection → Document Aggregation → Data Normalization → 
Comparison Matrix → Visual Dashboard → Export Options
```

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI 0.104+
- **Database**: MongoDB with Beanie ODM
- **Authentication**: JWT with refresh tokens
- **AI Integration**: Groq API for document analysis
- **File Processing**: PyPDF2, python-docx, openpyxl
- **Security**: Custom file scanning, rate limiting
- **Background Tasks**: FastAPI BackgroundTasks
- **Validation**: Pydantic models

### Frontend
- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand + React Query
- **Routing**: React Router v6
- **UI Components**: Custom components with Headless UI
- **Icons**: Lucide React
- **File Upload**: React Dropzone
- **Animations**: Framer Motion

## 📁 Project Structure

```
venxtra/
├── venxtra-backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── routers/                # API route handlers
│   │   │   ├── auth.py            # Authentication endpoints
│   │   │   ├── documents.py       # Document management
│   │   │   ├── vendors.py         # Vendor management
│   │   │   ├── projects.py        # Project management
│   │   │   └── comparison.py      # Document comparison
│   │   ├── models.py              # Database models
│   │   ├── auth.py                # Authentication logic
│   │   ├── database.py            # Database connection
│   │   ├── groq_client.py         # AI integration
│   │   ├── parsers.py             # File processing
│   │   ├── file_security.py       # Security scanning
│   │   └── main.py               # FastAPI application
│   ├── requirements.txt           # Python dependencies
│   └── start.py                   # Application starter
│
├── venxtra-frontend/               # React Frontend
│   ├── src/
│   │   ├── components/            # Reusable components
│   │   │   ├── ui/               # UI components
│   │   │   ├── FileUpload.jsx    # File upload component
│   │   │   └── VendorDataTable.jsx
│   │   ├── pages/                # Page components
│   │   │   ├── Dashboard.jsx     # Main dashboard
│   │   │   ├── VendorDetails.jsx # Vendor management
│   │   │   └── ComparisonResults.jsx
│   │   ├── utils/                # Utilities
│   │   │   └── api.js            # API client
│   │   ├── store/                # State management
│   │   └── App.jsx               # Main app component
│   ├── package.json              # Node dependencies
│   └── vite.config.js            # Vite configuration
│
├── README.md                      # This file
├── start-backend.sh              # Backend start script
└── start-frontend.sh             # Frontend start script
```

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (local or Atlas)
- Groq API key

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd venxtra-backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   MONGODB_URL=mongodb://localhost:27017/venxtra
   GROQ_API_KEY=your_groq_api_key_here
   SECRET_KEY=your_secret_key_here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

5. **Start the backend server**
   ```bash
   python start.py
   ```
   
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd venxtra-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:3000`

## API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

## Usage Guide

### 1. Authentication
- Register a new account or login with existing credentials
- JWT tokens are used for authentication

### 2. Project Management
- Create new projects from the dashboard
- Each project can contain multiple vendors

### 3. Vendor Management
- Add vendors to projects
- Upload 3-5 documents per vendor (PDF, DOCX, XLSX)

### 4. Document Processing
- Documents are processed using Groq LLM in the background
- Extracted data includes:
  - Vendor information
  - Pricing details
  - Products/services
  - Delivery terms
  - Payment terms
  - Special clauses

### 5. Vendor Comparison
- Compare 2+ vendors within a project
- Visual comparison of pricing, terms, and conditions
- Automatic identification of lowest-price vendor

## DVNest Data Structure

The AI extraction follows this structured format:

```json
{
  "vendor_name": "Company Name",
  "document_type": "quote|invoice|proposal|contract",
  "pricing": [
    {
      "item": "Product/Service Name",
      "quantity": "10",
      "unit_price": "$100",
      "total_price": "$1000"
    }
  ],
  "products_or_services": ["Service 1", "Product 2"],
  "delivery_terms": "2-3 weeks",
  "payment_terms": "Net 30",
  "special_clauses": "Volume discounts available",
  "notes": "Additional information"
}
```

## Development

### Backend Development
- FastAPI with automatic reload: `python start.py`
- API docs: `http://localhost:8000/docs`
- MongoDB collections: projects, vendors, documents, users

### Frontend Development
- React dev server: `npm run dev`
- Build for production: `npm run build`
- Preview production build: `npm run preview`

## Configuration

### Environment Variables

#### Backend (.env)
```env
MONGODB_URL=mongodb://localhost:27017/venxtra
GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Frontend (Vite proxy configuration)
The frontend is configured to proxy API requests to the backend during development.

## Deployment

### Backend Deployment
- Compatible with platforms like Railway, Render, Heroku
- Requires MongoDB Atlas or similar cloud database
- Set environment variables in deployment platform

### Frontend Deployment
- Build: `npm run build`
- Deploy `dist` folder to Vercel, Netlify, or similar
- Configure API base URL for production

## Troubleshooting

### Common Issues

1. **Import errors**: Ensure all dependencies are installed
2. **MongoDB connection**: Check MongoDB is running and connection string is correct
3. **Groq API errors**: Verify API key is valid and has sufficient credits
4. **File upload errors**: Check file size limits and supported formats

### Support
- Check API documentation at `/docs`
- Verify environment variables are set correctly
- Ensure MongoDB collections are properly indexed

## License

This project is for demonstration purposes. Please ensure compliance with all API terms of service and data privacy regulations when using in production.