const db = require('../config/db');

// POST fast entry (public - used by security staff)
exports.addEntry = async (req, res) => {
  try {
    const { vehicle_number, mobile, vehicle_type } = req.body;
    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Mobile number is required.' });
    }
    const [result] = await db.query(
      'INSERT INTO parking (vehicle_number, mobile, vehicle_type, entry_time) VALUES (?, ?, ?, NOW())',
      [vehicle_number || null, mobile, vehicle_type || '4-Wheeler']
    );
    res.status(201).json({ success: true, message: 'Entry recorded.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH record exit
exports.recordExit = async (req, res) => {
  try {
    await db.query('UPDATE parking SET exit_time = NOW() WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Exit recorded.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET parking entries (admin)
exports.getEntries = async (req, res) => {
  try {
    const { from_date, to_date, active_only } = req.query;
    let sql = 'SELECT * FROM parking WHERE 1=1';
    const params = [];
    if (from_date) { sql += ' AND DATE(entry_time) >= ?'; params.push(from_date); }
    if (to_date) { sql += ' AND DATE(entry_time) <= ?'; params.push(to_date); }
    if (active_only === 'true') { sql += ' AND exit_time IS NULL'; }
    sql += ' ORDER BY entry_time DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET parking stats
exports.getParkingStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [[todayStats]] = await db.query(
      `SELECT COUNT(*) AS total_today,
              SUM(CASE WHEN exit_time IS NULL THEN 1 ELSE 0 END) AS currently_parked
       FROM parking WHERE DATE(entry_time) = ?`,
      [today]
    );
    const [byType] = await db.query(
      'SELECT vehicle_type, COUNT(*) AS count FROM parking WHERE DATE(entry_time) = ? GROUP BY vehicle_type',
      [today]
    );
    res.json({ success: true, data: { today: todayStats, by_type: byType } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
