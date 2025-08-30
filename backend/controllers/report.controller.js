const Report = require('../models/report.model');
const User = require('../models/user.model');
const Badge = require('../models/badge.model');
const Notification = require('../models/notification.model');
const { validationResult } = require('express-validator');
const { deleteUploadedFiles } = require('../middleware/upload.middleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Submit a new report
const submitReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded files if validation fails
      if (req.processedFiles) {
        await deleteUploadedFiles(req.processedFiles.map(f => f.path));
      }
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      title,
      incidentType,
      description,
      severity,
      location
    } = req.body;

    // Parse location coordinates
    const coordinates = JSON.parse(location);

    // Prepare report data
    const reportData = {
      title,
      incidentType,
      description,
      severity,
      location: {
        type: 'Point',
        coordinates: [coordinates.longitude, coordinates.latitude]
      },
      reporter: req.user.id,
      photos: req.processedFiles || []
    };

    // Set priority based on severity
    if (severity === 'critical' || severity === 'high') {
      reportData.priority = severity === 'critical' ? 'urgent' : 'high';
    }

    // Create the report
    const report = new Report(reportData);
    await report.save();

    // Award points to the reporter
    const pointsAwarded = severity === 'critical' ? 50 : severity === 'high' ? 30 : 20;
    await req.user.awardPoints(pointsAwarded, 'Report submission');
    await req.user.incrementReportStats('submitted');

    // Check for reporting badges
    const reportingBadges = await Badge.checkReportingBadges(req.user.id, req.user.stats.reportsSubmitted);
    for (const badge of reportingBadges) {
      await req.user.awardBadge(badge._id);
      await badge.incrementEarnedCount();

      // Create badge notification
      await Notification.createBadgeEarnedNotification(req.user.id, badge._id, badge.name);
    }

    // Check for points badges
    const pointsBadges = await Badge.checkPointsBadges(req.user.id, req.user.points);
    for (const badge of pointsBadges) {
      await req.user.awardBadge(badge._id);
      await badge.incrementEarnedCount();

      // Create badge notification
      await Notification.createBadgeEarnedNotification(req.user.id, badge._id, badge.name);
    }

    // Create notification for report submission
    await Notification.createReportSubmittedNotification(report._id, req.user.id, title);

    // If critical report, notify administrators
    if (severity === 'critical') {
      const admins = await User.find({
        role: { $in: ['government', 'ngo'] },
        'preferences.emailNotifications': true
      });

      if (admins.length > 0) {
        await Notification.createUrgentReportNotification(
          admins.map(admin => admin._id),
          report._id,
          title
        );
      }
    }

    // Populate reporter info for response
    await report.populate('reporter', 'name');

    res.status(201).json({
      message: 'Report submitted successfully',
      report: report,
      pointsAwarded: pointsAwarded
    });

  } catch (error) {
    console.error('Error submitting report:', error);

    // Clean up uploaded files if report creation fails
    if (req.processedFiles) {
      await deleteUploadedFiles(req.processedFiles.map(f => f.path));
    }

    res.status(500).json({
      error: 'Failed to submit report',
      message: error.message
    });
  }
};

