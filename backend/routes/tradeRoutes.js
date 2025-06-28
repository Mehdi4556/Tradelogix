const express = require('express');
const tradeController = require('../controllers/tradeController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Basic CRUD operations
router
  .route('/')
  .get(tradeController.getAllTrades)
  .post(tradeController.uploadTradeImage, tradeController.createTrade);

router
  .route('/:id')
  .get(tradeController.getTrade)
  .patch(tradeController.updateTrade)
  .delete(tradeController.deleteTrade);

// Trade-specific operations
router.patch('/:id/close', tradeController.closeTrade);

// Filtering and search routes
router.get('/date-range/filter', tradeController.getTradesByDateRange);
router.get('/symbol/:symbol', tradeController.getTradesBySymbol);

// Statistics and analytics
router.get('/analytics/stats', tradeController.getTradeStats);

// Bulk operations
router.patch('/bulk/close', tradeController.bulkCloseTrades);

module.exports = router; 