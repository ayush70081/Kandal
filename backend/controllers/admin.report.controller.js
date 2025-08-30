const { validationResult } = require('express-validator');
const Report = require('../models/report.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const AdminActivity = require('../models/adminActivity.model');

class AdminReportController {
  static async list(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        reporter,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filter = {};
      if (status) filter.status = status;
      if (reporter) filter.reporter = reporter;
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortObj = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [reports, total] = await Promise.all([
        Report.find(filter)
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit))
          .populate('reporter', 'name email')
          .populate('validatedBy', 'name'),
        Report.countDocuments(filter)
      ]);

      return res.json({
        success: true,
        data: {
          reports,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to list reports' });
    }
  }

  static async details(req, res) {
    try {
      const report = await Report.findById(req.params.id)
        .populate('reporter', 'name email location')
        .populate('validatedBy', 'name');

      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      return res.json({ success: true, data: { report } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch report' });
    }
  }

  static async approve(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }

      const { notes } = req.body;
      const report = await Report.findById(req.params.id);
      if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

      await report.approveByAdmin(req.admin.email, notes);

      // Notify submitter
      await Notification.create({
        recipient: report.reporter,
        type: 'report_status_changed',
        title: 'Report Approved',
        message: `Your report "${report.title}" has been approved and published.`,
        relatedReport: report._id,
        priority: 'normal',
        channel: ['in_app', 'email']
      });

      // Log admin action
      await AdminActivity.create({
        adminId: req.admin.email,
        action: 'report_approved',
        targetType: 'report',
        targetId: report._id,
        details: { notes }
      });

      await report.populate('reporter', 'name');

      return res.json({ success: true, message: 'Report approved', data: { report } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to approve report' });
    }
  }

  static async reject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }

      const { notes } = req.body;
      const report = await Report.findById(req.params.id);
      if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

      await report.rejectByAdmin(req.admin.email, notes);

      // Notify submitter
      await Notification.create({
        recipient: report.reporter,
        type: 'report_status_changed',
        title: 'Report Rejected',
        message: `Your report "${report.title}" was rejected by the admin.`,
        relatedReport: report._id,
        priority: 'normal',
        channel: ['in_app', 'email']
      });

      // Log admin action
      await AdminActivity.create({
        adminId: req.admin.email,
        action: 'report_rejected',
        targetType: 'report',
        targetId: report._id,
        details: { notes }
      });

      await report.populate('reporter', 'name');

      return res.json({ success: true, message: 'Report rejected', data: { report } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to reject report' });
    }
  }
}

module.exports = AdminReportController;


