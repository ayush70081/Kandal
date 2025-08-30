const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Badge name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Badge name must be less than 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Badge description is required'],
    trim: true,
    maxlength: [500, 'Badge description must be less than 500 characters']
  },
  
  icon: {
    type: String,
    required: [true, 'Badge icon is required'],
    trim: true
  },
  
  category: {
    type: String,
    required: [true, 'Badge category is required'],
    enum: {
      values: [
        'reporting',      // For submitting reports
        'validation',     // For validating reports
        'participation',  // For community participation
        'expertise',      // For specialized knowledge
        'achievement',    // For milestones
        'leadership'      // For community leadership
      ],
      message: 'Please select a valid badge category'
    }
  },
  
  type: {
    type: String,
    required: [true, 'Badge type is required'],
    enum: {
      values: ['bronze', 'silver', 'gold', 'platinum', 'special'],
      message: 'Badge type must be one of: bronze, silver, gold, platinum, special'
    }
  },
  
  criteria: {
    type: {
      type: String,
      required: true,
      enum: [
        'report_count',     // Based on number of reports
        'validation_count', // Based on number of validations
        'points_total',     // Based on total points
        'consecutive_days', // Based on consecutive activity
        'special_action'    // Based on special actions
      ]
    },
    threshold: {
      type: Number,
      required: true,
      min: [1, 'Threshold must be at least 1']
    },
    timeframe: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'all_time'],
      default: 'all_time'
    }
  },
  
  points: {
    type: Number,
    required: [true, 'Badge points value is required'],
    min: [0, 'Badge points cannot be negative'],
    default: 0
  },
  
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Statistics
  stats: {
    timesEarned: {
      type: Number,
      default: 0
    },
    lastEarned: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Instance methods
badgeSchema.methods.incrementEarnedCount = function() {
  this.stats.timesEarned += 1;
  this.stats.lastEarned = new Date();
  return this.save();
};

// Static methods for checking badge criteria
badgeSchema.statics.checkReportingBadges = async function(userId, reportCount) {
  const reportingBadges = await this.find({
    'criteria.type': 'report_count',
    'criteria.threshold': { $lte: reportCount },
    isActive: true
  }).sort({ 'criteria.threshold': -1 });
  
  return reportingBadges;
};

badgeSchema.statics.checkPointsBadges = async function(userId, totalPoints) {
  const pointsBadges = await this.find({
    'criteria.type': 'points_total',
    'criteria.threshold': { $lte: totalPoints },
    isActive: true
  }).sort({ 'criteria.threshold': -1 });
  
  return pointsBadges;
};

const Badge = mongoose.model('Badge', badgeSchema);

module.exports = Badge;