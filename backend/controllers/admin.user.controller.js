const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const Badge = require('../models/badge.model');
const Notification = require('../models/notification.model');
const AdminActivity = require('../models/adminActivity.model');

class AdminUserController {
  static async listUsers(req, res) {
    try {
      const { page = 1, limit = 20, q } = req.query;
      const filter = {};
      if (q) {
        filter.$or = [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [users, total] = await Promise.all([
        User.find(filter)
          .select('name email points stats badges createdAt')
          .skip(skip)
          .limit(parseInt(limit))
          .populate('badges.badgeId', 'name icon type'),
        User.countDocuments(filter)
      ]);

      return res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to list users' });
    }
  }

  static async leaderboard(req, res) {
    try {
      const { limit = 50 } = req.query;
      const users = await User.find({ isActive: true })
        .select('name email points createdAt')
        .sort({ points: -1, createdAt: 1 })
        .limit(parseInt(limit));

      const withRank = users.map((u, index) => ({ ...u.toJSON(), rank: index + 1 }));

      return res.json({ success: true, data: { leaderboard: withRank, total: withRank.length } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to load leaderboard' });
    }
  }

  static async getUser(req, res) {
    try {
      const user = await User.findById(req.params.id)
        .select('-refreshTokens')
        .populate('badges.badgeId', 'name icon type');
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      return res.json({ success: true, data: { user } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
  }

  static async awardPoints(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }

      const { points, reason } = req.body;
      if (typeof points !== 'number' || !Number.isFinite(points)) {
        return res.status(400).json({ success: false, message: 'Points must be a number' });
      }

      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      // Award points
      await user.awardPoints(points, reason || 'Admin awarded points');

      // Check for points-based badges and award any newly qualified
      const pointsBadges = await Badge.checkPointsBadges(user._id, user.points);
      const newlyAwarded = [];
      for (const badge of pointsBadges) {
        const hadBadge = user.badges?.some(b => b.badgeId && b.badgeId.equals(badge._id));
        await user.awardBadge(badge._id);
        if (!hadBadge) {
          await badge.incrementEarnedCount();
          await Notification.createBadgeEarnedNotification(user._id, badge._id, badge.name);
          newlyAwarded.push({ id: badge._id, name: badge.name });
        }
      }

      // Create points notification
      await Notification.create({
        recipient: user._id,
        type: 'points_awarded',
        title: 'Points Awarded',
        message: `${points} points were awarded by an administrator${reason ? `: ${reason}` : ''}.`,
        priority: 'normal',
        channel: ['in_app']
      });

      // Log admin activity
      await AdminActivity.create({
        adminId: req.admin.email,
        action: 'user_updated',
        targetType: 'user',
        targetId: user._id,
        details: { pointsAwarded: points, reason, badgesAwarded: newlyAwarded }
      });

      await user.populate('badges.badgeId', 'name icon type');

      return res.json({ success: true, message: 'Points awarded successfully', data: { user, newlyAwarded } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to award points' });
    }
  }

  static async listBadges(req, res) {
    return res.status(410).json({ success: false, message: 'Badge management has been removed; badges are auto-derived from points.' });
  }

  static async createBadge(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }

      const badge = await Badge.create(req.body);
      return res.status(201).json({ success: true, message: 'Badge created', data: { badge } });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ success: false, message: 'Badge name already exists' });
      }
      return res.status(500).json({ success: false, message: 'Failed to create badge' });
    }
  }
}

module.exports = AdminUserController;


