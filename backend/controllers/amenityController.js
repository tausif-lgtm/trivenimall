const db = require('../config/db');
const { createNotification } = require('./notificationController');

exports.getAmenities = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM amenities ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.createAmenity = async (req, res) => {
  const { name, description, capacity, location } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name required.' });
  try {
    const [result] = await db.execute(
      'INSERT INTO amenities (name, description, capacity, location) VALUES (?, ?, ?, ?)',
      [name, description || null, capacity || 0, location || null]
    );
    const [rows] = await db.query('SELECT * FROM amenities WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Amenity created.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateAmenity = async (req, res) => {
  const { name, description, capacity, location, is_active } = req.body;
  try {
    await db.execute(
      'UPDATE amenities SET name=?, description=?, capacity=?, location=?, is_active=? WHERE id=?',
      [name, description || null, capacity || 0, location || null, is_active !== undefined ? is_active : 1, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM amenities WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Amenity updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.deleteAmenity = async (req, res) => {
  try {
    await db.execute('DELETE FROM amenities WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Amenity deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getBookings = async (req, res) => {
  try {
    let query, params = [];
    if (req.user.role === 'admin' || req.user.role === 'staff') {
      const { status, amenity_id } = req.query;
      const conditions = [];
      if (status) { conditions.push('ab.status = ?'); params.push(status); }
      if (amenity_id) { conditions.push('ab.amenity_id = ?'); params.push(amenity_id); }
      query = `SELECT ab.*, a.name as amenity_name, u.name as user_name, u.email as user_email, u.mobile as user_mobile
               FROM amenity_bookings ab
               JOIN amenities a ON ab.amenity_id = a.id
               JOIN users u ON ab.user_id = u.id
               ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
               ORDER BY ab.booking_date DESC, ab.start_time ASC`;
    } else {
      query = `SELECT ab.*, a.name as amenity_name
               FROM amenity_bookings ab
               JOIN amenities a ON ab.amenity_id = a.id
               WHERE ab.user_id = ?
               ORDER BY ab.booking_date DESC`;
      params = [req.user.id];
    }
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.createBooking = async (req, res) => {
  const { amenity_id, booking_date, start_time, end_time, purpose } = req.body;
  if (!amenity_id || !booking_date || !start_time || !end_time) {
    return res.status(400).json({ success: false, message: 'amenity_id, booking_date, start_time, end_time required.' });
  }
  try {
    const [conflicts] = await db.query(
      `SELECT id FROM amenity_bookings
       WHERE amenity_id = ? AND booking_date = ? AND status IN ('pending','approved')
       AND NOT (end_time <= ? OR start_time >= ?)`,
      [amenity_id, booking_date, start_time, end_time]
    );
    if (conflicts.length > 0) {
      return res.status(409).json({ success: false, message: 'This time slot is already booked.' });
    }
    const [result] = await db.execute(
      'INSERT INTO amenity_bookings (amenity_id, user_id, booking_date, start_time, end_time, purpose) VALUES (?, ?, ?, ?, ?, ?)',
      [amenity_id, req.user.id, booking_date, start_time, end_time, purpose || null]
    );
    const io = req.app.get('io');
    const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
    const [amenity] = await db.query('SELECT name FROM amenities WHERE id = ?', [amenity_id]);
    for (const admin of admins) {
      await createNotification(admin.id, 'New Amenity Booking', `Booking request for ${amenity[0]?.name} by ${req.user.name}`, 'system', null, io);
    }
    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Booking request submitted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateBookingStatus = async (req, res) => {
  const { status, admin_notes } = req.body;
  if (!['approved', 'rejected', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }
  try {
    const [bookings] = await db.query(
      `SELECT ab.*, u.name as user_name, a.name as amenity_name
       FROM amenity_bookings ab JOIN users u ON ab.user_id = u.id JOIN amenities a ON ab.amenity_id = a.id
       WHERE ab.id = ?`,
      [req.params.id]
    );
    if (!bookings.length) return res.status(404).json({ success: false, message: 'Booking not found.' });
    const booking = bookings[0];
    await db.execute('UPDATE amenity_bookings SET status=?, admin_notes=? WHERE id=?', [status, admin_notes || null, req.params.id]);
    const io = req.app.get('io');
    await createNotification(
      booking.user_id,
      `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      `Your booking for ${booking.amenity_name} on ${new Date(booking.booking_date).toLocaleDateString()} has been ${status}.`,
      'system', null, io
    );
    res.json({ success: true, message: `Booking ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
