const db = require('../config/db');

const TicketUpdate = {
  async findByTicketId(ticket_id) {
    const [rows] = await db.query(
      `SELECT tu.*, u.name AS updater_name, u.role AS updater_role
       FROM ticket_updates tu
       LEFT JOIN users u ON tu.updated_by = u.id
       WHERE tu.ticket_id = ?
       ORDER BY tu.created_at ASC`,
      [ticket_id]
    );
    return rows;
  },

  async create({ ticket_id, message, updated_by, attachment }) {
    const [result] = await db.query(
      'INSERT INTO ticket_updates (ticket_id, message, updated_by, attachment) VALUES (?, ?, ?, ?)',
      [ticket_id, message, updated_by, attachment || null]
    );
    return result.insertId;
  },
};

module.exports = TicketUpdate;
