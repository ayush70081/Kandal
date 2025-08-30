const mongoose = require('mongoose');

const adminActivitySchema = new mongoose.Schema({
  adminId: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['report_approved', 'report_rejected', 'badge_assigned', 'user_updated']
  },
  targetType: {
    type: String,
    required: true,
    enum: ['report', 'user', 'badge']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

adminActivitySchema.index({ timestamp: -1 });

const AdminActivity = mongoose.model('AdminActivity', adminActivitySchema);

module.exports = AdminActivity;


