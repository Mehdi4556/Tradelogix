const express = require('express');
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Trade screenshot uploads
router.post('/trade/:tradeId/screenshots',
  uploadController.uploadTradeImages,
  uploadController.handleMulterError,
  uploadController.addTradeScreenshots
);

// Manage trade screenshots
router.delete('/trade/:tradeId/screenshot/:screenshotIndex', uploadController.deleteTradeScreenshot);
router.patch('/trade/:tradeId/screenshot/:screenshotIndex', uploadController.updateScreenshotDescription);

// Upload statistics
router.get('/stats', uploadController.getUploadStats);

module.exports = router; 