const mongoConnection = require('../utils/mongoConnection');

// Middleware to ensure database connection is ready
const ensureDbConnection = async (req, res, next) => {
  try {
    const connectionHealth = await mongoConnection.checkConnection();
    
    if (!connectionHealth.isConnected) {
      // Try to reconnect
      console.log('⚠️  Database not connected, attempting to reconnect...');
      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradelogix';
      await mongoConnection.connect(mongoURI);
      
      // Check again after reconnection attempt
      const newConnectionHealth = await mongoConnection.checkConnection();
      
      if (!newConnectionHealth.isConnected) {
        return res.status(503).json({
          status: 'error',
          message: 'Database connection unavailable',
          error: 'Unable to establish connection to MongoDB',
          timestamp: new Date().toISOString(),
          tips: [
            'Check MongoDB Atlas connection',
            'Verify IP whitelist (0.0.0.0/0)',
            'Check connection string format',
            'Try again in a few seconds'
          ]
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Database connection check failed:', error);
    return res.status(503).json({
      status: 'error',
      message: 'Database connection check failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      tips: [
        'MongoDB connection issue detected',
        'Check server logs for details',
        'Try again in a few seconds'
      ]
    });
  }
};

module.exports = ensureDbConnection; 