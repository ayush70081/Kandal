const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name must be less than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },


  // Location preferences
  location: {
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City name must be less than 100 characters']
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  
  // Gamification fields
  points: {
    type: Number,
    default: 0,
    min: [0, 'Points cannot be negative']
  },
  
  badges: [{
    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge'
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // User preferences
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    publicProfile: {
      type: Boolean,
      default: true
    }
  },
  
  // Statistics
  stats: {
    reportsSubmitted: {
      type: Number,
      default: 0
    },
    reportsValidated: {
      type: Number,
      default: 0
    },
    contributionLevel: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
      default: 'Bronze'
    }
  },

  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days in seconds
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.__v;
      return ret;
    }
  }
});

// Note: Indexes are created automatically based on unique: true in schema definition

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified
  if (!this.isModified('password')) return next();

  try {
    // Hash password with bcrypt
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Add refresh token
userSchema.methods.addRefreshToken = function(token) {
  this.refreshTokens.push({ token });
  return this.save();
};

// Remove refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(
    refreshToken => refreshToken.token !== token
  );
  return this.save();
};

// Remove all refresh tokens (logout from all devices)
userSchema.methods.removeAllRefreshTokens = function() {
  this.refreshTokens = [];
  return this.save();
};

// Check if refresh token exists
userSchema.methods.hasRefreshToken = function(token) {
  return this.refreshTokens.some(refreshToken => refreshToken.token === token);
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Award points to user
userSchema.methods.awardPoints = function(points, reason = 'General contribution') {
  this.points += points;
  
  // Update contribution level based on points
  if (this.points >= 1000) {
    this.stats.contributionLevel = 'Platinum';
  } else if (this.points >= 500) {
    this.stats.contributionLevel = 'Gold';
  } else if (this.points >= 200) {
    this.stats.contributionLevel = 'Silver';
  } else {
    this.stats.contributionLevel = 'Bronze';
  }
  
  return this.save();
};

// Award badge to user
userSchema.methods.awardBadge = function(badgeId) {
  // Check if user already has this badge
  const hasBadge = this.badges.some(badge => badge.badgeId.equals(badgeId));
  
  if (!hasBadge) {
    this.badges.push({ badgeId });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Increment report statistics
userSchema.methods.incrementReportStats = function(type = 'submitted') {
  if (type === 'submitted') {
    this.stats.reportsSubmitted += 1;
  } else if (type === 'validated') {
    this.stats.reportsValidated += 1;
  }
  
  return this.save();
};

// Get user's rank based on points
userSchema.methods.getUserRank = async function() {
  const rank = await this.constructor.countDocuments({
    points: { $gt: this.points }
  });
  
  return rank + 1;
};



// Virtual field for full name (if needed)
userSchema.virtual('displayName').get(function() {
  return this.name;
});

// Virtual field for total contributions
userSchema.virtual('totalContributions').get(function() {
  return this.stats.reportsSubmitted + this.stats.reportsValidated;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

const User = mongoose.model('User', userSchema);

module.exports = User;