const express = require('express');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// Static admin credentials (env overrides for production)
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@robo.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

/**
 * @route   POST /api/admin/login
 * @desc    Static admin login - returns JWT for admin panel API calls
 * @body    { email, password }
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    if (normalizedEmail !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Find or create admin user so we can issue a valid JWT (backend auth expects User)
    let user = await User.findOne({ email: normalizedEmail }).select('-password');
    if (!user) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
      user = await User.create({
        phoneNumber: '+966500000000',
        email: normalizedEmail,
        password: hashedPassword,
        fullName: 'Admin',
        isPhoneVerified: true,
        isEmailVerified: true
      });
      user = await User.findById(user._id).select('-password');
    }

    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      data: {
        token,
        user: { id: user._id, email: user.email, fullName: user.fullName }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Admin login failed'
    });
  }
});

module.exports = router;
