const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await db.query(
      'SELECT id, name, email, mobile, role, specialty, designation, store_id, permissions, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    if (!rows[0]) return null;
    const u = rows[0];
    u.permissions = u.permissions ? JSON.parse(u.permissions) : null;
    return u;
  },

  async findAll(filters = {}) {
    let query = 'SELECT id, name, email, mobile, role, specialty, designation, store_id, permissions, created_at, updated_at FROM users';
    const params = [];
    const conditions = [];

    if (filters.role) {
      conditions.push('role = ?');
      params.push(filters.role);
    }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY created_at DESC';

    const [rows] = await db.query(query, params);
    return rows.map(u => ({ ...u, permissions: u.permissions ? JSON.parse(u.permissions) : null }));
  },

  async create({ name, email, mobile, password, role, specialty, designation, store_id, permissions }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const permJson = permissions ? JSON.stringify(permissions) : null;
    const [result] = await db.query(
      'INSERT INTO users (name, email, mobile, password, role, specialty, designation, store_id, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, mobile || null, hashedPassword, role || 'customer', specialty || null, designation || null, store_id || null, permJson]
    );
    return result.insertId;
  },

  async update(id, { name, email, mobile, role, specialty, designation, store_id, permissions }) {
    const fields = [];
    const params = [];

    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (email !== undefined) { fields.push('email = ?'); params.push(email); }
    if (mobile !== undefined) { fields.push('mobile = ?'); params.push(mobile); }
    if (role !== undefined) { fields.push('role = ?'); params.push(role); }
    if (specialty !== undefined) { fields.push('specialty = ?'); params.push(specialty || null); }
    if (designation !== undefined) { fields.push('designation = ?'); params.push(designation || null); }
    if (store_id !== undefined) { fields.push('store_id = ?'); params.push(store_id || null); }
    if (permissions !== undefined) {
      fields.push('permissions = ?');
      params.push(permissions ? JSON.stringify(permissions) : null);
    }

    if (!fields.length) return false;

    params.push(id);
    const [result] = await db.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  },

  async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await db.query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  async findStaff() {
    const [rows] = await db.query(
      "SELECT id, name, email, specialty FROM users WHERE role = 'staff' ORDER BY name ASC"
    );
    return rows;
  },
};

module.exports = User;
