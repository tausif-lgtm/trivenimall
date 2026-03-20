const db = require('../config/db');

const Project = {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM projects WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create({ project_name, location, builder_name }) {
    const [result] = await db.query(
      'INSERT INTO projects (project_name, location, builder_name) VALUES (?, ?, ?)',
      [project_name, location || null, builder_name || null]
    );
    return result.insertId;
  },

  async update(id, { project_name, location, builder_name }) {
    const fields = [];
    const params = [];

    if (project_name !== undefined) { fields.push('project_name = ?'); params.push(project_name); }
    if (location !== undefined) { fields.push('location = ?'); params.push(location); }
    if (builder_name !== undefined) { fields.push('builder_name = ?'); params.push(builder_name); }

    if (!fields.length) return false;

    params.push(id);
    const [result] = await db.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.query('DELETE FROM projects WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = Project;
