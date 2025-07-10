const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const mongoConnection = require('./utils/mongoConnection');
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
const ensureDbConnection = require('./middlewares/ensureDbConnection');

const app = express();

// CORS configuration for Vercel deployment
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'https://tradelogix-frontend.vercel.app',
    'https://tradelogix-frontend-bm3qa7dkz-mehdi4556s-projects.vercel.app', // Preview URL
    /https:\/\/tradelogix-frontend.*\.vercel\.app$/, // Allow all Vercel preview URLs
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

// Initialize MongoDB connection with enhanced serverless support
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradelogix';
mongoConnection.setupEventHandlers();
mongoConnection.connect(mongoURI).catch(error => {
  console.error('❌ Failed to initialize MongoDB connection:', error);
});

// Handle app termination gracefully
process.on('SIGINT', async () => {
  console.log('📴 Received SIGINT, closing MongoDB connection...');
  try {
    await mongoConnection.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('📴 Received SIGTERM, closing MongoDB connection...');
  try {
    await mongoConnection.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown (SIGTERM):', error);
    process.exit(1);
  }
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

// Database connection test route with enhanced diagnostics
app.get('/api/db-test', async (req, res) => {
  try {
    const connectionHealth = await mongoConnection.checkConnection();
    
    res.status(connectionHealth.isConnected ? 200 : 500).json({
      status: connectionHealth.isConnected ? 'success' : 'error',
      message: 'Database connection test',
      mongodb_uri: process.env.MONGODB_URI ? 'Set' : 'Not set',
      connection_health: connectionHealth,
      timestamp: new Date().toISOString(),
      tips: connectionHealth.isConnected ? 
        ['Connection is healthy', 'Database is ready for operations'] :
        ['Check MongoDB Atlas connection', 'Verify IP whitelist (0.0.0.0/0)', 'Check connection string format']
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection test failed',
      error: error.message,
      timestamp: new Date().toISOString()
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

// Vercel deployment info route
app.get('/api/deployment-info', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Deployment information',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      VERCEL: process.env.VERCEL || 'false',
      VERCEL_ENV: process.env.VERCEL_ENV || 'not-vercel',
      VERCEL_REGION: process.env.VERCEL_REGION || 'unknown'
    },
    mongodb_config: {
      uri_set: !!process.env.MONGODB_URI,
      connection_state: mongoose.connection.readyState,
      connection_states: {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting', 
        3: 'disconnecting'
      }
    },
    tips: [
      'For Vercel + MongoDB Atlas, use IP whitelist 0.0.0.0/0',
      'Check connection string format: mongodb+srv://user:pass@cluster.net/dbname',
      'Ensure database user has read/write permissions',
      'Use connection pooling settings for serverless'
    ]
  });
});

// API Routes
// Routes with database connection check
app.use('/api/auth', ensureDbConnection, authRoutes);
app.use('/api/trades', ensureDbConnection, tradeRoutes);
app.use('/api/reports', ensureDbConnection, reportRoutes);
app.use('/api/upload', ensureDbConnection, uploadRoutes);

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