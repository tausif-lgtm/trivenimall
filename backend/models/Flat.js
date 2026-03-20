const db = require('../config/db');

const Flat = {
  async findAll(filters = {}) {
    let query = `
      SELECT f.*, p.project_name, p.location, p.builder_name,
             u.name AS owner_name, u.email AS owner_email, u.mobile AS owner_mobile
      FROM flats f
      LEFT JOIN projects p ON f.project_id = p.id
      LEFT JOIN users u ON f.owner_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (filters.project_id) {
      conditions.push('f.project_id = ?');
      params.push(filters.project_id);
    }
    if (filters.owner_id) {
      conditions.push('f.owner_id = ?');
      params.push(filters.owner_id);
    }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY f.created_at DESC';

    const [rows] = await db.query(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query(
      `SELECT f.*, p.project_name, p.location, p.builder_name,
              u.name AS owner_name, u.email AS owner_email, u.mobile AS owner_mobile
       FROM flats f
       LEFT JOIN projects p ON f.project_id = p.id
       LEFT JOIN users u ON f.owner_id = u.id
       WHERE f.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findByOwner(owner_id) {
    const [rows] = await db.query(
      `SELECT f.*, p.project_name, p.location, p.builder_name
       FROM flats f
       LEFT JOIN projects p ON f.project_id = p.id
       WHERE f.owner_id = ?
       ORDER BY f.created_at DESC`,
      [owner_id]
    );
    return rows;
  },

  async create({ project_id, tower, floor, flat_number, area, owner_id }) {
    const [result] = await db.query(
      'INSERT INTO flats (project_id, tower, floor, flat_number, area, owner_id) VALUES (?, ?, ?, ?, ?, ?)',
      [project_id, tower || null, floor || null, flat_number, area || null, owner_id || null]
    );
    return result.insertId;
  },

  async update(id, { project_id, tower, floor, flat_number, area, owner_id }) {
    const fields = [];
    const params = [];

    if (project_id !== undefined) { fields.push('project_id = ?'); params.push(project_id); }
    if (tower !== undefined) { fields.push('tower = ?'); params.push(tower); }
    if (floor !== undefined) { fields.push('floor = ?'); params.push(floor); }
    if (flat_number !== undefined) { fields.push('flat_number = ?'); params.push(flat_number); }
    if (area !== undefined) { fields.push('area = ?'); params.push(area); }
    if (owner_id !== undefined) { fields.push('owner_id = ?'); params.push(owner_id || null); }

    if (!fields.length) return false;

    params.push(id);
    const [result] = await db.query(
      `UPDATE flats SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  },

  async assignOwner(id, owner_id) {
    const [result] = await db.query(
      'UPDATE flats SET owner_id = ? WHERE id = ?',
      [owner_id || null, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM flats WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = Flat;
