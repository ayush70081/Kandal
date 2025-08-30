const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const { 
  authenticateToken, 
  authenticateRefreshToken,
  createRateLimiter 
} = require('../middleware/auth.middleware');

const router = express.Router();

// Rate limiters - Environment-based configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const authRateLimit = createRateLimiter(
  isDevelopment ? 100 : 20, // 100 requests in dev, 20 in production
  15 * 60 * 1000 // 15 minutes
);
const generalRateLimit = createRateLimiter(
  isDevelopment ? 200 : 50, // 200 requests in dev, 50 in production
  15 * 60 * 1000 // 15 minutes
);

// Validation rules
const registerValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('location.city')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City is required and must be less than 100 characters'),
  
  body('location.coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('location.coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
];

const loginValidation = [
  body('identifier')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be less than 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('location.city')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City is required when provided and must be less than 100 characters'),
  
  body('location.coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('location.coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('preferences.emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications preference must be a boolean'),
  
  body('preferences.smsNotifications')
    .optional()
    .isBoolean()
    .withMessage('SMS notifications preference must be a boolean'),
  
  body('preferences.publicProfile')
    .optional()
    .isBoolean()
    .withMessage('Public profile preference must be a boolean')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

// Public routes
/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authRateLimit, registerValidation, AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authRateLimit, loginValidation, AuthController.login);

/**
 * @route   GET /api/auth/login
 * @desc    Handle GET requests to login (return helpful message)
 * @access  Public
 */
router.get('/login', (req, res) => {
  res.json({
    success: false,
    message: 'Please use POST method for login',
    hint: 'Use the frontend login page at /login'
  });
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', generalRateLimit, authenticateRefreshToken, AuthController.refreshToken);

// Protected routes
/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (remove refresh token)
 * @access  Private
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', authenticateToken, AuthController.logoutAll);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, AuthController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, updateProfileValidation, AuthController.updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticateToken, changePasswordValidation, AuthController.changePassword);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if access token is valid
 * @access  Private
 */
router.get('/verify', authenticateToken, AuthController.verifyToken);

/**
 * @route   GET /api/auth/stats
 * @desc    Get current user statistics and achievements
 * @access  Private
 */
router.get('/stats', authenticateToken, AuthController.getUserStats);

/**
 * @route   GET /api/auth/leaderboard
 * @desc    Get leaderboard of users by points
 * @access  Private
 */
router.get('/leaderboard', authenticateToken, AuthController.getLeaderboard);

// Health check for auth routes
/**
 * @route   GET /api/auth/health
 * @desc    Health check for auth service
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;