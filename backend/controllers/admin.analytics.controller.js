const Report = require('../models/report.model');
const User = require('../models/user.model');

class AdminAnalyticsController {
  static async overview(req, res) {
    try {
      const [totalReports, usersCount, statusStats, typeStats, processing] = await Promise.all([
        Report.countDocuments(),
        User.countDocuments({ isActive: true }),
        Report.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Report.aggregate([{ $group: { _id: '$incidentType', count: { $sum: 1 } } }]),
        Report.aggregate([
          { $match: { validatedAt: { $exists: true } } },
          { $group: { _id: '$status', avgProcessingMs: { $avg: { $subtract: ['$validatedAt', '$createdAt'] } }, count: { $sum: 1 } } }
        ])
      ]);

      const serverUptimeSec = process.uptime();

      return res.json({ success: true, data: { totalReports, usersCount, statusStats, typeStats, processing, serverUptimeSec } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to load overview analytics' });
    }
  }

  static async reports(req, res) {
    try {
      const monthly = await Report.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      return res.json({ success: true, data: { monthly } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to load report analytics' });
    }
  }

  static async users(req, res) {
    try {
      const contribution = await User.aggregate([
        { $group: { _id: '$stats.contributionLevel', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      return res.json({ success: true, data: { contribution } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to load user analytics' });
    }
  }

  static async geographic(req, res) {
    try {
      const byTypeAndSeverity = await Report.aggregate([
        { $group: { _id: { type: '$incidentType', severity: '$severity' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      return res.json({ success: true, data: { byTypeAndSeverity } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to load geographic analytics' });
    }
  }
}

module.exports = AdminAnalyticsController;


