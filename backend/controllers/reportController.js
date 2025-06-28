const Trade = require('../models/Trade');
const catchAsync = require('../utils/catchAsync');
const dayjs = require('dayjs');

// Generate comprehensive trading report
exports.generateReport = catchAsync(async (req, res, next) => {
  const { startDate, endDate, period } = req.query;
  
  let dateFilter = {};
  let periodLabel = 'All Time';
  
  if (startDate && endDate) {
    dateFilter = {
      entryDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    periodLabel = `${dayjs(startDate).format('MMM DD, YYYY')} - ${dayjs(endDate).format('MMM DD, YYYY')}`;
  } else if (period) {
    const now = dayjs();
    switch (period) {
      case 'today':
        dateFilter = { entryDate: { $gte: now.startOf('day').toDate(), $lte: now.endOf('day').toDate() } };
        periodLabel = 'Today';
        break;
      case 'week':
        dateFilter = { entryDate: { $gte: now.subtract(7, 'day').toDate() } };
        periodLabel = 'Last 7 Days';
        break;
      case 'month':
        dateFilter = { entryDate: { $gte: now.subtract(1, 'month').toDate() } };
        periodLabel = 'Last Month';
        break;
      case 'quarter':
        dateFilter = { entryDate: { $gte: now.subtract(3, 'month').toDate() } };
        periodLabel = 'Last Quarter';
        break;
      case 'year':
        dateFilter = { entryDate: { $gte: now.subtract(1, 'year').toDate() } };
        periodLabel = 'Last Year';
        break;
    }
  }

  // Main aggregation pipeline
  const reportData = await Trade.aggregate([
    {
      $match: {
        user: req.user._id,
        ...dateFilter
      }
    },
    {
      $facet: {
        // Overall statistics
        overall: [
          {
            $group: {
              _id: null,
              totalTrades: { $sum: 1 },
              openTrades: { $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] } },
              closedTrades: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
              winningTrades: { $sum: { $cond: [{ $gt: ['$profit', 0] }, 1, 0] } },
              losingTrades: { $sum: { $cond: [{ $lt: ['$profit', 0] }, 1, 0] } },
              totalProfit: { $sum: '$profit' },
              totalVolume: { $sum: { $multiply: ['$entryPrice', '$quantity'] } },
              totalCommissions: { $sum: { $add: ['$commission', '$fees'] } },
              averageProfit: { $avg: '$profit' },
              biggestWin: { $max: '$profit' },
              biggestLoss: { $min: '$profit' },
              averageHoldTime: { $avg: '$duration' }
            }
          }
        ],
        
        // By symbol analysis
        bySymbol: [
          {
            $group: {
              _id: '$symbol',
              count: { $sum: 1 },
              totalProfit: { $sum: '$profit' },
              winCount: { $sum: { $cond: [{ $gt: ['$profit', 0] }, 1, 0] } },
              avgProfit: { $avg: '$profit' }
            }
          },
          { $sort: { totalProfit: -1 } },
          { $limit: 10 }
        ],
        
        // By strategy analysis
        byStrategy: [
          {
            $group: {
              _id: '$strategy',
              count: { $sum: 1 },
              totalProfit: { $sum: '$profit' },
              winCount: { $sum: { $cond: [{ $gt: ['$profit', 0] }, 1, 0] } },
              avgProfit: { $avg: '$profit' }
            }
          },
          { $sort: { totalProfit: -1 } }
        ],
        
        // Monthly performance (last 12 months)
        monthlyPerformance: [
          {
            $match: {
              entryDate: { $gte: dayjs().subtract(12, 'month').toDate() }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$entryDate' },
                month: { $month: '$entryDate' }
              },
              trades: { $sum: 1 },
              profit: { $sum: '$profit' },
              winCount: { $sum: { $cond: [{ $gt: ['$profit', 0] }, 1, 0] } }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ],
        
        // Risk metrics
        riskMetrics: [
          {
            $match: { status: 'CLOSED' }
          },
          {
            $group: {
              _id: null,
              profits: { $push: { $cond: [{ $gt: ['$profit', 0] }, '$profit', null] } },
              losses: { $push: { $cond: [{ $lt: ['$profit', 0] }, '$profit', null] } },
              allProfits: { $push: '$profit' }
            }
          }
        ]
      }
    }
  ]);

  const data = reportData[0];
  const overall = data.overall[0] || {};
  
  // Calculate additional metrics
  const winRate = overall.closedTrades > 0 ? (overall.winningTrades / overall.closedTrades) * 100 : 0;
  const profitFactor = overall.losingTrades > 0 
    ? Math.abs(overall.totalProfit / (overall.biggestLoss * overall.losingTrades)) 
    : overall.totalProfit > 0 ? Infinity : 0;
  
  // Return on Investment (ROI)
  const roi = overall.totalVolume > 0 ? (overall.totalProfit / overall.totalVolume) * 100 : 0;

  res.status(200).json({
    status: 'success',
    data: {
      period: periodLabel,
      generated: new Date(),
      summary: {
        ...overall,
        winRate: Number(winRate.toFixed(2)),
        profitFactor: Number(profitFactor.toFixed(2)),
        roi: Number(roi.toFixed(2)),
        netProfit: overall.totalProfit - overall.totalCommissions
      },
      analysis: {
        topSymbols: data.bySymbol,
        strategies: data.byStrategy,
        monthlyPerformance: data.monthlyPerformance
      }
    }
  });
});

