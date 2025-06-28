const { body, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and cannot exceed 50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and cannot exceed 50 characters'),
  
  body('tradingExperience')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'professional'])
    .withMessage('Trading experience must be one of: beginner, intermediate, advanced, professional'),
  
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Trade creation validation
const validateTrade = [
  body('symbol')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Symbol is required and cannot exceed 10 characters')
    .toUpperCase(),
  
  body('type')
    .isIn(['BUY', 'SELL'])
    .withMessage('Trade type must be either BUY or SELL'),
  
  body('strategy')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Strategy is required and cannot exceed 100 characters'),
  
  body('entryDate')
    .isISO8601()
    .withMessage('Entry date must be a valid date')
    .toDate(),
  
  body('entryPrice')
    .isFloat({ min: 0 })
    .withMessage('Entry price must be a positive number'),
  
  body('quantity')
    .isFloat({ min: 0 })
    .withMessage('Quantity must be a positive number'),
  
  body('timeframe')
    .isIn(['1M', '5M', '15M', '30M', '1H', '4H', '1D', '1W'])
    .withMessage('Timeframe must be one of: 1M, 5M, 15M, 30M, 1H, 4H, 1D, 1W'),
  
  body('exitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Exit price must be a positive number'),
  
  body('stopLoss')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Stop loss must be a positive number'),
  
  body('takeProfit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Take profit must be a positive number'),
  
  body('commission')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Commission must be a positive number'),
  
  body('fees')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fees must be a positive number'),
  
  handleValidationErrors
];

// Close trade validation
const validateCloseTrade = [
  body('exitPrice')
    .isFloat({ min: 0 })
    .withMessage('Exit price is required and must be a positive number'),
  
  body('exitDate')
    .optional()
    .isISO8601()
    .withMessage('Exit date must be a valid date')
    .toDate(),
  
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('tradingExperience')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'professional'])
    .withMessage('Trading experience must be one of: beginner, intermediate, advanced, professional'),
  
  body('preferredCurrency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code')
    .toUpperCase(),
  
  handleValidationErrors
];

// Password update validation
const validatePasswordUpdate = [
  body('passwordCurrent')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('New password must contain at least one letter and one number'),
  
  body('passwordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateTrade,
  validateCloseTrade,
  validateProfileUpdate,
  validatePasswordUpdate,
  handleValidationErrors
}; 