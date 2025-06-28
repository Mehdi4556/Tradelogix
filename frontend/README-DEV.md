# Development Environment Guide

## Current Setup:
- **Production**: Uses `https://tradelogix-backend.vercel.app` (default)
- **Local Development**: Use local backend when needed

## How to Switch:

### 🌐 Use Production Backend (Default)
```bash
# Your .env file is already set to production
npm run dev
```

### 🏠 Use Local Backend
```bash
# Create a local override (this file is gitignored):
echo VITE_API_URL=http://localhost:5000 > .env.local
npm run dev
```

### 🔄 Switch Back to Production
```bash
# Remove the local override:
del .env.local
npm run dev
```

## Vercel Environment Variables:
Make sure your Vercel project has:
```
VITE_API_URL=https://tradelogix-backend.vercel.app
```

## File Priority:
1. `.env.local` (highest - local development)
2. `.env` (production backend)
3. Fallback in `config/api.js` (production backend) 