const express = require('express');
const { param, body, query } = require('express-validator');
const { authenticateAdminToken } = require('../middleware/admin.middleware');
const AdminReportController = require('../controllers/admin.report.controller');

const router = express.Router();

// All routes require admin token
router.use(authenticateAdminToken);

// List reports
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'under_review', 'verified', 'false_positive', 'resolved'])
], AdminReportController.list);

// Get report details
router.get('/:id', [param('id').isMongoId()], AdminReportController.details);

// Approve report
router.put('/:id/approve', [
  param('id').isMongoId(),
  body('notes').optional().isString().isLength({ max: 1000 })
], AdminReportController.approve);

// Reject report
router.put('/:id/reject', [
  param('id').isMongoId(),
  body('notes').optional().isString().isLength({ max: 1000 })
], AdminReportController.reject);

module.exports = router;