// New function to analyze image
const analyzeImage = async (req, res) => {
    console.log('Analyze image called');
    console.log('Request file:', req.file);
    console.log('Request headers:', req.headers);
    
    if (!req.file) {
        console.log('No file provided');
        return res.status(400).json({ error: 'No image file provided.' });
    }

    console.log('File received:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer ? 'Buffer present' : 'No buffer'
    });

    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not found in environment variables');
            return res.status(500).json({ error: 'API key not configured.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
Analyze the image provided.

First, determine if the image is of a mangrove forest or a coastal environment where mangroves grow.

If it is, then check for any of the following threats:
- Cut down or felled trees
- Fire or smoke indicating burning trees
- Oil spillage in the water
- Waste or garbage dumping
- Any other visible signs of damage or destruction.

If a threat is detected, describe the threat and estimate its approximate severity (e.g., low, medium, high). For example: "Threat detected: A few cut trees are visible. Approximate threat level: Low." or "Threat detected: A large area of the forest is on fire. Approximate threat level: High."

If no threat is detected but it is a mangrove, identify the species and provide a short, 5-line summary including:
- Species name
- Key benefits
- Common threats
- Main locations where it is found.

If the image is not of a mangrove environment, respond with: 'The uploaded image does not appear to be a mangrove area. Please upload photos of potential threats to mangrove forests.'
`;

        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype,
            },
        };

        console.log('Calling Gemini API...');
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        console.log('Analysis completed successfully');
        res.json({ analysis: text });
    } catch (error) {
        console.error('Error analyzing image:', error);
        res.status(500).json({ error: 'Failed to analyze image.' });
    }
};

// Get reports with filtering and pagination
const getReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      incidentType,
      severity,
      status,
      reporterId,
      lat,
      lng,
      radius,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (incidentType) filter.incidentType = incidentType;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (reporterId) filter.reporter = reporterId;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Geospatial filter
    let query = Report.find(filter);

    if (lat && lng && radius) {
      const longitude = parseFloat(lng);
      const latitude = parseFloat(lat);
      const radiusInMeters = parseFloat(radius) * 1000; // Convert km to meters

      query = Report.find({
        ...filter,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: radiusInMeters
          }
        }
      });
    }

    // Sorting
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await query
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reporter', 'name location.city')
      .populate('validatedBy', 'name')
      .select('-comments'); // Exclude comments from list view

    // Get total count for pagination
    const total = await Report.countDocuments(filter);

    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      error: 'Failed to fetch reports',
      message: error.message
    });
  }
};

// Get a single report by ID
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id)
      .populate('reporter', 'name location points stats')
      .populate('validatedBy', 'name')
      .populate('comments.user', 'name')
      .populate('upvotes.user', 'name');

    if (!report) {
      return res.status(404).json({
        error: 'Report not found'
      });
    }

    // Increment view count (but not for the reporter)
    if (!report.reporter._id.equals(req.user.id)) {
      await report.incrementViewCount();
    }

    res.json(report);

  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      error: 'Failed to fetch report',
      message: error.message
    });
  }
};

// Validate/update report status
const validateReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { status, validationNotes } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        error: 'Report not found'
      });
    }

    // Update report status
    await report.updateStatus(status, req.user.id, validationNotes);

    // Award points to validator
    const validationPoints = status === 'verified' ? 15 : 5;
    await req.user.awardPoints(validationPoints, 'Report validation');
    await req.user.incrementReportStats('validated');

    // Award bonus points to reporter if verified
    if (status === 'verified') {
      const reporter = await User.findById(report.reporter);
      if (reporter) {
        await reporter.awardPoints(10, 'Report verified');
      }
    }

    // Create notification for reporter
    await Notification.create({
      recipient: report.reporter,
      type: 'report_status_changed',
      title: 'Report Status Updated',
      message: `Your report "${report.title}" has been ${status}.`,
      relatedReport: report._id,
      priority: 'normal',
      channel: ['in_app', 'email']
    });

    // Populate updated report
    await report.populate('validatedBy', 'name');

    res.json({
      message: 'Report status updated successfully',
      report: report
    });

  } catch (error) {
    console.error('Error validating report:', error);
    res.status(500).json({
      error: 'Failed to validate report',
      message: error.message
    });
  }
};

// Add comment to report
const addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { text } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        error: 'Report not found'
      });
    }

    await report.addComment(req.user.id, text);

    // Award points for commenting
    await req.user.awardPoints(2, 'Comment added');

    // Create notification for report owner (if not commenting on own report)
    if (!report.reporter.equals(req.user.id)) {
      await Notification.create({
        recipient: report.reporter,
        type: 'comment_added',
        title: 'New Comment on Your Report',
        message: `${req.user.name} commented on your report "${report.title}".`,
        relatedReport: report._id,
        relatedUser: req.user.id,
        priority: 'normal',
        channel: ['in_app']
      });
    }

    // Populate the new comment
    await report.populate('comments.user', 'name');
    const newComment = report.comments[report.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      error: 'Failed to add comment',
      message: error.message
    });
  }
};

// Upvote/downvote report
const toggleUpvote = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        error: 'Report not found'
      });
    }

    // Check if user already upvoted
    const hasUpvoted = report.upvotes.some(upvote => upvote.user.equals(req.user.id));

    if (hasUpvoted) {
      await report.removeUpvote(req.user.id);
      res.json({
        message: 'Upvote removed',
        upvoted: false,
        upvoteCount: report.upvotes.length
      });
    } else {
      await report.addUpvote(req.user.id);

      // Award points for upvoting
      await req.user.awardPoints(1, 'Upvote given');

      // Create notification for report owner (if not upvoting own report)
      if (!report.reporter.equals(req.user.id)) {
        await Notification.create({
          recipient: report.reporter,
          type: 'upvote_received',
          title: 'Your Report Received an Upvote',
          message: `${req.user.name} upvoted your report "${report.title}".`,
          relatedReport: report._id,
          relatedUser: req.user.id,
          priority: 'low',
          channel: ['in_app']
        });
      }

      res.json({
        message: 'Report upvoted',
        upvoted: true,
        upvoteCount: report.upvotes.length
      });
    }

  } catch (error) {
    console.error('Error toggling upvote:', error);
    res.status(500).json({
      error: 'Failed to toggle upvote',
      message: error.message
    });
  }
};

// Get reports statistics
const getReportStats = async (req, res) => {
  try {
    const [typeStats, statusStats, recentReports] = await Promise.all([
      Report.getStatsByType(),
      Report.getStatsByStatus(),
      Report.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title incidentType severity createdAt')
        .populate('reporter', 'name role')
    ]);

    // Get total counts
    const totalReports = await Report.countDocuments();
    const criticalReports = await Report.countDocuments({ severity: 'critical' });
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    res.json({
      totalReports,
      criticalReports,
      pendingReports,
      typeStats,
      statusStats,
      recentReports
    });

  } catch (error) {
    console.error('Error fetching report stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
};

// Get nearby reports
const getNearbyReports = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Latitude and longitude are required'
      });
    }

    const reports = await Report.findNearby(
      parseFloat(lng),
      parseFloat(lat),
      parseFloat(radius) * 1000 // Convert km to meters
    )
    .select('title incidentType severity location createdAt')
    .populate('reporter', 'name role')
    .limit(50);

    res.json(reports);

  } catch (error) {
    console.error('Error fetching nearby reports:', error);
    res.status(500).json({
      error: 'Failed to fetch nearby reports',
      message: error.message
    });
  }
};

module.exports = {
  submitReport,
  getReports,
  getReportById,
  validateReport,
  addComment,
  toggleUpvote,
  getReportStats,
  getNearbyReports,
  analyzeImage
};