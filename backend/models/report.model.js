const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Basic incident information
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
    maxlength: [200, 'Title must be less than 200 characters']
  },
  
  incidentType: {
    type: String,
    required: [true, 'Incident type is required'],
    enum: {
      values: [
        'illegal_cutting',
        'dumping',
        'pollution',
        'land_reclamation',
        'wildlife_disturbance',
        'erosion',
        'oil_spill',
        'construction',
        'other'
      ],
      message: 'Please select a valid incident type'
    }
  },
  
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description must be less than 2000 characters']
  },
  
  severity: {
    type: String,
    required: [true, 'Severity level is required'],
    enum: {
      values: ['low', 'medium', 'high', 'critical'],
      message: 'Severity must be one of: low, medium, high, critical'
    },
    default: 'medium'
  },
  
  // Location information
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Location coordinates are required'],
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates format. Use [longitude, latitude]'
      }
    }
  },
  

  
  // Photo evidence
  photos: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    metadata: {
      takenAt: Date,
      gpsCoordinates: {
        latitude: Number,
        longitude: Number
      },
      deviceInfo: {
        make: String,
        model: String
      }
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Reporter information
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter information is required']
  },
  
  // Report status and validation
  status: {
    type: String,
    enum: {
      values: ['pending', 'under_review', 'verified', 'false_positive', 'resolved'],
      message: 'Status must be one of: pending, under_review, verified, false_positive, resolved'
    },
    default: 'pending'
  },
  
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Validation and review
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  validatedAt: Date,
  
  validationNotes: {
    type: String,
    maxlength: [1000, 'Validation notes must be less than 1000 characters']
  },
  
  // AI validation results
  aiValidation: {
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    detectedFeatures: [String],
    anomalyScore: {
      type: Number,
      min: 0,
      max: 1
    },
    processedAt: Date
  },
  
  // Follow-up actions
  actions: [{
    type: {
      type: String,
      enum: ['investigation', 'cleanup', 'enforcement', 'monitoring', 'restoration'],
      required: true
    },
    description: {
      type: String,
      required: true,
      maxlength: [500, 'Action description must be less than 500 characters']
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    completedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Additional metadata
  
  isPublic: {
    type: Boolean,
    default: true
  },
  
  viewCount: {
    type: Number,
    default: 0
  },
  
  upvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Comments and updates
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment must be less than 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create geospatial index for location-based queries
reportSchema.index({ location: '2dsphere' });

// Create compound indexes for common queries
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ incidentType: 1, severity: 1 });
reportSchema.index({ reporter: 1, createdAt: -1 });

// Virtual for calculating distance (requires geoNear aggregation)
reportSchema.virtual('upvoteCount').get(function() {
  return this.upvotes ? this.upvotes.length : 0;
});

reportSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Instance methods
reportSchema.methods.addComment = function(userId, text) {
  this.comments.push({
    user: userId,
    text: text
  });
  return this.save();
};

reportSchema.methods.addUpvote = function(userId) {
  // Check if user already upvoted
  const hasUpvoted = this.upvotes.some(upvote => upvote.user.equals(userId));
  
  if (!hasUpvoted) {
    this.upvotes.push({ user: userId });
    return this.save();
  }
  
  return Promise.resolve(this);
};

reportSchema.methods.removeUpvote = function(userId) {
  this.upvotes = this.upvotes.filter(upvote => !upvote.user.equals(userId));
  return this.save();
};

reportSchema.methods.updateStatus = function(newStatus, validatorId = null, notes = '') {
  this.status = newStatus;
  
  if (validatorId) {
    this.validatedBy = validatorId;
    this.validatedAt = new Date();
    this.validationNotes = notes;
  }
  
  return this.save();
};

reportSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

reportSchema.methods.addAction = function(actionData) {
  this.actions.push(actionData);
  return this.save();
};

// Static methods
reportSchema.statics.findNearby = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    }
  });
};

reportSchema.statics.getStatsByType = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$incidentType',
        count: { $sum: 1 },
        averageSeverity: { $avg: { $cond: [
          { $eq: ['$severity', 'low'] }, 1,
          { $cond: [
            { $eq: ['$severity', 'medium'] }, 2,
            { $cond: [
              { $eq: ['$severity', 'high'] }, 3,
              4
            ]}
          ]}
        ]}}
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

reportSchema.statics.getStatsByStatus = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;