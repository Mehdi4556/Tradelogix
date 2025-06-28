const express = require('express');
const reportController = require('../controllers/reportController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Main report generation
router.get('/generate', reportController.generateReport);

// Specific report types
router.get('/daily', reportController.getDailyReport);
router.get('/monthly', reportController.getMonthlyReport);

// Performance analysis
router.get('/comparison', reportController.getPerformanceComparison);

// Data export
router.get('/export', reportController.exportTrades);

module.exports = router; 