// Get daily report
exports.getDailyReport = catchAsync(async (req, res, next) => {
  const { date } = req.query;
  const targetDate = date ? dayjs(date) : dayjs();
  
  const startOfDay = targetDate.startOf('day').toDate();
  const endOfDay = targetDate.endOf('day').toDate();

  const trades = await Trade.find({
    user: req.user.id,
    entryDate: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  }).sort({ entryDate: 1 });

  const summary = {
    date: targetDate.format('YYYY-MM-DD'),
    totalTrades: trades.length,
    openTrades: trades.filter(t => t.status === 'OPEN').length,
    closedTrades: trades.filter(t => t.status === 'CLOSED').length,
    totalProfit: trades.reduce((sum, t) => sum + (t.profit || 0), 0),
    symbols: [...new Set(trades.map(t => t.symbol))],
    strategies: [...new Set(trades.map(t => t.strategy))]
  };

  res.status(200).json({
    status: 'success',
    data: {
      summary,
      trades
    }
  });
});

// Get monthly report
exports.getMonthlyReport = catchAsync(async (req, res, next) => {
  const { year, month } = req.query;
  const targetDate = year && month 
    ? dayjs(`${year}-${month}-01`) 
    : dayjs();
  
  const startOfMonth = targetDate.startOf('month').toDate();
  const endOfMonth = targetDate.endOf('month').toDate();

  const monthlyData = await Trade.aggregate([
    {
      $match: {
        user: req.user._id,
        entryDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      }
    },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalTrades: { $sum: 1 },
              totalProfit: { $sum: '$profit' },
              winningTrades: { $sum: { $cond: [{ $gt: ['$profit', 0] }, 1, 0] } },
              totalVolume: { $sum: { $multiply: ['$entryPrice', '$quantity'] } }
            }
          }
        ],
        dailyBreakdown: [
          {
            $group: {
              _id: { $dayOfMonth: '$entryDate' },
              trades: { $sum: 1 },
              profit: { $sum: '$profit' }
            }
          },
          { $sort: { '_id': 1 } }
        ],
        topPerformers: [
          {
            $match: { profit: { $gt: 0 } }
          },
          { $sort: { profit: -1 } },
          { $limit: 5 }
        ],
        worstPerformers: [
          {
            $match: { profit: { $lt: 0 } }
          },
          { $sort: { profit: 1 } },
          { $limit: 5 }
        ]
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      month: targetDate.format('MMMM YYYY'),
      summary: monthlyData[0].summary[0] || {},
      dailyBreakdown: monthlyData[0].dailyBreakdown,
      topPerformers: monthlyData[0].topPerformers,
      worstPerformers: monthlyData[0].worstPerformers
    }
  });
});

