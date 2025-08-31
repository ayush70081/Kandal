const mongoose = require('mongoose');

const reportEvaluationSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true,
    unique: true
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  estimation: {
    type: String,
    required: true
  },
  
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  evaluatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Parsed estimation data for analytics
  estimatedLosses: {
    carbonLoss: Number,
    biodiversityImpact: Number,
    economicLoss: Number,
    ecosystemDamage: Number
  }
}, {
  timestamps: true
});

// Index for efficient queries
reportEvaluationSchema.index({ reportId: 1 });
reportEvaluationSchema.index({ evaluatedBy: 1 });
reportEvaluationSchema.index({ evaluatedAt: -1 });

module.exports = mongoose.model('ReportEvaluation', reportEvaluationSchema);
