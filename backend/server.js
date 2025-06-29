const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Validate critical environment variables
const validateEnvironmentVariables = () => {
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('💡 Please set these variables in your Vercel dashboard or .env file');
    
    // In production, we should still try to run but log the error
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️  Server starting anyway in production mode, but functionality may be limited');
    } else {
      console.error('🛑 Server cannot start without these variables in development mode');
      process.exit(1);
    }
  } else {
    console.log('✅ All required environment variables are set');
  }
};

// Validate environment variables
validateEnvironmentVariables();

// Import routes
const authRoutes = require('./routes/authRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const reportRoutes = require('./routes/reportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Import middleware
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// CORS configuration for Vercel deployment
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'https://tradelogix-frontend.vercel.app',
    'http://localhost:3000', // For local development
    'http://localhost:5173'  // For Vite dev server
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
};

app.use(cors(corsOptions));

// Handle CORS preflight requests
app.options('*', cors(corsOptions));

// Database connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradelogix';
mongoose.connect(mongoURI)
  .then(() => console.log('📊 Connected to MongoDB Atlas/Local'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 If using Atlas, make sure to:');
    console.log('   1. Set MONGODB_URI in .env file');
    console.log('   2. Whitelist your IP address in Atlas');
    console.log('   3. Check username/password are correct');
  });

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Sample hello route for testing
app.get('/api/hello', (req, res) => {
  res.status(200).json({
    message: "Hello from backend!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Trading Journal API is running! 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database connection test route
app.get('/api/db-test', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected', 
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.status(200).json({
      status: 'success',
      message: 'Database connection test',
      mongodb_uri: process.env.MONGODB_URI ? 'Set' : 'Not set',
      connection_state: states[dbState],
      connection_host: mongoose.connection.host || 'Not connected',
      connection_name: mongoose.connection.name || 'Not connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection test failed',
      error: error.message
    });
  }
});

// Environment variables check route
app.get('/api/env-check', (req, res) => {
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
  const optionalVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  
  const envStatus = {
    status: 'success',
    message: 'Environment variables check',
    timestamp: new Date().toISOString(),
    required: {},
    optional: {},
    summary: {
      required_missing: [],
      optional_missing: []
    }
  };

  // Check required variables
  requiredVars.forEach(varName => {
    const isSet = !!process.env[varName];
    envStatus.required[varName] = isSet ? 'Set' : 'Missing';
    if (!isSet) {
      envStatus.summary.required_missing.push(varName);
    }
  });

  // Check optional variables
  optionalVars.forEach(varName => {
    const isSet = !!process.env[varName];
    envStatus.optional[varName] = isSet ? 'Set' : 'Missing';
    if (!isSet) {
      envStatus.summary.optional_missing.push(varName);
    }
  });

  // Set status based on missing required variables
  if (envStatus.summary.required_missing.length > 0) {
    envStatus.status = 'error';
    envStatus.message = `Missing required environment variables: ${envStatus.summary.required_missing.join(', ')}`;
  }

  res.status(envStatus.summary.required_missing.length > 0 ? 500 : 200).json(envStatus);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Export the app for Vercel
module.exports = app;

// Only start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🔥 Server is running on port ${PORT}`);
    console.log(`🌐 API URL: http://localhost:${PORT}/api`);
    console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
  });
} 