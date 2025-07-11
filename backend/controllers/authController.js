const jwt = require('jsonwebtoken');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

// Helper function to create and send JWT token
const signToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const createSendToken = (user, statusCode, res) => {
  try {
    const token = signToken(user._id);
    
    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Error creating token:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication system error. Please contact support.'
    });
  }
};

// Register new user
exports.register = catchAsync(async (req, res, next) => {
  try {
    // Validate environment variables
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return res.status(500).json({
        status: 'error',
        message: 'Server configuration error. Please contact support.'
      });
    }

    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set');
      return res.status(500).json({
        status: 'error',
        message: 'Database configuration error. Please contact support.'
      });
    }

    const { username, email, password, firstName, lastName, tradingExperience, preferredCurrency } = req.body;

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields: username, email, password, firstName, lastName'
      });
    }

    console.log('Attempting to register user:', { username, email, firstName, lastName });

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      console.log('User already exists:', existingUser.email === email ? 'email' : 'username');
      return res.status(400).json({
        status: 'error',
        message: existingUser.email === email 
          ? 'User with this email already exists' 
          : 'Username already taken'
      });
    }

    console.log('Creating new user...');

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      tradingExperience: tradingExperience || 'beginner',
      preferredCurrency: preferredCurrency || 'USD'
    });

    console.log('User created successfully:', newUser._id);

    createSendToken(newUser, 201, res);
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        status: 'error',
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(val => val.message).join(', ');
      return res.status(400).json({
        status: 'error',
        message
      });
    }



    // Generic error response
    return res.status(500).json({
      status: 'error',
      message: 'Registration failed. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// User login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide email and password!'
    });
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(401).json({
      status: 'error',
      message: 'Incorrect email or password'
    });
  }

  // 3) Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      status: 'error',
      message: 'Your account has been deactivated. Please contact support.'
    });
  }

  // 4) Update last login
  await user.updateLastLogin();

  // 5) If everything ok, send token to client
  createSendToken(user, 200, res);
});

// Get current user profile
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Update user profile
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return res.status(400).json({
      status: 'error',
      message: 'This route is not for password updates. Please use /update-password.'
    });
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = {};
  const allowedFields = ['firstName', 'lastName', 'username', 'tradingExperience', 'preferredCurrency', 'profileImage', 'autoCalculateProfit'];
  
  Object.keys(req.body).forEach(el => {
    if (allowedFields.includes(el)) {
      filteredBody[el] = req.body[el];
    }
  });

  // 3) Check if username is being changed and if it's already taken
  if (filteredBody.username && filteredBody.username !== req.user.username) {
    const existingUser = await User.findOne({ username: filteredBody.username });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Username already taken'
      });
    }
  }

  // 4) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

// Update password
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return res.status(401).json({
      status: 'error',
      message: 'Your current password is wrong.'
    });
  }

  // 3) If so, update password
  user.password = req.body.password;
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

// Deactivate account
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { isActive: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get user statistics (for dashboard)
exports.getUserStats = catchAsync(async (req, res, next) => {
  const Trade = require('../models/Trade');
  
  // Get basic user info
  const user = await User.findById(req.user.id);
  
  // Get trade statistics
  const stats = await Trade.getUserStats(req.user.id);
  
  // Get recent trades
  const recentTrades = await Trade.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('symbol type profit status entryDate exitDate');

  // Get open trades count
  const openTrades = await Trade.countDocuments({ 
    user: req.user.id, 
    status: 'OPEN' 
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        tradingExperience: user.tradingExperience,
        preferredCurrency: user.preferredCurrency,
        lastLogin: user.lastLogin,
        memberSince: user.createdAt
      },
      statistics: stats[0] || {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalProfit: 0,
        averageProfit: 0,
        biggestWin: 0,
        biggestLoss: 0
      },
      openTrades,
      recentTrades
    }
  });
}); 