// Configuration Example
// Copy this to config.js and fill in your actual values
// Or set these as environment variables

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/tradelogix?retryWrites=true&w=majority',
  // Replace with your actual Atlas connection string

  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here_make_it_long_and_secure',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',

  // Cloudinary Configuration (for image uploads)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloudinary_cloud_name',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || 'your_cloudinary_api_key',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || 'your_cloudinary_api_secret',

  // CORS Configuration
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000'
}; 