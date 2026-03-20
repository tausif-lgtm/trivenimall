const db = require('../config/db');

// Helper — create notification in DB and emit via socket
const createNotification = async (userId, title, message, type, ticketId, io) => {
  try {
    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, title, message, type, ticket_id) VALUES (?, ?, ?, ?, ?)',
      [userId, title, message, type, ticketId || null]
    );

    const notification = {
      id: result.insertId,
      user_id: userId,
      title,
      message,
      type,
      ticket_id: ticketId || null,
      is_read: 0,
      created_at: new Date().toISOString(),
    };

    // Emit to the user's socket room
    if (io) {
      io.to(`user_${userId}`).emit('notification:new', notification);
    }

    return notification;
  } catch (err) {
    console.error('createNotification error:', err.message);
    return null;
  }
};

module.exports.createNotification = createNotification;

exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getNotifications error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.markOneRead = async (req, res) => {
  try {
    await db.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    return res.json({ success: true, message: 'Marked as read.' });
  } catch (err) {
    console.error('markOneRead error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await db.execute(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
      [req.user.id]
    );
    return res.json({ success: true, message: 'All marked as read.' });
  } catch (err) {
    console.error('markAllRead error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    return res.json({ success: true, data: { count: rows[0].count } });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Broadcast notification to multiple users
exports.sendBroadcast = async (req, res) => {
  const { title, message, type, target, store_id } = req.body;
  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'title and message required.' });
  }

  // Only allow valid DB enum types
  const validTypes = ['maintenance_notice','operations_update','security_alert','event_announcement','system'];
  const notifType = validTypes.includes(type) ? type : 'system';

  try {
    let query, params = [];

    if (target === 'tenants') {
      // All retail shop owners
      query = `SELECT id FROM users WHERE role = 'tenant'`;
    } else if (target === 'staff_all') {
      // All staff + helpdesk + security
      query = `SELECT id FROM users WHERE role IN ('staff','helpdesk','security')`;
    } else if (target === 'store' && store_id) {
      // Specific store's tenant user
      query = `SELECT id FROM users WHERE role = 'tenant' AND store_id = ?`;
      params = [store_id];
    } else if (target === 'security') {
      query = `SELECT id FROM users WHERE role = 'security'`;
    } else if (target === 'helpdesk') {
      query = `SELECT id FROM users WHERE role = 'helpdesk'`;
    } else {
      // 'all' — everyone except admin
      query = `SELECT id FROM users WHERE role != 'admin'`;
    }

    const [users] = await db.query(query, params);
    const io = req.app.get('io');
    for (const user of users) {
      await createNotification(user.id, title, message, notifType, null, io);
    }
    return res.json({ success: true, message: `Notification sent to ${users.length} user(s).`, count: users.length });
  } catch (err) {
    console.error('sendBroadcast error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
