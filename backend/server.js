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

// Configure mongoose for serverless environments
if (process.env.NODE_ENV === 'production') {
  mongoose.set('bufferCommands', false);
  mongoose.set('bufferMaxEntries', 0);
}

// Connect to MongoDB with better error handling
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log('🔄 Connecting to MongoDB...');
      await mongoose.connect(mongoURI, {
        // Optimized settings for serverless
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0
      });
      console.log('📊 Connected to MongoDB Atlas/Local');
    } else if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
    } else {
      console.log('⚠️  MongoDB connection state:', mongoose.connection.readyState);
    }
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 Troubleshooting steps:');
    console.log('   1. Check MONGODB_URI environment variable');
    console.log('   2. Verify MongoDB Atlas IP whitelist (use 0.0.0.0/0 for Vercel)');
    console.log('   3. Check username/password in connection string');
    console.log('   4. Ensure database name is correct');
    
    // Don't exit in production, let it retry
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Initialize database connection
connectDB();

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('📊 MongoDB connection closed through app termination');
  process.exit(0);
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Database connection check middleware
app.use(async (req, res, next) => {
  // Skip connection check for static routes and health checks
  if (req.path === '/api/health' || req.path === '/api/hello' || req.path === '/api/env-check') {
    return next();
  }
  
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('🔄 Database not connected, attempting to reconnect...');
      await connectDB();
    }
    
    // Verify connection with a simple ping
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
    }
    
    next();
  } catch (error) {
    console.error('❌ Database connection check failed:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Database connection unavailable. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

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
    
    let pingResult = null;
    let reconnectAttempt = false;
    
    // If not connected, try to connect
    if (dbState !== 1) {
      console.log('🔄 Attempting to connect for db-test...');
      reconnectAttempt = true;
      await connectDB();
    }
    
    // Try to ping the database
    if (mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.db.admin().ping();
        pingResult = 'success';
      } catch (pingError) {
        pingResult = `failed: ${pingError.message}`;
      }
    }
    
    const currentState = mongoose.connection.readyState;
    
    res.status(currentState === 1 ? 200 : 500).json({
      status: currentState === 1 ? 'success' : 'error',
      message: 'Database connection test',
      mongodb_uri: process.env.MONGODB_URI ? 'Set' : 'Not set',
      initial_connection_state: states[dbState],
      current_connection_state: states[currentState],
      connection_host: mongoose.connection.host || 'Not connected',
      connection_name: mongoose.connection.name || 'Not connected',
      ping_result: pingResult,
      reconnect_attempted: reconnectAttempt,
      timestamp: new Date().toISOString()
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