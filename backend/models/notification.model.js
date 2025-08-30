const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification recipient is required']
  },
  
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: {
      values: [
        'report_submitted',      // New report submitted
        'report_validated',      // Report was validated
        'report_status_changed', // Report status updated
        'badge_earned',          // User earned a new badge
        'points_awarded',        // Points were awarded
        'comment_added',         // Comment added to report
        'upvote_received',       // Report received upvote
        'action_assigned',       // Action was assigned
        'urgent_report',         // Urgent report needs attention
        'system_announcement',   // System-wide announcement
        'achievement_unlocked'   // Special achievement unlocked
      ],
      message: 'Please select a valid notification type'
    }
  },
  
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Notification title must be less than 200 characters']
  },
  
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [1000, 'Notification message must be less than 1000 characters']
  },
  
  // Related objects
  relatedReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  },
  
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  relatedBadge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge'
  },
  
  // Notification metadata
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  channel: {
    type: [String],
    enum: ['in_app', 'email', 'sms', 'push'],
    default: ['in_app']
  },
  
  // Status tracking
  isRead: {
    type: Boolean,
    default: false
  },
  
  readAt: Date,
  
  // Delivery tracking
  deliveryStatus: {
    inApp: {
      sent: { type: Boolean, default: false },
      sentAt: Date
    },
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      opened: { type: Boolean, default: false },
      openedAt: Date
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      clicked: { type: Boolean, default: false },
      clickedAt: Date
    }
  },
  
  // Auto-deletion settings
  expiresAt: {
    type: Date,
    default: function() {
      // Auto-delete notifications after 30 days
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  
  // Additional data for rich notifications
  data: {
    actionUrl: String,
    imageUrl: String,
    metadata: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes for performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.updateDeliveryStatus = function(channel, status, timestamp = new Date()) {
  if (this.deliveryStatus[channel]) {
    this.deliveryStatus[channel][status] = true;
    this.deliveryStatus[channel][`${status}At`] = timestamp;
    return this.save();
  }
  return Promise.resolve(this);
};

// Static methods
notificationSchema.statics.createNotification = function(data) {
  return this.create(data);
};

notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false
  });
};

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { 
      isRead: true,
      readAt: new Date()
    }
  );
};

notificationSchema.statics.getUserNotifications = function(userId, limit = 20, skip = 0) {
  return this.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('relatedReport', 'title incidentType status')
    .populate('relatedUser', 'name')
    .populate('relatedBadge', 'name icon');
};

// Helper function to create specific notification types
notificationSchema.statics.createReportSubmittedNotification = function(reportId, reporterId, title) {
  return this.create({
    recipient: reporterId,
    type: 'report_submitted',
    title: 'Report Submitted Successfully',
    message: `Your report "${title}" has been submitted and is now under review.`,
    relatedReport: reportId,
    priority: 'normal',
    channel: ['in_app', 'email']
  });
};

notificationSchema.statics.createBadgeEarnedNotification = function(userId, badgeId, badgeName) {
  return this.create({
    recipient: userId,
    type: 'badge_earned',
    title: 'New Badge Earned!',
    message: `Congratulations! You've earned the "${badgeName}" badge.`,
    relatedBadge: badgeId,
    priority: 'normal',
    channel: ['in_app']
  });
};

notificationSchema.statics.createUrgentReportNotification = function(adminUserIds, reportId, reportTitle) {
  const notifications = adminUserIds.map(adminId => ({
    recipient: adminId,
    type: 'urgent_report',
    title: 'Urgent Report Requires Attention',
    message: `A critical incident report "${reportTitle}" requires immediate review.`,
    relatedReport: reportId,
    priority: 'urgent',
    channel: ['in_app', 'email', 'sms']
  }));
  
  return this.insertMany(notifications);
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;