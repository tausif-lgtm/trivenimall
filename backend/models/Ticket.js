const db = require('../config/db');

// SLA hours per priority
const SLA_HOURS = { Critical: 4, High: 24, Medium: 48, Low: 72 };

const Ticket = {
  async generateTicketNumber() {
    const year = new Date().getFullYear();
    const [rows] = await db.query(
      "SELECT COUNT(*) AS count FROM tickets WHERE ticket_number LIKE ?",
      [`TKT-${year}-%`]
    );
    const count = rows[0].count + 1;
    return `TKT-${year}-${String(count).padStart(4, '0')}`;
  },

  // Calculate SLA deadline from priority
  calcSlaDeadline(priority) {
    const hours = SLA_HOURS[priority] || 48;
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hours);
    return deadline;
  },

  async findAll(filters = {}) {
    let query = `
      SELECT t.*,
             u.name AS customer_name, u.email AS customer_email,
             s.name AS staff_name,
             st.store_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users s ON t.assigned_staff = s.id
      LEFT JOIN stores st ON u.store_id = st.id
    `;
    const params = [];
    const conditions = [];

    if (filters.user_id) {
      conditions.push('t.user_id = ?');
      params.push(filters.user_id);
    }
    if (filters.assigned_staff) {
      conditions.push('t.assigned_staff = ?');
      params.push(filters.assigned_staff);
    }
    if (filters.status) {
      conditions.push('t.status = ?');
      params.push(filters.status);
    }
    if (filters.priority) {
      conditions.push('t.priority = ?');
      params.push(filters.priority);
    }
    if (filters.category) {
      conditions.push('t.category = ?');
      params.push(filters.category);
    }
    if (filters.source) {
      conditions.push('t.source = ?');
      params.push(filters.source);
    }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY t.created_at DESC';

    const [rows] = await db.query(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query(
      `SELECT t.*,
              u.name AS customer_name, u.email AS customer_email, u.mobile AS customer_mobile, u.role AS customer_role,
              s.name AS staff_name, s.email AS staff_email,
              st.store_name, st.category AS store_category
       FROM tickets t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN users s ON t.assigned_staff = s.id
       LEFT JOIN stores st ON u.store_id = st.id
       WHERE t.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ user_id, title, description, category, priority, source, requester_name, requester_phone }) {
    const ticket_number = await this.generateTicketNumber();
    const sla_deadline = this.calcSlaDeadline(priority || 'Medium');
    const [result] = await db.query(
      `INSERT INTO tickets
         (ticket_number, user_id, title, description, category, priority, source, requester_name, requester_phone, sla_deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticket_number,
        user_id,
        title,
        description || null,
        category || null,
        priority || 'Medium',
        source || 'web',
        requester_name || null,
        requester_phone || null,
        sla_deadline,
      ]
    );
    return { insertId: result.insertId, ticket_number };
  },

  async updateStatus(id, status) {
    const [result] = await db.query(
      'UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  },

  async assignStaff(id, staff_id) {
    const [result] = await db.query(
      "UPDATE tickets SET assigned_staff = ?, status = IF(status = 'Open', 'Assigned', status), updated_at = NOW() WHERE id = ?",
      [staff_id || null, id]
    );
    return result.affectedRows > 0;
  },

  async update(id, { title, description, category, priority, status, assigned_staff }) {
    const fields = [];
    const params = [];

    if (title !== undefined) { fields.push('title = ?'); params.push(title); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (category !== undefined) { fields.push('category = ?'); params.push(category); }
    if (priority !== undefined) {
      fields.push('priority = ?');
      params.push(priority);
      // Recalculate SLA if priority changes
      fields.push('sla_deadline = ?');
      params.push(this.calcSlaDeadline(priority));
    }
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }
    if (assigned_staff !== undefined) { fields.push('assigned_staff = ?'); params.push(assigned_staff || null); }

    if (!fields.length) return false;

    fields.push('updated_at = NOW()');
    params.push(id);
    const [result] = await db.query(
      `UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  },

  // Auto-assign staff by specialty matching category
  async autoAssign(ticketId, category) {
    if (!category) return null;

    // Map ticket category to staff specialty keywords
    const specialtyMap = {
      'Maintenance': 'maintenance',
      'IT': 'it',
      'Parking': 'parking',
      'Security': 'security',
      'Accounts': 'accounts',
      'Operations': 'operations',
      'Electrical': 'maintenance',
      'Plumbing': 'maintenance',
      'Civil': 'maintenance',
      'Lift': 'maintenance',
      'Housekeeping': 'operations',
    };

    const specialty = specialtyMap[category];
    if (!specialty) return null;

    // Find least-loaded staff with matching specialty
    const [rows] = await db.query(
      `SELECT u.id, COUNT(t.id) AS active_tickets
       FROM users u
       LEFT JOIN tickets t ON t.assigned_staff = u.id AND t.status NOT IN ('Resolved','Closed')
       WHERE u.role = 'staff' AND u.specialty = ?
       GROUP BY u.id
       ORDER BY active_tickets ASC
       LIMIT 1`,
      [specialty]
    );

    if (!rows.length) return null;
    const staffId = rows[0].id;
    await this.assignStaff(ticketId, staffId);
    return staffId;
  },

  async getStats() {
    const [rows] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'Open') AS open_count,
        SUM(status = 'Assigned') AS assigned_count,
        SUM(status = 'In Progress') AS in_progress_count,
        SUM(status = 'Resolved') AS resolved_count,
        SUM(status = 'Closed') AS closed_count,
        SUM(priority = 'Critical') AS critical_count,
        SUM(priority = 'High') AS high_count,
        SUM(sla_deadline < NOW() AND status NOT IN ('Resolved','Closed')) AS sla_breached
      FROM tickets
    `);
    return rows[0];
  },

  async getStatsByUser(user_id) {
    const [rows] = await db.query(
      `SELECT
        COUNT(*) AS total,
        SUM(status = 'Open') AS open_count,
        SUM(status = 'Assigned') AS assigned_count,
        SUM(status = 'In Progress') AS in_progress_count,
        SUM(status = 'Resolved') AS resolved_count,
        SUM(status = 'Closed') AS closed_count
       FROM tickets WHERE user_id = ?`,
      [user_id]
    );
    return rows[0];
  },
};

module.exports = Ticket;
