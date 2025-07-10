const mongoose = require('mongoose');

// MongoDB connection utility for serverless environments
class MongoConnection {
  constructor() {
    this.isConnected = false;
    this.connectionPromise = null;
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  // Get optimized connection options for serverless
  getConnectionOptions() {
    return {
      // Connection timeouts - optimized for serverless cold starts
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      
      // Connection pool settings for serverless
      maxPoolSize: 3,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      
      // Retry and reliability settings
      retryWrites: true,
      w: 'majority'
    };
  }

  // Connect with retry logic
  async connect(uri, options = {}) {
    if (this.isConnected) {
      return mongoose.connection;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    const connectionOptions = { ...this.getConnectionOptions(), ...options };
    
    this.connectionPromise = this.connectWithRetry(uri, connectionOptions);
    
    try {
      await this.connectionPromise;
      this.isConnected = true;
      return mongoose.connection;
    } catch (error) {
      this.connectionPromise = null;
      throw error;
    }
  }

  // Retry connection logic
  async connectWithRetry(uri, options, retryCount = 0) {
    try {
      console.log(`🔄 Attempting MongoDB connection (attempt ${retryCount + 1}/${this.maxRetries + 1})`);
      
      await mongoose.connect(uri, options);
      
      const isLocal = uri.includes('localhost') || uri.includes('127.0.0.1');
      const dbType = isLocal ? 'Local MongoDB' : 'MongoDB Atlas';
      console.log(`📊 Connected to ${dbType} successfully`);
      console.log(`🔗 Database: ${mongoose.connection.name}`);
      
      return mongoose.connection;
    } catch (error) {
      console.error(`❌ MongoDB connection error (attempt ${retryCount + 1}/${this.maxRetries + 1}):`, error.message);
      
      if (retryCount < this.maxRetries) {
        const delay = this.retryDelay * (retryCount + 1);
        console.log(`🔄 Retrying connection in ${delay / 1000} seconds...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.connectWithRetry(uri, options, retryCount + 1);
      } else {
        console.error('❌ Failed to connect to MongoDB after maximum retries');
        this.logConnectionTips(uri);
        throw error;
      }
    }
  }

  // Log connection tips
  logConnectionTips(uri) {
    const isLocal = uri.includes('localhost') || uri.includes('127.0.0.1');
    
    if (isLocal) {
      console.log('💡 For local MongoDB, make sure to:');
      console.log('   1. Install MongoDB locally');
      console.log('   2. Start MongoDB service (mongod)');
      console.log('   3. Check if MongoDB is running on port 27017');
      console.log('   4. Install MongoDB Compass for GUI management');
    } else {
      console.log('💡 For MongoDB Atlas, make sure to:');
      console.log('   1. Set MONGODB_URI in environment variables');
      console.log('   2. Whitelist your IP address in Atlas (0.0.0.0/0 for all)');
      console.log('   3. Check username/password are correct');
      console.log('   4. Use MongoDB Compass to connect to Atlas for GUI management');
      console.log('   5. Verify your connection string format: mongodb+srv://user:pass@cluster.net/dbname');
      console.log('   6. Ensure your database user has proper read/write permissions');
    }
  }

  // Setup connection event handlers
  setupEventHandlers() {
    mongoose.connection.on('connected', () => {
      console.log('🔗 MongoDB connected successfully');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📴 MongoDB disconnected');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected successfully');
      this.isConnected = true;
    });

    mongoose.connection.on('close', () => {
      console.log('📴 MongoDB connection closed');
      this.isConnected = false;
    });
  }

  // Check connection health
  async checkConnection() {
    try {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      return {
        isConnected: state === 1,
        state: states[state],
        host: mongoose.connection.host,
        name: mongoose.connection.name
      };
    } catch (error) {
      return {
        isConnected: false,
        state: 'error',
        error: error.message
      };
    }
  }

  // Graceful disconnect
  async disconnect() {
    try {
      if (this.isConnected) {
        await mongoose.connection.close();
        console.log('📴 MongoDB connection closed gracefully');
      }
      this.isConnected = false;
      this.connectionPromise = null;
    } catch (error) {
      console.error('❌ Error during MongoDB disconnect:', error);
      throw error;
    }
  }
}

// Configure mongoose global settings
mongoose.set('bufferCommands', true);
mongoose.set('strictQuery', false);

// Create singleton instance
const mongoConnection = new MongoConnection();

module.exports = mongoConnection; 