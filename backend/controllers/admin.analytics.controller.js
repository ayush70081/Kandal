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
      // Get current week's Monday to Sunday
      const now = new Date();
      console.log('Current date:', now.toISOString());
      
      // Calculate Monday of current week
      const monday = new Date(now);
      const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days to subtract to get Monday
      monday.setDate(now.getDate() - daysToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6); // Sunday of current week
      sunday.setHours(23, 59, 59, 999);

      console.log('Monday of current week:', monday.toISOString());
      console.log('Sunday of current week:', sunday.toISOString());

      // First, let's check if there are any reports at all
      const totalReports = await Report.countDocuments();
      console.log('Total reports in database:', totalReports);

      const daily = await Report.aggregate([
        {
          $match: {
            createdAt: { $gte: monday, $lte: sunday }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            dayOfWeek: { $first: { $dayOfWeek: '$createdAt' } }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // If no reports in current week, try to get reports from the last 30 days
      if (daily.length === 0 && totalReports > 0) {
        console.log('No reports in current week, checking last 30 days');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        
        const recentReports = await Report.aggregate([
          {
            $match: {
              createdAt: { $gte: thirtyDaysAgo, $lte: now }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
              dayOfWeek: { $first: { $dayOfWeek: '$createdAt' } }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        
        console.log('Recent reports (last 30 days):', recentReports);
      }

      console.log('Daily aggregation results:', daily);

      // Create array for all days of the week (Monday to Sunday)
      // MongoDB dayOfWeek: 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday, 7=Saturday
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayOfWeekMapping = [2, 3, 4, 5, 6, 7, 1]; // Monday=2, Tuesday=3, ..., Sunday=1

      let weeklyData = dayNames.map((dayName, index) => {
        const mongoDayOfWeek = dayOfWeekMapping[index];
        const dayData = daily.find(d => d.dayOfWeek === mongoDayOfWeek);
        return {
          day: dayName,
          count: dayData ? Math.max(0, dayData.count) : 0, // Ensure count is never negative
          date: dayData ? dayData._id : null
        };
      });

      // If no data in current week, show sample data for demonstration
      if (daily.length === 0) {
        console.log('No reports in current week, showing sample data');
        weeklyData = dayNames.map((dayName, index) => ({
          day: dayName,
          count: Math.floor(Math.random() * 5) + 1, // Random 1-5 reports per day
          date: null,
          isSample: true
        }));
      }

      console.log('Final weekly data being sent:', weeklyData);
      return res.json({ success: true, data: { weekly: weeklyData } });
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


