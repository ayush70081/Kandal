const { validationResult } = require('express-validator');
const JWTUtils = require('../utils/jwt.utils');

// Hardcoded admin credentials (can be overridden via env)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@900';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrator';

class AdminController {
  /**
   * Admin login - returns admin JWT pair with admin claims
   */
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { identifier, password } = req.body;

      if (identifier !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials'
        });
      }

      const tokens = JWTUtils.generateAdminTokenPair({ email: ADMIN_EMAIL, name: ADMIN_NAME });

      return res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          admin: { email: ADMIN_EMAIL, name: ADMIN_NAME, role: 'admin' },
          tokens
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Admin login failed'
      });
    }
  }

  /**
   * Verify admin token
   */
  static async verify(req, res) {
    return res.json({
      success: true,
      message: 'Admin token is valid',
      data: {
        admin: req.admin,
        tokenInfo: {
          iat: req.tokenPayload.iat,
          exp: req.tokenPayload.exp,
          expiresAt: new Date(req.tokenPayload.exp * 1000)
        }
      }
    });
  }
}

module.exports = AdminController;


