const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Trade = require('../models/Trade');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary storage for trade screenshots
const tradeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tradelogix/trades',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'limit', quality: 'auto' }
    ]
  }
});

// Cloudinary storage for profile images
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tradelogix/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }
    ]
  }
});

// Multer configuration for trade screenshots
const uploadTradeScreenshots = multer({
  storage: tradeStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  }
});

// Multer configuration for profile images
const uploadProfileImage = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  }
});

// Middleware for handling multiple trade screenshots
exports.uploadTradeImages = uploadTradeScreenshots.array('screenshots', 5);

// Middleware for handling single profile image
exports.uploadProfile = uploadProfileImage.single('profileImage');

// Upload screenshots to a trade
exports.addTradeScreenshots = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Please select at least one image to upload'
    });
  }

  const { tradeId } = req.params;
  const { descriptions } = req.body; // Array of descriptions for each image

  // Find the trade
  const trade = await Trade.findOne({
    _id: tradeId,
    user: req.user.id
  });

  if (!trade) {
    return res.status(404).json({
      status: 'error',
      message: 'No trade found with that ID'
    });
  }

  // Process uploaded files
  const screenshots = req.files.map((file, index) => ({
    url: file.path,
    description: descriptions && descriptions[index] 
      ? descriptions[index] 
      : `Screenshot ${index + 1}`,
    uploadDate: new Date()
  }));

  // Add screenshots to trade
  trade.screenshots.push(...screenshots);
  await trade.save();

  res.status(200).json({
    status: 'success',
    data: {
      trade,
      uploadedScreenshots: screenshots
    }
  });
});

// Update user profile image
exports.updateProfileImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      status: 'error',
      message: 'Please select an image to upload'
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profileImage: req.file.path },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      user,
      profileImage: req.file.path
    }
  });
});

// Delete a screenshot from a trade
exports.deleteTradeScreenshot = catchAsync(async (req, res, next) => {
  const { tradeId, screenshotIndex } = req.params;

  const trade = await Trade.findOne({
    _id: tradeId,
    user: req.user.id
  });

  if (!trade) {
    return res.status(404).json({
      status: 'error',
      message: 'No trade found with that ID'
    });
  }

  if (screenshotIndex >= trade.screenshots.length || screenshotIndex < 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid screenshot index'
    });
  }

  // Get the screenshot URL to delete from Cloudinary
  const screenshotToDelete = trade.screenshots[screenshotIndex];
  
  // Extract public_id from Cloudinary URL
  if (screenshotToDelete.url.includes('cloudinary.com')) {
    const urlParts = screenshotToDelete.url.split('/');
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = `tradelogix/trades/${publicIdWithExtension.split('.')[0]}`;
    
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }
  }

  // Remove screenshot from trade
  trade.screenshots.splice(screenshotIndex, 1);
  await trade.save();

  res.status(200).json({
    status: 'success',
    data: {
      trade
    }
  });
});

// Update screenshot description
exports.updateScreenshotDescription = catchAsync(async (req, res, next) => {
  const { tradeId, screenshotIndex } = req.params;
  const { description } = req.body;

  const trade = await Trade.findOne({
    _id: tradeId,
    user: req.user.id
  });

  if (!trade) {
    return res.status(404).json({
      status: 'error',
      message: 'No trade found with that ID'
    });
  }

  if (screenshotIndex >= trade.screenshots.length || screenshotIndex < 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid screenshot index'
    });
  }

  trade.screenshots[screenshotIndex].description = description;
  await trade.save();

  res.status(200).json({
    status: 'success',
    data: {
      trade
    }
  });
});

// Get upload statistics
exports.getUploadStats = catchAsync(async (req, res, next) => {
  const trades = await Trade.find({ user: req.user.id });
  
  const totalScreenshots = trades.reduce((sum, trade) => sum + trade.screenshots.length, 0);
  const tradesWithScreenshots = trades.filter(trade => trade.screenshots.length > 0).length;
  
  res.status(200).json({
    status: 'success',
    data: {
      totalTrades: trades.length,
      totalScreenshots,
      tradesWithScreenshots,
      averageScreenshotsPerTrade: trades.length > 0 ? totalScreenshots / trades.length : 0
    }
  });
});

// Error handling middleware for multer errors
exports.handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File too large. Maximum size is 10MB for trade screenshots and 5MB for profile images.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Too many files. Maximum 5 screenshots per upload.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        status: 'error',
        message: 'Unexpected field name. Use "screenshots" for trade images or "profileImage" for profile.'
      });
    }
  }
  
  if (error.message === 'Not an image! Please upload only images.') {
    return res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
  
  next(error);
}; 