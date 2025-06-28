const express = require('express');
const authController = require('../controllers/authController');
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.use(protect); // Protect all routes after this middleware

// User profile routes
router.get('/me', authController.getMe);
router.patch('/update-me', authController.updateMe);
router.patch('/update-password', authController.updatePassword);
router.delete('/delete-me', authController.deleteMe);

// User statistics and dashboard
router.get('/stats', authController.getUserStats);

// Profile image upload
router.patch('/upload-profile', 
  uploadController.uploadProfile,
  uploadController.handleMulterError,
  uploadController.updateProfileImage
);

module.exports = router; 