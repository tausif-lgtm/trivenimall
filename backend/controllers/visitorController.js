const db = require('../config/db');

// POST register visitor (public form)
exports.registerVisitor = async (req, res) => {
  try {
    const { name, mobile, age_group, visit_type } = req.body;
    if (!name || !mobile) {
      return res.status(400).json({ success: false, message: 'Name and mobile are required.' });
    }
    const today = new Date().toISOString().split('T')[0];
    await db.query(
      'INSERT INTO visitors (name, mobile, age_group, visit_type, visit_date) VALUES (?, ?, ?, ?, ?)',
      [name, mobile, age_group || '26-35', visit_type || 'Shopping', today]
    );
    res.status(201).json({ success: true, message: 'Welcome to Alcove Triveni Mall!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET all visitors (admin)
exports.getVisitors = async (req, res) => {
  try {
    const { from_date, to_date, visit_type } = req.query;
    let sql = 'SELECT * FROM visitors WHERE 1=1';
    const params = [];
    if (from_date) { sql += ' AND visit_date >= ?'; params.push(from_date); }
    if (to_date) { sql += ' AND visit_date <= ?'; params.push(to_date); }
    if (visit_type) { sql += ' AND visit_type = ?'; params.push(visit_type); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH mark visitor as qualified
exports.markQualified = async (req, res) => {
  try {
    await db.query('UPDATE visitors SET is_qualified = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Visitor marked as qualified.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET visitor stats
exports.getVisitorStats = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const dateFilter = from_date && to_date ? 'WHERE visit_date BETWEEN ? AND ?' : '';
    const params = from_date && to_date ? [from_date, to_date] : [];

    const [total] = await db.query(`SELECT COUNT(*) AS total, SUM(is_qualified) AS qualified FROM visitors ${dateFilter}`, params);
    const [byType] = await db.query(`SELECT visit_type, COUNT(*) AS count FROM visitors ${dateFilter} GROUP BY visit_type`, params);
    const [byAge] = await db.query(`SELECT age_group, COUNT(*) AS count FROM visitors ${dateFilter} GROUP BY age_group`, params);
    const [daily] = await db.query(`SELECT visit_date, COUNT(*) AS count FROM visitors ${dateFilter} GROUP BY visit_date ORDER BY visit_date ASC`, params);

    res.json({ success: true, data: { total: total[0].total, qualified: total[0].qualified, by_type: byType, by_age: byAge, daily } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
