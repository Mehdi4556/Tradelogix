const mongoose = require('mongoose');
const User = require('../models/User');
const Trade = require('../models/Trade');
require('dotenv').config();

// Sample users
const sampleUsers = [
  {
    username: 'demo_trader',
    email: 'demo@tradelogix.com',
    password: 'password123',
    firstName: 'Demo',
    lastName: 'Trader',
    tradingExperience: 'intermediate',
    preferredCurrency: 'USD'
  },
  {
    username: 'pro_trader',
    email: 'pro@tradelogix.com',
    password: 'password123',
    firstName: 'Pro',
    lastName: 'Trader',
    tradingExperience: 'professional',
    preferredCurrency: 'EUR'
  }                                                                               
];

// Sample trades
const generateSampleTrades = (userId) => [
  {
    user: userId,
    symbol: 'AAPL',
    type: 'BUY',
    strategy: 'Breakout Strategy',
    entryDate: new Date('2024-01-15T10:30:00Z'),
    entryPrice: 150.50,
    quantity: 100,
    exitDate: new Date('2024-01-20T15:45:00Z'),
    exitPrice: 158.75,
    status: 'CLOSED',
    timeframe: '1D',
    stopLoss: 145.00,
    takeProfit: 160.00,
    commission: 1.50,
    fees: 0.50,
    marketCondition: 'BULLISH',
    notes: 'Strong bullish pattern with good volume',
    tags: ['breakout', 'momentum'],
    emotionalState: 'CONFIDENT',
    image: '/uploads/trades/trade-1751039690342-908709954.jpg'
  },
  {
    user: userId,
    symbol: 'TSLA',
    type: 'BUY',
    strategy: 'Support and Resistance',
    entryDate: new Date('2024-01-18T14:20:00Z'),
    entryPrice: 245.30,
    quantity: 50,
    status: 'OPEN',
    timeframe: '4H',
    stopLoss: 235.00,
    takeProfit: 260.00,
    commission: 1.25,
    fees: 0.25,
    marketCondition: 'SIDEWAYS',
    notes: 'Bounced off major support level',
    tags: ['support', 'technical'],
    emotionalState: 'NEUTRAL',
    image: '/uploads/trades/trade-1751033114700-828061931.jpg'
  },
  {
    user: userId,
    symbol: 'GOOGL',
    type: 'SELL',
    strategy: 'Short Selling',
    entryDate: new Date('2024-01-22T11:15:00Z'),
    entryPrice: 142.80,
    quantity: 75,
    exitDate: new Date('2024-01-25T09:30:00Z'),
    exitPrice: 138.20,
    status: 'CLOSED',
    timeframe: '1D',
    stopLoss: 148.00,
    takeProfit: 135.00,
    commission: 1.75,
    fees: 0.75,
    marketCondition: 'BEARISH',
    notes: 'Resistance rejection with bearish signals',
    tags: ['short', 'resistance'],
    emotionalState: 'CONFIDENT',
    image: '/uploads/trades/trade-1751039690342-908709954.jpg'
  },
  {
    user: userId,
    symbol: 'MSFT',
    type: 'BUY',
    strategy: 'Moving Average Crossover',
    entryDate: new Date('2024-01-25T13:45:00Z'),
    entryPrice: 380.50,
    quantity: 25,
    exitDate: new Date('2024-01-28T16:00:00Z'),
    exitPrice: 375.20,
    status: 'CLOSED',
    timeframe: '1H',
    stopLoss: 375.00,
    takeProfit: 390.00,
    commission: 0.95,
    fees: 0.30,
    marketCondition: 'VOLATILE',
    notes: 'False breakout, hit stop loss',
    tags: ['ma-crossover', 'loss'],
    emotionalState: 'FEARFUL',
    image: '/uploads/trades/trade-1751033114700-828061931.jpg'
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tradelogix');
    console.log('📊 Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Trade.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users
    const createdUsers = await User.create(sampleUsers);
    console.log(`👥 Created ${createdUsers.length} sample users`);

    // Create trades for each user
    let totalTrades = 0;
    for (const user of createdUsers) {
      const trades = generateSampleTrades(user._id);
      await Trade.create(trades);
      totalTrades += trades.length;
      console.log(`📈 Created ${trades.length} trades for ${user.username}`);
    }

    console.log(`✅ Database seeded successfully!`);
    console.log(`📊 Total users: ${createdUsers.length}`);
    console.log(`📈 Total trades: ${totalTrades}`);
    console.log('\n🔑 Login credentials:');
    console.log('Demo User: demo@tradelogix.com / password123');
    console.log('Pro User: pro@tradelogix.com / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit();
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleUsers, generateSampleTrades }; 