const JWTUtils = require('../utils/jwt.utils');
const User = require('../models/user.model');

/**
 * Authentication middleware to verify JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify the access token
    const decoded = JWTUtils.verifyAccessToken(token);
    
    // Find the user
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Attach user to request
    req.user = user;
    req.tokenPayload = decoded;
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    
    // Handle specific JWT errors
    if (error.message.includes('Invalid access token')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token',
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      req.user = null;
      return next();
    }

    // Verify the access token
    const decoded = JWTUtils.verifyAccessToken(token);
    
    // Find the user
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    
    if (user && user.isActive) {
      req.user = user;
      req.tokenPayload = decoded;
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    // Don't fail on optional auth, just set user to null
    req.user = null;
    next();
  }
};

/**
 * Middleware to verify refresh token
 */
const authenticateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify the refresh token
    const decoded = JWTUtils.verifyRefreshToken(refreshToken);
    
    // Find the user and check if refresh token exists
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if refresh token exists in user's refresh tokens
    if (!user.hasRefreshToken(refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Attach user and refresh token to request
    req.user = user;
    req.refreshToken = refreshToken;
    req.tokenPayload = decoded;
    
    next();
  } catch (error) {
    console.error('Refresh token authentication error:', error);
    
    if (error.message.includes('Invalid refresh token')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Refresh token authentication failed'
    });
  }
};

/**
 * Middleware to check if user is admin (can be extended)
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // For now, we don't have admin roles, but this can be extended
  // if (req.user.role !== 'admin') {
  //   return res.status(403).json({
  //     success: false,
  //     message: 'Admin access required'
  //   });
  // }

  next();
};

/**
 * Rate limiting middleware (basic implementation)
 */
const createRateLimiter = (maxRequests = 5, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    }

    const userRequests = requests.get(key) || [];

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    userRequests.push(now);
    requests.set(key, userRequests);

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authenticateRefreshToken,
  requireAdmin,
  createRateLimiter
};