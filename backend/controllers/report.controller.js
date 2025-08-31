const Report = require('../models/report.model');
const User = require('../models/user.model');
const Badge = require('../models/badge.model');
const Notification = require('../models/notification.model');
const ReportEvaluation = require('../models/reportEvaluation.model');
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
Analyze the image provided and respond in the following JSON format:

{
  "isMangrove": true/false,
  "analysis": "your detailed analysis here"
}

First, determine if the image is of a mangrove forest or a coastal environment where mangroves grow. Set "isMangrove" to true if it contains mangroves, false otherwise.

If isMangrove is true, then check for any of the following threats in your analysis:
- Cut down or felled trees
- Fire or smoke indicating burning trees
- Oil spillage in the water
- Waste or garbage dumping
- Any other visible signs of damage or destruction.

If a threat is detected, describe the threat and estimate its approximate severity (e.g., low, medium, high). For example: "Threat detected: A few cut trees are visible. Approximate threat level: Low."

If no threat is detected but it is a mangrove, identify the species and provide a short summary including species name, key benefits, common threats, and main locations.

If isMangrove is false, set the analysis to: "The uploaded image does not appear to be a mangrove area. Please upload photos of potential threats to mangrove forests."

Always respond with valid JSON format.
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
        
        // Parse JSON response from Gemini
        try {
            // Clean the response text by removing markdown code blocks
            let cleanText = text.trim();
            
            // Remove markdown code block markers if present
            if (cleanText.startsWith('```json')) {
                cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            const analysisData = JSON.parse(cleanText);
            res.json({ 
                analysis: analysisData.analysis,
                isMangrove: analysisData.isMangrove 
            });
        } catch (parseError) {
            console.error('Failed to parse Gemini response as JSON:', parseError);
            console.log('Raw response:', text);
            
            // Fallback: treat as plain text and check for mangrove keywords
            const isMangrove = !text.toLowerCase().includes('does not appear to be a mangrove');
            res.json({ 
                analysis: text,
                isMangrove: isMangrove 
            });
        }
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
    const { content } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        error: 'Report not found'
      });
    }

    await report.addComment(req.user.id, content);

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

// Upvote a report
const upvoteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Check if user already upvoted
    const hasUpvoted = report.upvotes.some(upvote => upvote.user.toString() === userId);
    
    if (hasUpvoted) {
      // Remove upvote (toggle functionality)
      report.upvotes = report.upvotes.filter(upvote => upvote.user.toString() !== userId);
      await report.save();
      
      return res.json({ 
        success: true, 
        message: 'Upvote removed',
        upvoteCount: report.upvotes.length,
        hasUpvoted: false
      });
    }

    // Add upvote
    report.upvotes.push({ user: userId });
    await report.save();

    res.json({ 
      success: true, 
      message: 'Report upvoted successfully',
      upvoteCount: report.upvotes.length,
      hasUpvoted: true
    });
  } catch (error) {
    console.error('Error upvoting report:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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

const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const userId = req.user.id;
    const Comment = require('../models/comment.model');
    
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reports = await Report.find({ status: { $ne: 'rejected' } })
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reporter', 'name')
      .select('title description incidentType severity location createdAt photos upvotes status')
      .lean();
    
    // Get comment counts for all reports
    const reportIds = reports.map(report => report._id);
    const commentCounts = await Comment.aggregate([
      { $match: { reportId: { $in: reportIds } } },
      { $group: { _id: '$reportId', count: { $sum: 1 } } }
    ]);
    
    // Create a map for quick lookup
    const commentCountMap = {};
    commentCounts.forEach(item => {
      commentCountMap[item._id.toString()] = item.count;
    });
    
    const reportsWithCounts = reports.map(report => ({
      ...report,
      upvoteCount: report.upvotes ? report.upvotes.length : 0,
      hasUpvoted: report.upvotes ? report.upvotes.some(upvote => upvote.user.toString() === userId) : false,
      commentCount: commentCountMap[report._id.toString()] || 0
    }));
    
    const total = await Report.countDocuments({ status: { $ne: 'rejected' } });
    
    res.json({
      success: true,
      reports: reportsWithCounts,
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
      success: false,
      error: 'Failed to fetch reports'
    });
  }
};

