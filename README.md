# 📈 TradeLogix - Trading Journal Monorepo

A full-stack trading journal application built with React, Node.js, and MongoDB. Track your trades, analyze performance, and improve your trading strategy with beautiful visualizations.

## 🏗️ Monorepo Structure

```
tradelogix/
├── frontend/          # React + Vite + Tailwind + shadcn/ui
├── backend/           # Node.js + Express + MongoDB
├── package.json       # Root workspace configuration
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+
- MongoDB (local or Atlas)

### Installation & Setup

1. **Clone and install:**
   ```bash
   git clone <your-repo-url>
   cd tradelogix
   npm install
   ```

2. **Backend configuration:**
   ```bash
   cp backend/config.example.js backend/config.js
   # Add your MongoDB connection string
   ```

3. **Start both servers:**
   ```bash
   npm run dev
   ```

This will start:
- **Frontend:** http://localhost:5173 (or 5174 if 5173 is busy)
- **Backend:** http://localhost:5000
- **API:** http://localhost:5000/api

## 📋 Available Commands

### Root Level Commands
```bash
# Start both frontend and backend
npm run dev

# Start frontend only
npm run dev:frontend

# Start backend only  
npm run dev:backend

# Build for production
npm run build

# Start production server
npm run start

# Install all dependencies
npm install
```

### Workspace Commands
```bash
# Install frontend dependencies
npm install --workspace=frontend

# Install backend dependencies
npm install --workspace=backend

# Run frontend-specific scripts
npm run build --workspace=frontend

# Run backend-specific scripts
npm run test --workspace=backend
```

## 🎨 Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File uploads
- **CORS** - Cross-origin resource sharing

## 🔧 Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd backend
npm run dev
```

### Database Setup
1. **Local MongoDB:**
   - Install MongoDB locally
   - Connection string: `mongodb://localhost:27017/tradelogix`

2. **MongoDB Atlas:**
   - Create a cluster on MongoDB Atlas
   - Add connection string to `backend/config.js`

## 🌟 Features

### ✅ Completed
- **Authentication** - Login/Signup with JWT
- **Dark Theme** - Beautiful black theme with shadcn/ui
- **Responsive Design** - Mobile-first approach
- **Form Validation** - Zod schemas with real-time validation
- **Protected Routes** - Route-based authentication
- **Toast Notifications** - User feedback system

### 🚧 In Progress
- **Add Trade Form** - Trade entry with image upload
- **Calendar View** - Daily trade visualization
- **Gallery View** - Trade image gallery
- **Reports Dashboard** - Analytics and charts

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Trades
- `GET /api/trades` - Get user trades
- `POST /api/trades` - Create trade
- `PUT /api/trades/:id` - Update trade
- `DELETE /api/trades/:id` - Delete trade

### Reports
- `GET /api/reports/stats` - Get trading statistics
- `GET /api/reports/performance` - Get performance data

## 🎯 Project Status

**Phase 1: Authentication UI** ✅ Complete
- Login/Signup pages with validation
- Dark theme implementation
- Protected routing system

**Phase 2: Global Setup** ✅ Complete  
- Monorepo structure
- Development workflow
- Component library setup

**Phase 3: Trade Management** 🚧 Next
- Add trade form
- Image upload system
- Trade listing and editing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontend and backend
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

---

Built with ❤️ for better trading journal management. 