const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const db = require('../config/db');
const emailService = require('../services/emailService');

const generateToken = (user) => {
  let permissions = user.permissions;
  if (typeof permissions === 'string') {
    try { permissions = JSON.parse(permissions); } catch { permissions = null; }
  }
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, permissions: permissions || null },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          permissions: (() => {
            let p = user.permissions;
            if (typeof p === 'string') { try { p = JSON.parse(p); } catch { p = null; } }
            return p || null;
          })(),
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { name, email, mobile, password, role } = req.body;

  try {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const allowedRole = role && ['admin', 'staff', 'customer'].includes(role) ? role : 'customer';
    const userId = await User.create({ name, email, mobile, password, role: allowedRole });
    const newUser = await User.findById(userId);
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          mobile: newUser.mobile,
          role: newUser.role,
        },
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, data: user });
  } catch (err) {
    console.error('Profile error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, mobile } = req.body;
  try {
    await User.update(req.user.id, { name, mobile });
    const updated = await User.findById(req.user.id);
    return res.json({ success: true, data: updated, message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findByEmail(req.user.email);
    const isMatch = await User.comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    await User.updatePassword(req.user.id, newPassword);
    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Forgot password — generate OTP
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  try {
    const user = await User.findByEmail(email);
    // Always respond the same to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If this email is registered, an OTP has been sent.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now (UTC)

    // Invalidate old OTPs for this email
    await db.execute('UPDATE password_resets SET used = 1 WHERE email = ?', [email]);

    // Save new OTP
    await db.execute(
      'INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)',
      [email, otp, expiresAt]
    );

    // Send email
    await emailService.sendPasswordResetOTP(email, otp);

    return res.json({ success: true, message: 'If this email is registered, an OTP has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND used = 0 AND expires_at > UTC_TIMESTAMP() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    return res.json({ success: true, message: 'OTP verified successfully.' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND used = 0 AND expires_at > UTC_TIMESTAMP() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Update password
    await User.updatePassword(user.id, newPassword);

    // Mark OTP as used
    await db.execute('UPDATE password_resets SET used = 1 WHERE id = ?', [rows[0].id]);

    return res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