// Get reports for evaluation (verified/resolved)
const getReportsForEvaluation = async (req, res) => {
  try {
    const reports = await Report.find({ 
      status: { $in: ['verified', 'resolved'] } 
    })
    .populate('reporter', 'name')
    .sort({ createdAt: -1 })
    .lean();

    // Check which reports already have evaluations
    const reportIds = reports.map(r => r._id);
    const evaluations = await ReportEvaluation.find({ 
      reportId: { $in: reportIds } 
    }).select('reportId');
    
    const evaluatedReportIds = new Set(evaluations.map(e => e.reportId.toString()));
    
    const reportsWithEvaluationStatus = reports.map(report => ({
      ...report,
      evaluationCompleted: evaluatedReportIds.has(report._id.toString())
    }));

    res.json({
      success: true,
      reports: reportsWithEvaluationStatus
    });
  } catch (error) {
    console.error('Error fetching reports for evaluation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports for evaluation'
    });
  }
};

// Generate loss estimation using Gemini API
const generateLossEstimation = async (req, res) => {
  try {
    const { reportId, incidentType, metadata } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create incident-specific prompts
    const incidentPrompts = {
      illegal_cutting: `
Based on the following data about illegal mangrove tree cutting:
- Trees cut: ${metadata.treesCount || 0} trees
- Area affected: ${metadata.areaAffected || 0} hectares
- Biomass loss: ${metadata.biomassLoss || 0} tons
- Average tree age: ${metadata.treeAge || 0} years

Provide COMPLETE numerical estimates for ALL categories. Do not leave any section empty. Include specific numbers for:

1. Carbon Sequestration Loss: Calculate both low and high estimates in tons CO2
2. Biodiversity Impact: Estimate number of species affected and habitat loss percentage
3. Economic Value Lost: Provide dollar amounts for timber value and ecosystem services
4. Coastal Protection Impact: Estimate storm surge protection loss in meters/percentage
5. Recovery Time Estimation: Provide specific years for full ecosystem recovery
6. Long-Term Ecological Consequences: Quantify cascading effects with numbers

Format each section with specific numerical values, not just descriptions.`,

      dumping: `
Based on the following waste dumping incident data:
- Waste volume: ${metadata.wasteVolume || 0} cubic meters
- Waste type: ${metadata.wasteType || 'Unknown'}
- Area contaminated: ${metadata.areaContaminated || 0} square meters
- Water body affected: ${metadata.waterBodyAffected ? 'Yes' : 'No'}

Provide COMPLETE numerical estimates for ALL categories:
1. Soil and water contamination impact: Specify contamination levels and affected area in square meters
2. Marine life mortality estimates: Provide specific numbers of fish/organisms affected
3. Cleanup costs and time required: Give exact dollar amounts and months needed
4. Long-term ecosystem damage: Quantify recovery time in years and percentage impact
5. Human health risks: Estimate affected population and health cost in dollars
6. Economic impact on local communities: Provide specific economic losses in dollars

Include specific numerical values for each category.`,

      pollution: `
Based on the pollution incident data:
- Pollutant type: ${metadata.pollutantType || 'Unknown'}
- Concentration level: ${metadata.concentrationLevel || 'Unknown'}
- Area affected: ${metadata.areaAffected || 0} hectares
- Water quality impact: ${metadata.waterQualityImpact || 'Unknown'}

Provide COMPLETE numerical estimates for ALL categories:
1. Water quality degradation impact: Specify pollution levels and affected water volume in liters
2. Marine ecosystem damage: Quantify habitat loss percentage and affected area
3. Fish mortality estimates: Provide specific numbers of fish deaths and species affected
4. Restoration costs and timeline: Give exact dollar amounts and years for recovery
5. Impact on local fishing industry: Calculate economic losses in dollars per year
6. Public health implications: Estimate affected population and healthcare costs

Include specific numerical values for each category.`,

      oil_spill: `
Based on the oil spill data:
- Oil volume spilled: ${metadata.spillVolume || 0} liters
- Area affected: ${metadata.spillArea || 0} square meters
- Oil type: ${metadata.oilType || 'Unknown'}
- Cleanup difficulty: ${metadata.cleanupDifficulty || 'Unknown'}

Provide COMPLETE numerical estimates for ALL categories:
1. Marine life mortality: Specify exact numbers of fish, birds, and mammals affected
2. Mangrove vegetation damage: Quantify trees/area damaged and recovery time in years
3. Cleanup and restoration costs: Provide specific dollar amounts and timeline in months
4. Economic impact on fishing and tourism: Calculate losses in dollars per year
5. Long-term ecosystem recovery time: Give exact years for full recovery
6. Carbon sequestration capacity loss: Specify tons of CO2 capacity lost

Include specific numerical values for each category.`,

      land_reclamation: `
Based on the land reclamation data:
- Area reclaimed: ${metadata.areaReclaimed || 0} hectares
- Mangrove area lost: ${metadata.mangroveAreaLost || 0} hectares
- Sediment volume: ${metadata.sedimentVolume || 0} cubic meters
- Ecosystem disruption level: ${metadata.ecosystemDisruption || 'Unknown'}

Provide COMPLETE numerical estimates for ALL categories:
1. Habitat destruction impact: Specify exact hectares lost and species affected
2. Species displacement and mortality: Provide numbers of animals displaced/killed
3. Carbon storage capacity lost: Calculate tons of CO2 storage permanently lost
4. Coastal protection services lost: Quantify storm protection reduction in percentage
5. Economic value of destroyed ecosystem: Provide dollar value of lost services
6. Irreversible ecological changes: Specify timeline and percentage of permanent damage

Include specific numerical values for each category.`,

      wildlife_disturbance: `
Based on the wildlife disturbance data:
- Species affected: ${metadata.speciesAffected || 0} species
- Animals affected: ${metadata.animalCount || 0} animals
- Habitat area disturbed: ${metadata.habitatArea || 0} hectares
- Disturbance type: ${metadata.disturbanceType || 'Unknown'}

Provide COMPLETE numerical estimates for ALL categories:
1. Breeding disruption impact: Specify number of breeding pairs affected and success rate reduction percentage
2. Migration pattern changes: Quantify animals forced to change routes and distance increase
3. Population decline estimates: Provide specific percentage decline and number of animals affected
4. Habitat abandonment risk: Calculate percentage of habitat likely to be abandoned
5. Ecosystem balance disruption: Quantify food chain impact and species interaction changes
6. Recovery timeline for wildlife populations: Give exact years for population recovery

Include specific numerical values for each category.`
    };

    const prompt = incidentPrompts[incidentType] || `
Analyze the environmental incident with type: ${incidentType}
Metadata: ${JSON.stringify(metadata)}

Provide a comprehensive loss estimation covering environmental, economic, and ecological impacts.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const estimation = response.text();

    res.json({
      success: true,
      estimation: estimation
    });

  } catch (error) {
    console.error('Error generating loss estimation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate loss estimation'
    });
  }
};

// Save evaluation data
const saveReportEvaluation = async (req, res) => {
  try {
    const { reportId, metadata, estimation } = req.body;
    const evaluatedBy = req.user.id;

    // Check if evaluation already exists
    const existingEvaluation = await ReportEvaluation.findOne({ reportId });
    
    if (existingEvaluation) {
      // Update existing evaluation
      existingEvaluation.metadata = metadata;
      existingEvaluation.estimation = estimation;
      existingEvaluation.evaluatedBy = evaluatedBy;
      existingEvaluation.evaluatedAt = new Date();
      await existingEvaluation.save();
    } else {
      // Create new evaluation
      const evaluation = new ReportEvaluation({
        reportId,
        metadata,
        estimation,
        evaluatedBy
      });
      await evaluation.save();
    }

    res.json({
      success: true,
      message: 'Evaluation saved successfully'
    });

  } catch (error) {
    console.error('Error saving evaluation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save evaluation'
    });
  }
};


module.exports = {
  submitReport,
  analyzeImage,
  getReports,
  getAllReports,
  getReportsForEvaluation,
  generateLossEstimation,
  saveReportEvaluation,
  getReportStats,
  getNearbyReports,
  getReportById,
  validateReport,
  addComment,
  upvoteReport
};