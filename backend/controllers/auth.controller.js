const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const JWTUtils = require('../utils/jwt.utils');

class AuthController {
  /**
   * Register a new user
   */
  static async register(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create new user
      const user = new User({
        email,
        password,
        name
      });

      await user.save();

      // Generate tokens
      const tokens = JWTUtils.generateTokenPair(user);

      // Save refresh token to user
      await user.addRefreshToken(tokens.refreshToken);

      // Update last login
      await user.updateLastLogin();

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.toJSON(),
          tokens
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Login user
   */
  static async login(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { identifier, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email: identifier });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate tokens
      const tokens = JWTUtils.generateTokenPair(user);

      // Save refresh token to user
      await user.addRefreshToken(tokens.refreshToken);

      // Update last login
      await user.updateLastLogin();

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          tokens
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req, res) {
    try {
      const user = req.user;
      const oldRefreshToken = req.refreshToken;

      // Generate new tokens
      const tokens = JWTUtils.generateTokenPair(user);

      // Remove old refresh token and add new one
      await user.removeRefreshToken(oldRefreshToken);
      await user.addRefreshToken(tokens.refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens
        }
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Token refresh failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Logout user (remove refresh token)
   */
  static async logout(req, res) {
    try {
      const user = req.user;
      const refreshToken = req.body.refreshToken;

      if (refreshToken) {
        // Remove specific refresh token
        await user.removeRefreshToken(refreshToken);
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Logout from all devices
   */
  static async logoutAll(req, res) {
    try {
      const user = req.user;

      // Remove all refresh tokens
      await user.removeAllRefreshTokens();

      res.json({
        success: true,
        message: 'Logged out from all devices'
      });
    } catch (error) {
      console.error('Logout all error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout from all devices failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req, res) {
    try {
      const user = req.user;

      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const user = req.user;
      const { name } = req.body;

      // Update allowed fields
      if (name !== undefined) user.name = name;

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Profile update failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Change password
   */
  static async changePassword(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const user = req.user;
      const { currentPassword, newPassword } = req.body;

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Remove all refresh tokens for security
      await user.removeAllRefreshTokens();

      res.json({
        success: true,
        message: 'Password changed successfully. Please login again.'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Password change failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Verify token endpoint
   */
  static async verifyToken(req, res) {
    try {
      const user = req.user;
      const tokenPayload = req.tokenPayload;

      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          user: user.toJSON(),
          tokenInfo: {
            userId: tokenPayload.userId,
            iat: tokenPayload.iat,
            exp: tokenPayload.exp,
            expiresAt: new Date(tokenPayload.exp * 1000)
          }
        }
      });
    } catch (error) {
      console.error('Verify token error:', error);
      res.status(500).json({
        success: false,
        message: 'Token verification failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = AuthController;