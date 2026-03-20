const db = require('../config/db');

// GET all stores
exports.getStores = async (req, res) => {
  try {
    const [stores] = await db.query('SELECT * FROM stores ORDER BY store_name ASC');
    res.json({ success: true, data: stores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single store
exports.getStore = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM stores WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Store not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create store
exports.createStore = async (req, res) => {
  try {
    const { store_name, floor, unit_number, category, contact_person, designation, mobile, email } = req.body;
    if (!store_name) return res.status(400).json({ success: false, message: 'Store name is required.' });
    const [result] = await db.query(
      'INSERT INTO stores (store_name, floor, unit_number, category, contact_person, designation, mobile, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [store_name, floor, unit_number, category || 'Others', contact_person, designation || null, mobile, email]
    );
    res.status(201).json({ success: true, message: 'Store created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT update store
exports.updateStore = async (req, res) => {
  try {
    const { store_name, floor, unit_number, category, contact_person, designation, mobile, email, is_active } = req.body;
    await db.query(
      'UPDATE stores SET store_name=?, floor=?, unit_number=?, category=?, contact_person=?, designation=?, mobile=?, email=?, is_active=? WHERE id=?',
      [store_name, floor, unit_number, category, contact_person, designation || null, mobile, email, is_active ?? 1, req.params.id]
    );
    res.json({ success: true, message: 'Store updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE store
exports.deleteStore = async (req, res) => {
  try {
    await db.query('DELETE FROM stores WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Store deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
