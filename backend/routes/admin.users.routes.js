const express = require('express');
const { param, body, query } = require('express-validator');
const { authenticateAdminToken } = require('../middleware/admin.middleware');
const AdminUserController = require('../controllers/admin.user.controller');

const router = express.Router();

router.use(authenticateAdminToken);

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('q').optional().isString()
], AdminUserController.listUsers);

router.get('/:id', [param('id').isMongoId()], AdminUserController.getUser);

// Award points to a user (admin action)
router.post('/:id/points', [
  param('id').isMongoId(),
  body('points').isNumeric(),
  body('reason').optional().isString().isLength({ max: 200 })
], AdminUserController.awardPoints);

// Leaderboard by points
router.get('/leaderboard/all', AdminUserController.leaderboard);

module.exports = router;


