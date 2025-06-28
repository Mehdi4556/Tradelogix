const multer = require('multer');
const path = require('path');
const Trade = require('../models/Trade');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const dayjs = require('dayjs');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/trades/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'trade-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  }
});

exports.uploadTradeImage = upload.single('image');

// Get all trades for the authenticated user
exports.getAllTrades = catchAsync(async (req, res, next) => {
  // Build query
  const queryObj = { user: req.user.id, ...req.query };
  
  // Remove pagination and sorting fields from query
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);

  // Apply API features (filtering, sorting, pagination)
  const features = new APIFeatures(Trade.find(queryObj), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const trades = await features.query.populate('user', 'username fullName');

  res.status(200).json({
    status: 'success',
    results: trades.length,
    data: {
      trades
    }
  });
});

// Get trade by ID
exports.getTrade = catchAsync(async (req, res, next) => {
  const trade = await Trade.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!trade) {
    return res.status(404).json({
      status: 'error',
      message: 'No trade found with that ID'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      trade
    }
  });
});

// Create new trade
exports.createTrade = catchAsync(async (req, res, next) => {
  // Add user ID to the request body
  req.body.user = req.user.id;

  // Add image path if file was uploaded
  if (req.file) {
    req.body.image = `/uploads/trades/${req.file.filename}`;
  }

  const newTrade = await Trade.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      trade: newTrade
    }
  });
});

// Update trade
exports.updateTrade = catchAsync(async (req, res, next) => {
  const trade = await Trade.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!trade) {
    return res.status(404).json({
      status: 'error',
      message: 'No trade found with that ID'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      trade
    }
  });
});

// Delete trade
exports.deleteTrade = catchAsync(async (req, res, next) => {
  const trade = await Trade.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id
  });

  if (!trade) {
    return res.status(404).json({
      status: 'error',
      message: 'No trade found with that ID'
    });
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Close a trade (update exit details)
exports.closeTrade = catchAsync(async (req, res, next) => {
  const { exitPrice, exitDate, notes } = req.body;

  if (!exitPrice) {
    return res.status(400).json({
      status: 'error',
      message: 'Exit price is required to close a trade'
    });
  }

  const trade = await Trade.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id, status: 'OPEN' },
    {
      exitPrice,
      exitDate: exitDate || new Date(),
      status: 'CLOSED',
      ...(notes && { notes })
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!trade) {
    return res.status(404).json({
      status: 'error',
      message: 'No open trade found with that ID'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      trade
    }
  });
});

// Get trades by date range
exports.getTradesByDateRange = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide both startDate and endDate'
    });
  }

  const trades = await Trade.find({
    user: req.user.id,
    entryDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ entryDate: -1 });

  res.status(200).json({
    status: 'success',
    results: trades.length,
    data: {
      trades
    }
  });
});

// Get trades by symbol
exports.getTradesBySymbol = catchAsync(async (req, res, next) => {
  const { symbol } = req.params;

  const trades = await Trade.find({
    user: req.user.id,
    symbol: symbol.toUpperCase()
  }).sort({ entryDate: -1 });

  if (trades.length === 0) {
    return res.status(404).json({
      status: 'error',
      message: `No trades found for symbol ${symbol.toUpperCase()}`
    });
  }

  // Calculate symbol statistics
  const stats = {
    totalTrades: trades.length,
    openTrades: trades.filter(t => t.status === 'OPEN').length,
    closedTrades: trades.filter(t => t.status === 'CLOSED').length,
    totalProfit: trades.reduce((sum, t) => sum + (t.profit || 0), 0),
    winRate: trades.filter(t => t.status === 'CLOSED').length > 0 
      ? (trades.filter(t => t.profit > 0).length / trades.filter(t => t.status === 'CLOSED').length) * 100 
      : 0
  };

  res.status(200).json({
    status: 'success',
    results: trades.length,
    data: {
      symbol: symbol.toUpperCase(),
      statistics: stats,
      trades
    }
  });
});

// Get trade statistics
exports.getTradeStats = catchAsync(async (req, res, next) => {
  const { period } = req.query; // 'week', 'month', 'year', 'all'
  
  let dateFilter = {};
  const now = dayjs();

  switch (period) {
    case 'week':
      dateFilter = { entryDate: { $gte: now.subtract(7, 'day').toDate() } };
      break;
    case 'month':
      dateFilter = { entryDate: { $gte: now.subtract(1, 'month').toDate() } };
      break;
    case 'year':
      dateFilter = { entryDate: { $gte: now.subtract(1, 'year').toDate() } };
      break;
    default:
      // All time
      break;
  }

  const stats = await Trade.aggregate([
    {
      $match: {
        user: req.user._id,
        ...dateFilter
      }
    },
    {
      $group: {
        _id: null,
        totalTrades: { $sum: 1 },
        openTrades: {
          $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] }
        },
        closedTrades: {
          $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] }
        },
        winningTrades: {
          $sum: { $cond: [{ $gt: ['$profit', 0] }, 1, 0] }
        },
        losingTrades: {
          $sum: { $cond: [{ $lt: ['$profit', 0] }, 1, 0] }
        },
        totalProfit: { $sum: '$profit' },
        averageProfit: { $avg: '$profit' },
        biggestWin: { $max: '$profit' },
        biggestLoss: { $min: '$profit' },
        averageHoldTime: { $avg: '$duration' }
      }
    }
  ]);

  const result = stats[0] || {
    totalTrades: 0,
    openTrades: 0,
    closedTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    totalProfit: 0,
    averageProfit: 0,
    biggestWin: 0,
    biggestLoss: 0,
    averageHoldTime: 0
  };

  // Calculate win rate
  result.winRate = result.closedTrades > 0 
    ? (result.winningTrades / result.closedTrades) * 100 
    : 0;

  res.status(200).json({
    status: 'success',
    data: {
      period: period || 'all',
      statistics: result
    }
  });
});

// Bulk operations
exports.bulkCloseTrades = catchAsync(async (req, res, next) => {
  const { tradeIds, exitPrice, exitDate } = req.body;

  if (!tradeIds || !Array.isArray(tradeIds) || tradeIds.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide an array of trade IDs'
    });
  }

  if (!exitPrice) {
    return res.status(400).json({
      status: 'error',
      message: 'Exit price is required'
    });
  }

  const result = await Trade.updateMany(
    {
      _id: { $in: tradeIds },
      user: req.user.id,
      status: 'OPEN'
    },
    {
      exitPrice,
      exitDate: exitDate || new Date(),
      status: 'CLOSED'
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      modifiedCount: result.modifiedCount,
      message: `${result.modifiedCount} trades closed successfully`
    }
  });
}); 