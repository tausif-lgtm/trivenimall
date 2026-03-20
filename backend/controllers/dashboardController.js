const db = require('../config/db');
const Ticket = require('../models/Ticket');

exports.getAdminDashboard = async (req, res) => {
  try {
    const [
      ticketStats,
      [userRows], [staffRows],
      [recentTickets], [categoryStats], [statusChart], [priorityChart], [weekChart]
    ] = await Promise.all([
      Ticket.getStats(),
      db.query('SELECT COUNT(*) AS total_users FROM users'),
      db.query("SELECT COUNT(*) AS total_staff FROM users WHERE role = 'staff'"),
      db.query(`SELECT t.id, t.ticket_number, t.title, t.status, t.priority, t.created_at,
             u.name AS customer_name
      FROM tickets t LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC LIMIT 5`),
      db.query(`SELECT category, COUNT(*) AS count FROM tickets WHERE category IS NOT NULL
      GROUP BY category ORDER BY count DESC LIMIT 6`),
      db.query('SELECT status, COUNT(*) AS count FROM tickets GROUP BY status'),
      db.query(`SELECT priority, COUNT(*) AS count FROM tickets GROUP BY priority
      ORDER BY FIELD(priority, 'Low', 'Medium', 'High', 'Critical')`),
      db.query(`SELECT DATE(created_at) AS day, COUNT(*) AS count FROM tickets
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(created_at) ORDER BY day ASC`),
    ]);

    // Fill in missing days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = weekChart.find((r) => {
        const rowDate = new Date(r.day).toISOString().split('T')[0];
        return rowDate === dateStr;
      });
      last7Days.push({
        day: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        count: found ? Number(found.count) : 0,
      });
    }

    return res.json({
      success: true,
      data: {
        tickets: {
          total: ticketStats.total,
          open: ticketStats.open_count,
          in_progress: ticketStats.in_progress_count,
          resolved: ticketStats.resolved_count,
          closed: ticketStats.closed_count,
          critical: ticketStats.critical_count,
          high: ticketStats.high_count,
        },
        users: {
          total: userRows[0].total_users,
          staff: staffRows[0].total_staff,
        },
        recentTickets,
        categoryStats,
        charts: {
          statusChart: statusChart.map((r) => ({ name: r.status, value: Number(r.count) })),
          priorityChart: priorityChart.map((r) => ({ name: r.priority, value: Number(r.count) })),
          weekChart: last7Days,
        },
      },
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getCustomerDashboard = async (req, res) => {
  try {
    const [ticketStats, [recentTickets], [statusChart]] = await Promise.all([
      Ticket.getStatsByUser(req.user.id),
      db.query(`SELECT t.id, t.ticket_number, t.title, t.status, t.priority, t.category, t.created_at, t.updated_at
      FROM tickets t
      WHERE t.user_id = ? ORDER BY t.created_at DESC LIMIT 5`, [req.user.id]),
      db.query('SELECT status, COUNT(*) AS count FROM tickets WHERE user_id = ? GROUP BY status', [req.user.id]),
    ]);

    return res.json({
      success: true,
      data: {
        tickets: {
          total: ticketStats.total,
          open: ticketStats.open_count,
          in_progress: ticketStats.in_progress_count,
          resolved: ticketStats.resolved_count,
          closed: ticketStats.closed_count,
        },
        recentTickets,
        charts: {
          statusChart: statusChart.map((r) => ({ name: r.status, value: Number(r.count) })),
        },
      },
    });
  } catch (err) {
    console.error('Customer dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getStaffDashboard = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'Open') AS open_count,
        SUM(status = 'In Progress') AS in_progress_count,
        SUM(status = 'Resolved') AS resolved_count
      FROM tickets
      WHERE assigned_staff = ?
    `, [req.user.id]);

    const [recentTickets] = await db.query(`
      SELECT t.id, t.ticket_number, t.title, t.status, t.priority, t.category, t.created_at,
             u.name AS customer_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.assigned_staff = ?
      ORDER BY t.created_at DESC
      LIMIT 5
    `, [req.user.id]);

    return res.json({
      success: true,
      data: {
        tickets: {
          total: stats[0].total,
          open: stats[0].open_count,
          in_progress: stats[0].in_progress_count,
          resolved: stats[0].resolved_count,
        },
        recentTickets,
      },
    });
  } catch (err) {
    console.error('Staff dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
