const db = require('../config/db');

const Checklist = {
  // ─── Template CRUD ────────────────────────────────────────────────────────

  async createTemplate({ title, description, frequency, frequency_day, assign_type, assigned_staff_id, assigned_role, items, created_by }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [r] = await conn.execute(
        `INSERT INTO checklist_templates
           (title, description, frequency, frequency_day, assign_type, assigned_staff_id, assigned_role, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, description || null, frequency, frequency_day || null,
         assign_type, assigned_staff_id || null, assigned_role || null, created_by]
      );
      const templateId = r.insertId;
      for (let i = 0; i < items.length; i++) {
        const txt = items[i].trim();
        if (!txt) continue;
        await conn.execute(
          'INSERT INTO checklist_template_items (template_id, item_text, sort_order) VALUES (?, ?, ?)',
          [templateId, txt, i]
        );
      }
      await conn.commit();
      return templateId;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  async findAllTemplates() {
    const [rows] = await db.query(`
      SELECT ct.*,
        u.name  AS created_by_name,
        s.name  AS assigned_staff_name,
        COUNT(cti.id) AS item_count
      FROM checklist_templates ct
      LEFT JOIN users u   ON ct.created_by         = u.id
      LEFT JOIN users s   ON ct.assigned_staff_id   = s.id
      LEFT JOIN checklist_template_items cti ON cti.template_id = ct.id
      GROUP BY ct.id
      ORDER BY ct.created_at DESC
    `);
    return rows;
  },

  async findTemplateById(id) {
    const [[tmpl]] = await db.query(`
      SELECT ct.*,
        u.name AS created_by_name,
        s.name AS assigned_staff_name
      FROM checklist_templates ct
      LEFT JOIN users u ON ct.created_by       = u.id
      LEFT JOIN users s ON ct.assigned_staff_id = s.id
      WHERE ct.id = ?`, [id]);
    if (!tmpl) return null;
    const [items] = await db.query(
      'SELECT * FROM checklist_template_items WHERE template_id = ? ORDER BY sort_order', [id]);
    tmpl.items = items;
    return tmpl;
  },

  async updateTemplate(id, { title, description, frequency, frequency_day, assign_type, assigned_staff_id, assigned_role, is_active, items }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        `UPDATE checklist_templates
         SET title=?, description=?, frequency=?, frequency_day=?,
             assign_type=?, assigned_staff_id=?, assigned_role=?, is_active=?
         WHERE id=?`,
        [title, description || null, frequency, frequency_day || null,
         assign_type, assigned_staff_id || null, assigned_role || null,
         is_active !== undefined ? (is_active ? 1 : 0) : 1, id]
      );
      if (items && items.length > 0) {
        await conn.execute('DELETE FROM checklist_template_items WHERE template_id = ?', [id]);
        for (let i = 0; i < items.length; i++) {
          const txt = items[i].trim();
          if (!txt) continue;
          await conn.execute(
            'INSERT INTO checklist_template_items (template_id, item_text, sort_order) VALUES (?, ?, ?)',
            [id, txt, i]
          );
        }
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  async deleteTemplate(id) {
    await db.execute('DELETE FROM checklist_templates WHERE id = ?', [id]);
  },

  // ─── Schedule Generation ──────────────────────────────────────────────────

  async generateSchedulesForDate(dateStr) {
    // dateStr: 'YYYY-MM-DD'
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayOfWeek  = dateObj.getDay();   // 0=Sun … 6=Sat
    const dayOfMonth = dateObj.getDate();  // 1–31

    const [templates] = await db.query(
      'SELECT * FROM checklist_templates WHERE is_active = 1'
    );

    let created = 0;
    for (const tmpl of templates) {
      let shouldRun = false;
      if (tmpl.frequency === 'daily') {
        shouldRun = true;
      } else if (tmpl.frequency === 'weekly') {
        shouldRun = Number(tmpl.frequency_day) === dayOfWeek;
      } else if (tmpl.frequency === 'monthly') {
        shouldRun = Number(tmpl.frequency_day) === dayOfMonth;
      }
      if (!shouldRun) continue;

      // Resolve staff IDs
      let staffIds = [];
      if (tmpl.assign_type === 'staff' && tmpl.assigned_staff_id) {
        staffIds = [tmpl.assigned_staff_id];
      } else if (tmpl.assign_type === 'role' && tmpl.assigned_role) {
        const [staffList] = await db.query(
          `SELECT id FROM users WHERE specialty = ? OR role = ?`,
          [tmpl.assigned_role, tmpl.assigned_role]
        );
        staffIds = staffList.map(s => s.id);
        if (staffIds.length === 0) staffIds = [null];
      } else {
        staffIds = [null];
      }

      for (const staffId of staffIds) {
        // Deduplicate
        const [existing] = await db.query(
          'SELECT id FROM checklist_schedules WHERE template_id=? AND assigned_to<=>? AND scheduled_date=?',
          [tmpl.id, staffId, dateStr]
        );
        if (existing.length > 0) continue;

        const [sr] = await db.execute(
          'INSERT INTO checklist_schedules (template_id, assigned_to, scheduled_date) VALUES (?,?,?)',
          [tmpl.id, staffId, dateStr]
        );
        const scheduleId = sr.insertId;

        const [items] = await db.query(
          'SELECT * FROM checklist_template_items WHERE template_id=? ORDER BY sort_order',
          [tmpl.id]
        );
        for (const item of items) {
          await db.execute(
            'INSERT INTO checklist_schedule_items (schedule_id, template_item_id, item_text) VALUES (?,?,?)',
            [scheduleId, item.id, item.item_text]
          );
        }
        created++;
      }
    }
    return created;
  },

  // ─── Staff Schedule Queries ───────────────────────────────────────────────

  async getSchedulesForStaff(staffId, dateStr) {
    const [rows] = await db.query(`
      SELECT cs.*,
        ct.title       AS template_title,
        ct.frequency,
        ct.description AS template_description,
        COUNT(csi.id)          AS total_items,
        SUM(csi.is_completed)  AS completed_items
      FROM checklist_schedules cs
      JOIN checklist_templates ct ON cs.template_id = ct.id
      LEFT JOIN checklist_schedule_items csi ON csi.schedule_id = cs.id
      WHERE cs.assigned_to = ? AND cs.scheduled_date = ?
      GROUP BY cs.id
      ORDER BY cs.status ASC, ct.title ASC
    `, [staffId, dateStr]);
    return rows;
  },

  async getPendingSchedules(staffId) {
    const today = new Date().toISOString().slice(0, 10);
    const [rows] = await db.query(`
      SELECT cs.*,
        ct.title      AS template_title,
        ct.frequency,
        COUNT(csi.id)         AS total_items,
        SUM(csi.is_completed) AS completed_items
      FROM checklist_schedules cs
      JOIN checklist_templates ct ON cs.template_id = ct.id
      LEFT JOIN checklist_schedule_items csi ON csi.schedule_id = cs.id
      WHERE cs.assigned_to = ?
        AND cs.status IN ('pending','in_progress')
        AND cs.scheduled_date <= ?
      GROUP BY cs.id
      ORDER BY cs.scheduled_date DESC, ct.title ASC
    `, [staffId, today]);
    return rows;
  },

  async getScheduleById(id) {
    const [[schedule]] = await db.query(`
      SELECT cs.*,
        ct.title       AS template_title,
        ct.frequency,
        ct.description AS template_description,
        u.name   AS assigned_to_name,
        sub.name AS submitted_by_name
      FROM checklist_schedules cs
      JOIN checklist_templates ct  ON cs.template_id  = ct.id
      LEFT JOIN users u            ON cs.assigned_to   = u.id
      LEFT JOIN users sub          ON cs.submitted_by   = sub.id
      WHERE cs.id = ?`, [id]);
    if (!schedule) return null;
    const [items] = await db.query(
      'SELECT * FROM checklist_schedule_items WHERE schedule_id=? ORDER BY id', [id]);
    schedule.items = items;
    return schedule;
  },

  // ─── Item Update ──────────────────────────────────────────────────────────

  async updateScheduleItem(scheduleId, itemId, { is_completed, remark, photo_url }) {
    await db.execute(
      `UPDATE checklist_schedule_items
       SET is_completed=?, remark=?, photo_url=?,
           completed_at = IF(?, NOW(), NULL)
       WHERE id=? AND schedule_id=?`,
      [is_completed ? 1 : 0, remark || null, photo_url || null,
       is_completed ? 1 : 0, itemId, scheduleId]
    );

    // Auto-update schedule status
    const [[counts]] = await db.query(
      'SELECT COUNT(*) AS total, SUM(is_completed) AS done FROM checklist_schedule_items WHERE schedule_id=?',
      [scheduleId]
    );
    if (counts.total > 0 && counts.done >= counts.total) {
      await db.execute(
        "UPDATE checklist_schedules SET status='completed', completed_at=NOW() WHERE id=?",
        [scheduleId]
      );
    } else {
      await db.execute(
        "UPDATE checklist_schedules SET status='in_progress', started_at=IFNULL(started_at, NOW()) WHERE id=? AND status='pending'",
        [scheduleId]
      );
    }
  },

  async submitSchedule(scheduleId, submittedBy, notes) {
    await db.execute(
      `UPDATE checklist_schedules
       SET status='completed', completed_at=NOW(), submitted_by=?, notes=?
       WHERE id=?`,
      [submittedBy, notes || null, scheduleId]
    );
  },

  // ─── Admin Monitoring ─────────────────────────────────────────────────────

  async getMonitoringData(dateStr) {
    const [[stats]] = await db.query(`
      SELECT
        COUNT(*)                           AS total,
        SUM(status = 'completed')          AS completed,
        SUM(status IN ('pending','in_progress')) AS pending,
        SUM(status = 'missed')             AS missed
      FROM checklist_schedules
      WHERE scheduled_date = ?
    `, [dateStr]);

    const [byStaff] = await db.query(`
      SELECT
        u.id   AS staff_id,
        u.name AS staff_name,
        COUNT(*)                        AS total,
        SUM(cs.status = 'completed')    AS completed,
        SUM(cs.status IN ('pending','in_progress')) AS pending
      FROM checklist_schedules cs
      JOIN users u ON cs.assigned_to = u.id
      WHERE cs.scheduled_date = ?
      GROUP BY u.id
      ORDER BY completed DESC
    `, [dateStr]);

    const [schedules] = await db.query(`
      SELECT cs.*,
        ct.title     AS template_title,
        ct.frequency,
        u.name       AS assigned_to_name,
        COUNT(csi.id)         AS total_items,
        SUM(csi.is_completed) AS completed_items
      FROM checklist_schedules cs
      JOIN checklist_templates ct ON cs.template_id = ct.id
      LEFT JOIN users u ON cs.assigned_to = u.id
      LEFT JOIN checklist_schedule_items csi ON csi.schedule_id = cs.id
      WHERE cs.scheduled_date = ?
      GROUP BY cs.id
      ORDER BY cs.status, ct.title
    `, [dateStr]);

    return { stats, byStaff, schedules };
  },

  async markMissedSchedules() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().slice(0, 10);
    const [result] = await db.execute(
      "UPDATE checklist_schedules SET status='missed' WHERE scheduled_date=? AND status IN ('pending','in_progress')",
      [yesterday]
    );
    return result.affectedRows;
  },

  // Admin full schedule history
  async getScheduleHistory({ date_from, date_to, staff_id, status }) {
    let where = 'WHERE 1=1';
    const params = [];
    if (date_from) { where += ' AND cs.scheduled_date >= ?'; params.push(date_from); }
    if (date_to)   { where += ' AND cs.scheduled_date <= ?'; params.push(date_to); }
    if (staff_id)  { where += ' AND cs.assigned_to = ?'; params.push(staff_id); }
    if (status)    { where += ' AND cs.status = ?'; params.push(status); }

    const [rows] = await db.query(`
      SELECT cs.*,
        ct.title     AS template_title,
        ct.frequency,
        u.name       AS assigned_to_name,
        COUNT(csi.id)         AS total_items,
        SUM(csi.is_completed) AS completed_items
      FROM checklist_schedules cs
      JOIN checklist_templates ct ON cs.template_id = ct.id
      LEFT JOIN users u ON cs.assigned_to = u.id
      LEFT JOIN checklist_schedule_items csi ON csi.schedule_id = cs.id
      ${where}
      GROUP BY cs.id
      ORDER BY cs.scheduled_date DESC, cs.status
      LIMIT 200
    `, params);
    return rows;
  }
};

module.exports = Checklist;
