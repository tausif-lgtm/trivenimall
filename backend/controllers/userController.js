const { validationResult } = require('express-validator');
const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const users = await User.findAll(role ? { role } : {});
    return res.json({ success: true, data: users });
  } catch (err) {
    console.error('Get users error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.json({ success: true, data: user });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { name, email, mobile, password, role, specialty, designation, store_id, permissions } = req.body;

  try {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const userId = await User.create({ name, email, mobile, password, role, specialty: specialty || null, designation: designation || null, store_id: store_id || null, permissions: permissions || null });
    const newUser = await User.findById(userId);

    return res.status(201).json({ success: true, data: newUser, message: 'User created successfully.' });
  } catch (err) {
    console.error('Create user error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateUser = async (req, res) => {
  const { name, email, mobile, role, specialty, designation, store_id, permissions } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Email already in use.' });
      }
    }

    await User.update(req.params.id, { name, email, mobile, role, specialty: specialty !== undefined ? specialty : user.specialty, designation: designation !== undefined ? designation : user.designation, store_id: store_id !== undefined ? store_id : user.store_id, permissions: permissions !== undefined ? permissions : user.permissions });
    const updated = await User.findById(req.params.id);

    return res.json({ success: true, data: updated, message: 'User updated successfully.' });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    await User.delete(req.params.id);
    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getStaffList = async (req, res) => {
  try {
    const staff = await User.findStaff();
    return res.json({ success: true, data: staff });
  } catch (err) {
    console.error('Get staff error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Returns contacts accessible to the logged-in user for communication (customer + tenant + security)
exports.getCustomerList = async (req, res) => {
  const db = require('../config/db');
  try {
    let rows;
    if (['admin', 'helpdesk'].includes(req.user.role)) {
      [rows] = await db.query(
        `SELECT id, name, email, mobile, role FROM users
         WHERE role IN ('customer','tenant','security')
         ORDER BY role, name`
      );
    } else {
      // staff: distinct contacts whose tickets are assigned to this staff
      [rows] = await db.query(
        `SELECT DISTINCT u.id, u.name, u.email, u.mobile, u.role
         FROM users u
         JOIN tickets t ON t.user_id = u.id
         WHERE t.assigned_staff = ?
         ORDER BY u.name`,
        [req.user.id]
      );
    }
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getCustomerList error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
