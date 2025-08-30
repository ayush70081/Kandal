const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth.middleware');
const { upload, processImages, handleUploadError } = require('../middleware/upload.middleware');
const {
  submitReport,
  getReports,
  getReportById,
  validateReport,
  addComment,
  toggleUpvote,
  getReportStats,
  getNearbyReports
} = require('../controllers/report.controller');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Validation rules for report submission
const submitReportValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('incidentType')
    .isIn([
      'illegal_cutting',
      'dumping',
      'pollution',
      'land_reclamation',
      'wildlife_disturbance',
      'erosion',
      'oil_spill',
      'construction',
      'other'
    ])
    .withMessage('Invalid incident type'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  
  body('severity')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  
  body('location')
    .custom((value) => {
      try {
        const coords = JSON.parse(value);
        if (!coords.latitude || !coords.longitude) {
          throw new Error('Location must include latitude and longitude');
        }
        if (coords.latitude < -90 || coords.latitude > 90) {
          throw new Error('Invalid latitude');
        }
        if (coords.longitude < -180 || coords.longitude > 180) {
          throw new Error('Invalid longitude');
        }
        return true;
      } catch (error) {
        throw new Error('Invalid location format');
      }
    }),
  
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),
  
  body('address')
    .optional()
    .custom((value) => {
      if (value) {
        try {
          const addr = JSON.parse(value);
          return true;
        } catch (error) {
          throw new Error('Invalid address format');
        }
      }
      return true;
    })
];

// Validation rules for report validation/status update
const validateReportValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid report ID'),
  
  body('status')
    .isIn(['pending', 'under_review', 'verified', 'false_positive', 'resolved'])
    .withMessage('Invalid status'),
  
  body('validationNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Validation notes must be less than 1000 characters')
];

// Validation rules for adding comments
const addCommentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid report ID'),
  
  body('text')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
];

// Validation for MongoDB ObjectId parameters
const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

// Routes

// Submit a new report
router.post('/submit',
  upload,
  processImages,
  submitReportValidation,
  handleUploadError,
  submitReport
);

// Get reports with filtering and pagination
router.get('/', 
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('incidentType')
      .optional()
      .isIn([
        'illegal_cutting',
        'dumping',
        'pollution',
        'land_reclamation',
        'wildlife_disturbance',
        'erosion',
        'oil_spill',
        'construction',
        'other'
      ])
      .withMessage('Invalid incident type'),
    
    query('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid severity level'),
    
    query('status')
      .optional()
      .isIn(['pending', 'under_review', 'verified', 'false_positive', 'resolved'])
      .withMessage('Invalid status'),
    
    query('lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Invalid latitude'),
    
    query('lng')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Invalid longitude'),
    
    query('radius')
      .optional()
      .isFloat({ min: 0.1, max: 1000 })
      .withMessage('Radius must be between 0.1 and 1000 km'),
    
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'severity', 'status', 'upvoteCount', 'viewCount'])
      .withMessage('Invalid sort field'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ],
  getReports
);

// Get reports statistics
router.get('/stats', getReportStats);

// Get nearby reports
router.get('/nearby',
  [
    query('lat')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Valid latitude is required'),
    
    query('lng')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Valid longitude is required'),
    
    query('radius')
      .optional()
      .isFloat({ min: 0.1, max: 100 })
      .withMessage('Radius must be between 0.1 and 100 km')
  ],
  getNearbyReports
);

// Get a single report by ID
router.get('/:id', mongoIdValidation, getReportById);

// Validate/update report status (admin only)
router.put('/:id/validate', validateReportValidation, validateReport);

// Add comment to report
router.post('/:id/comments', addCommentValidation, addComment);

// Toggle upvote on report
router.post('/:id/upvote', mongoIdValidation, toggleUpvote);

module.exports = router;