// Get performance comparison
exports.getPerformanceComparison = catchAsync(async (req, res, next) => {
  const currentMonth = dayjs();
  const previousMonth = currentMonth.subtract(1, 'month');

  const [currentData, previousData] = await Promise.all([
    Trade.aggregate([
      {
        $match: {
          user: req.user._id,
          entryDate: {
            $gte: currentMonth.startOf('month').toDate(),
            $lte: currentMonth.endOf('month').toDate()
          }
        }
      },
      {
        $group: {
          _id: null,
          totalTrades: { $sum: 1 },
          totalProfit: { $sum: '$profit' },
          winningTrades: { $sum: { $cond: [{ $gt: ['$profit', 0] }, 1, 0] } }
        }
      }
    ]),
    Trade.aggregate([
      {
        $match: {
          user: req.user._id,
          entryDate: {
            $gte: previousMonth.startOf('month').toDate(),
            $lte: previousMonth.endOf('month').toDate()
          }
        }
      },
      {
        $group: {
          _id: null,
          totalTrades: { $sum: 1 },
          totalProfit: { $sum: '$profit' },
          winningTrades: { $sum: { $cond: [{ $gt: ['$profit', 0] }, 1, 0] } }
        }
      }
    ])
  ]);

  const current = currentData[0] || { totalTrades: 0, totalProfit: 0, winningTrades: 0 };
  const previous = previousData[0] || { totalTrades: 0, totalProfit: 0, winningTrades: 0 };

  const comparison = {
    trades: {
      current: current.totalTrades,
      previous: previous.totalTrades,
      change: current.totalTrades - previous.totalTrades,
      changePercent: previous.totalTrades > 0 
        ? ((current.totalTrades - previous.totalTrades) / previous.totalTrades) * 100 
        : 0
    },
    profit: {
      current: current.totalProfit,
      previous: previous.totalProfit,
      change: current.totalProfit - previous.totalProfit,
      changePercent: previous.totalProfit > 0 
        ? ((current.totalProfit - previous.totalProfit) / previous.totalProfit) * 100 
        : 0
    },
    winRate: {
      current: current.totalTrades > 0 ? (current.winningTrades / current.totalTrades) * 100 : 0,
      previous: previous.totalTrades > 0 ? (previous.winningTrades / previous.totalTrades) * 100 : 0
    }
  };

  res.status(200).json({
    status: 'success',
    data: {
      currentMonth: currentMonth.format('MMMM YYYY'),
      previousMonth: previousMonth.format('MMMM YYYY'),
      comparison
    }
  });
});

// Export trades to CSV format
exports.exportTrades = catchAsync(async (req, res, next) => {
  const { startDate, endDate, format = 'json' } = req.query;
  
  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter = {
      entryDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
  }

  const trades = await Trade.find({
    user: req.user.id,
    ...dateFilter
  }).sort({ entryDate: -1 });

  if (format === 'csv') {
    // Convert to CSV format
    const csvHeader = 'Symbol,Type,Strategy,Entry Date,Entry Price,Exit Date,Exit Price,Quantity,Profit,Status,Notes\n';
    const csvData = trades.map(trade => {
      return [
        trade.symbol,
        trade.type,
        trade.strategy,
        trade.entryDate.toISOString().split('T')[0],
        trade.entryPrice,
        trade.exitDate ? trade.exitDate.toISOString().split('T')[0] : '',
        trade.exitPrice || '',
        trade.quantity,
        trade.profit || 0,
        trade.status,
        (trade.notes || '').replace(/,/g, ';')
      ].join(',');
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="trades_export_${dayjs().format('YYYY-MM-DD')}.csv"`);
    res.send(csvHeader + csvData);
  } else {
    res.status(200).json({
      status: 'success',
      results: trades.length,
      exportDate: new Date(),
      data: {
        trades
      }
    });
  }
}); 