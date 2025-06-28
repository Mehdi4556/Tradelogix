# Development Environment Guide

## Current Setup:
- **Local Development**: Uses `http://localhost:5000/api` (default)
- **Backend**: Run locally on port 5000

## How to Run:

### 🏠 Local Development Setup
```bash
# Terminal 1: Start the backend
cd backend
npm install
npm run dev

# Terminal 2: Start the frontend
cd frontend
npm install
npm run dev
```

### 🔧 Environment Configuration
The API URL is configured in `src/config/api.js`:
- Default: `http://localhost:5000/api`
- Can be overridden with `VITE_API_URL` environment variable

### 📝 Optional: Create .env.local for custom API URL
```bash
# Create a local environment file (this file is gitignored):
echo VITE_API_URL=http://localhost:5000/api > .env.local
```

## File Priority:
1. `.env.local` (highest - custom override)
2. Fallback in `config/api.js` (localhost:5000) 