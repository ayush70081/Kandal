const express = require('express');
const { body } = require('express-validator');
const { authenticateAdminToken } = require('../middleware/admin.middleware');
const adminReportsRoutes = require('./admin.reports.routes');
const adminUsersRoutes = require('./admin.users.routes');
const adminBadgesRoutes = require('./admin.badges.routes');
const adminAnalyticsRoutes = require('./admin.analytics.routes');
const AdminController = require('../controllers/admin.controller');
const AdminUserController = require('../controllers/admin.user.controller');

const router = express.Router();

// Validation
const adminLoginValidation = [
  body('identifier')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Public - Admin login
router.post('/login', adminLoginValidation, AdminController.login);

// Verify admin token
router.get('/verify', authenticateAdminToken, AdminController.verify);

// Health
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Admin service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Simple admin leaderboard alias
router.get('/leaderboard', authenticateAdminToken, AdminUserController.leaderboard);

module.exports = router;

// Mount nested routers after export for clarity in server
router.use('/reports', adminReportsRoutes);
router.use('/users', adminUsersRoutes);
router.use('/badges', adminBadgesRoutes);
router.use('/analytics', adminAnalyticsRoutes);


