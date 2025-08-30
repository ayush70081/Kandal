const jwt = require('jsonwebtoken');

class JWTUtils {
  /**
   * Generate access token
   * @param {Object} payload - User payload
   * @returns {String} Access token
   */
  static generateAccessToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        issuer: 'mangrove-auth',
        audience: 'mangrove-client'
      }
    );
  }

  /**
   * Generate refresh token
   * @param {Object} payload - User payload
   * @returns {String} Refresh token
   */
  static generateRefreshToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: 'mangrove-auth',
        audience: 'mangrove-client'
      }
    );
  }

  /**
   * Generate token pair
   * @param {Object} user - User object
   * @returns {Object} Access and refresh tokens
   */
  static generateTokenPair(user) {
    const payload = {
      userId: user._id,
      email: user.email,
      username: user.username
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
    };
  }

  /**
   * Generate token pair from arbitrary payload (e.g., admin tokens)
   * @param {Object} payload - JWT payload to embed in tokens
   * @returns {Object} Access and refresh tokens
   */
  static generateTokenPairFromPayload(payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
    };
  }

  /**
   * Generate admin token pair with admin role claims
   * @param {Object} adminInfo - { email, name }
   * @returns {Object} Access and refresh tokens with admin claims
   */
  static generateAdminTokenPair(adminInfo = {}) {
    const payload = {
      tokenType: 'admin',
      role: 'admin',
      adminEmail: adminInfo.email || 'admin@gmail.com',
      adminName: adminInfo.name || 'Administrator'
    };

    return this.generateTokenPairFromPayload(payload);
  }

  /**
   * Verify access token
   * @param {String} token - Access token
   * @returns {Object} Decoded payload
   */
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
        issuer: 'mangrove-auth',
        audience: 'mangrove-client'
      });
    } catch (error) {
      throw new Error(`Invalid access token: ${error.message}`);
    }
  }

  /**
   * Verify refresh token
   * @param {String} token - Refresh token
   * @returns {Object} Decoded payload
   */
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        issuer: 'mangrove-auth',
        audience: 'mangrove-client'
      });
    } catch (error) {
      throw new Error(`Invalid refresh token: ${error.message}`);
    }
  }

  /**
   * Decode token without verification
   * @param {String} token - JWT token
   * @returns {Object} Decoded payload
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      throw new Error(`Failed to decode token: ${error.message}`);
    }
  }

  /**
   * Extract token from Bearer header
   * @param {String} authHeader - Authorization header
   * @returns {String|null} Token or null
   */
  static extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Get token expiration time
   * @param {String} token - JWT token
   * @returns {Date|null} Expiration date or null
   */
  static getTokenExpiration(token) {
    try {
      const decoded = this.decodeToken(token);
      return decoded.exp ? new Date(decoded.exp * 1000) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param {String} token - JWT token
   * @returns {Boolean} True if expired
   */
  static isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded.exp) {
        return false;
      }
      return Date.now() >= decoded.exp * 1000;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get time until token expires
   * @param {String} token - JWT token
   * @returns {Number} Milliseconds until expiration
   */
  static getTimeUntilExpiration(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded.exp) {
        return Infinity;
      }
      return (decoded.exp * 1000) - Date.now();
    } catch (error) {
      return 0;
    }
  }
}

module.exports = JWTUtils;