const db = require('../config/db');
const { createNotification } = require('./notificationController');

exports.getUpdates = async (req, res) => {
  try {
    const { project_id } = req.query;
    let query = `SELECT cu.*, p.project_name, u.name as created_by_name
                 FROM construction_updates cu
                 JOIN projects p ON cu.project_id = p.id
                 JOIN users u ON cu.created_by = u.id`;
    const params = [];
    if (project_id) { query += ' WHERE cu.project_id = ?'; params.push(project_id); }
    query += ' ORDER BY cu.created_at DESC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.createUpdate = async (req, res) => {
  const { project_id, title, description, update_type, notify_customers } = req.body;
  if (!project_id || !title) return res.status(400).json({ success: false, message: 'project_id and title required.' });
  try {
    const [result] = await db.execute(
      'INSERT INTO construction_updates (project_id, title, description, update_type, created_by) VALUES (?, ?, ?, ?, ?)',
      [project_id, title, description || null, update_type || 'general', req.user.id]
    );
    if (notify_customers) {
      const io = req.app.get('io');
      const [customers] = await db.query(
        `SELECT DISTINCT u.id FROM users u JOIN flats f ON f.owner_id = u.id WHERE f.project_id = ?`,
        [project_id]
      );
      const [project] = await db.query('SELECT project_name FROM projects WHERE id = ?', [project_id]);
      for (const c of customers) {
        await createNotification(c.id, `Project Update: ${project[0]?.project_name}`, title, 'project_update', null, io);
      }
    }
    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Update posted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.deleteUpdate = async (req, res) => {
  try {
    await db.execute('DELETE FROM construction_updates WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Update deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getPhotos = async (req, res) => {
  try {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ success: false, message: 'project_id required.' });
    const [rows] = await db.query(
      `SELECT cp.*, u.name as uploaded_by_name, cu.title as update_title
       FROM construction_photos cp
       JOIN users u ON cp.uploaded_by = u.id
       LEFT JOIN construction_updates cu ON cp.update_id = cu.id
       WHERE cp.project_id = ?
       ORDER BY cp.created_at DESC`,
      [project_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.uploadPhoto = async (req, res) => {
  const { project_id, update_id, caption } = req.body;
  if (!project_id || !req.file) return res.status(400).json({ success: false, message: 'project_id and file required.' });
  try {
    const photo_path = `/uploads/construction/${req.file.filename}`;
    const [result] = await db.execute(
      'INSERT INTO construction_photos (project_id, update_id, photo_path, caption, uploaded_by) VALUES (?, ?, ?, ?, ?)',
      [project_id, update_id || null, photo_path, caption || null, req.user.id]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, photo_path }, message: 'Photo uploaded.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.deletePhoto = async (req, res) => {
  try {
    await db.execute('DELETE FROM construction_photos WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Photo deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getTimeline = async (req, res) => {
  try {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ success: false, message: 'project_id required.' });
    const [rows] = await db.query(
      'SELECT * FROM possession_timeline WHERE project_id = ? ORDER BY order_index ASC, created_at ASC',
      [project_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.createMilestone = async (req, res) => {
  const { project_id, milestone_title, description, planned_date, status, order_index } = req.body;
  if (!project_id || !milestone_title) return res.status(400).json({ success: false, message: 'project_id and milestone_title required.' });
  try {
    const [result] = await db.execute(
      'INSERT INTO possession_timeline (project_id, milestone_title, description, planned_date, status, order_index) VALUES (?, ?, ?, ?, ?, ?)',
      [project_id, milestone_title, description || null, planned_date || null, status || 'pending', order_index || 0]
    );
    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Milestone added.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateMilestone = async (req, res) => {
  const { milestone_title, description, planned_date, actual_date, status, order_index } = req.body;
  try {
    await db.execute(
      'UPDATE possession_timeline SET milestone_title=?, description=?, planned_date=?, actual_date=?, status=?, order_index=? WHERE id=?',
      [milestone_title, description || null, planned_date || null, actual_date || null, status || 'pending', order_index || 0, req.params.id]
    );
    res.json({ success: true, message: 'Milestone updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.deleteMilestone = async (req, res) => {
  try {
    await db.execute('DELETE FROM possession_timeline WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Milestone deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
