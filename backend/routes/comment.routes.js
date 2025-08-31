const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth.middleware');
const { addComment, getComments, deleteComment } = require('../controllers/comment.controller');

// Validation middleware
const commentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
];

// Add comment to a report
router.post('/reports/:reportId/comments', authenticateToken, commentValidation, addComment);

// Get comments for a report
router.get('/reports/:reportId/comments', authenticateToken, getComments);

// Delete a comment
router.delete('/comments/:commentId', authenticateToken, deleteComment);

module.exports = router;
