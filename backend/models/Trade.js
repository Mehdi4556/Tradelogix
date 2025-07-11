const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Trade must belong to a user']
  },
  symbol: {
    type: String,
    required: [true, 'Trading symbol is required'],
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: [true, 'Trade type is required']
  },
  strategy: {
    type: String,
    trim: true,
    maxlength: [100, 'Strategy cannot exceed 100 characters']
  },
  // Entry reason for the trade
  entryReason: {
    type: String,
    enum: ['IFVG', 'Low Volume Engulfing', 'MSS'],
    required: false
  },
  
  // Entry Details
  entryDate: {
    type: Date,
    required: [true, 'Entry date is required']
  },
  entryPrice: {
    type: Number,
    required: [true, 'Entry price is required'],
    min: [0, 'Entry price must be positive']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity must be positive']
  },
  
  // Exit Details
  exitDate: {
    type: Date,
    default: null
  },
  exitPrice: {
    type: Number,
    default: null,
    min: [0, 'Exit price must be positive']
  },
  
  // Trade Status
  status: {
    type: String,
    enum: ['OPEN', 'CLOSED', 'CANCELLED'],
    default: 'OPEN'
  },
  
  // Financial Details
  commission: {
    type: Number,
    default: 0,
    min: [0, 'Commission cannot be negative']
  },
  fees: {
    type: Number,
    default: 0,
    min: [0, 'Fees cannot be negative']
  },
  
  // Risk Management
  stopLoss: {
    type: Number,
    default: null,
    min: [0, 'Stop loss must be positive']
  },
  takeProfit: {
    type: Number,
    default: null,
    min: [0, 'Take profit must be positive']
  },
  riskRewardRatio: {
    type: Number,
    default: null
  },
  
  // Trade Analysis
  marketCondition: {
    type: String,
    enum: ['BULLISH', 'BEARISH', 'SIDEWAYS', 'VOLATILE'],
    default: 'SIDEWAYS'
  },
  timeframe: {
    type: String,
    enum: ['1M', '5M', '15M', '30M', '1H', '4H', '1D', '1W'],
    default: '1D'
  },
  
  // Notes and Tags
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  // Single image for trade screenshot
  image: {
    type: String,
    default: null
  },
  
  // Screenshots and Charts (for multiple images if needed)
  screenshots: [{
    url: String,
    description: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Emotional State
  emotionalState: {
    type: String,
    enum: ['CONFIDENT', 'NERVOUS', 'GREEDY', 'FEARFUL', 'NEUTRAL'],
    default: 'NEUTRAL'
  },
  
  // Performance (calculated fields)
  profit: {
    type: Number,
    default: 0
  },
  profitPercentage: {
    type: Number,
    default: 0
  },
  
  // Meta information
  tradingAccount: {
    type: String,
    default: 'Main Account'
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
tradeSchema.index({ user: 1, entryDate: -1 });
tradeSchema.index({ user: 1, symbol: 1 });
tradeSchema.index({ user: 1, status: 1 });
tradeSchema.index({ user: 1, strategy: 1 });

// Virtual for trade duration
tradeSchema.virtual('duration').get(function() {
  if (!this.exitDate) return null;
  return Math.ceil((this.exitDate - this.entryDate) / (1000 * 60 * 60 * 24)); // Days
});

// Virtual for total cost
tradeSchema.virtual('totalCost').get(function() {
  return (this.entryPrice * this.quantity) + this.commission + this.fees;
});

// Virtual for current value (if still open)
tradeSchema.virtual('currentValue').get(function() {
  if (this.status === 'CLOSED') {
    return (this.exitPrice * this.quantity) - this.commission - this.fees;
  }
  return null; // Would need current market price for open trades
});

// Pre-save middleware to calculate profit
tradeSchema.pre('save', async function(next) {
  if (this.status === 'CLOSED' && this.exitPrice) {
    // Get user's autoCalculateProfit setting
    const User = require('./User');
    const user = await User.findById(this.user);
    
    // Only auto-calculate profit if user has this setting enabled
    if (user && user.autoCalculateProfit) {
      const entryValue = this.entryPrice * this.quantity;
      const exitValue = this.exitPrice * this.quantity;
      const totalCosts = this.commission + this.fees;
      
      if (this.type === 'BUY') {
        this.profit = exitValue - entryValue - totalCosts;
      } else { // SELL
        this.profit = entryValue - exitValue - totalCosts;
      }
      
      this.profitPercentage = (this.profit / entryValue) * 100;
    }
    // If autoCalculateProfit is false, profit should be manually entered
    // and we don't override it here
  }
  next();
});

// Static method to get user statistics
tradeSchema.statics.getUserStats = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        status: 'CLOSED',
        ...(startDate && endDate && {
          exitDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        })
      }
    },
    {
      $group: {
        _id: null,
        totalTrades: { $sum: 1 },
        winningTrades: {
          $sum: { $cond: [{ $gt: ['$profit', 0] }, 1, 0] }
        },
        losingTrades: {
          $sum: { $cond: [{ $lt: ['$profit', 0] }, 1, 0] }
        },
        totalProfit: { $sum: '$profit' },
        averageProfit: { $avg: '$profit' },
        biggestWin: { $max: '$profit' },
        biggestLoss: { $min: '$profit' }
      }
    }
  ]);
};

module.exports = mongoose.model('Trade', tradeSchema); 