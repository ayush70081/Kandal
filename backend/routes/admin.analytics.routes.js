const express = require('express');
const { authenticateAdminToken } = require('../middleware/admin.middleware');
const AdminAnalyticsController = require('../controllers/admin.analytics.controller');

const router = express.Router();

router.use(authenticateAdminToken);

router.get('/overview', AdminAnalyticsController.overview);
router.get('/reports', AdminAnalyticsController.reports);
router.get('/users', AdminAnalyticsController.users);
router.get('/geographic', AdminAnalyticsController.geographic);

module.exports = router;


