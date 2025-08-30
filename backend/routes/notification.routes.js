const express = require('express');
const { param, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification
} = require('../controllers/notification.controller');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Validation for MongoDB ObjectId parameters
const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notification ID')
];

// Get user notifications
router.get('/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
    
    query('unreadOnly')
      .optional()
      .isBoolean()
      .withMessage('UnreadOnly must be a boolean')
  ],
  getUserNotifications
);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark notification as read
router.put('/:id/read', mongoIdValidation, markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Delete notification
router.delete('/:id', mongoIdValidation, deleteNotification);

module.exports = router;