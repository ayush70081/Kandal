const JWTUtils = require('../utils/jwt.utils');

/**
 * Authenticate admin JWT access token
 */
const authenticateAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = JWTUtils.verifyAccessToken(token);

    // Ensure this token is an admin token
    if (decoded.tokenType !== 'admin' || decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    req.admin = {
      email: decoded.adminEmail,
      name: decoded.adminName || 'Administrator'
    };
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or missing admin token'
    });
  }
};

/**
 * Require admin - assumes authenticateAdminToken ran first
 */
const requireAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

module.exports = {
  authenticateAdminToken,
  requireAdmin
};


