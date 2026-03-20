const Checklist = require('../models/Checklist');
const db = require('../config/db');
const path = require('path');

// ─── Template CRUD (Admin) ────────────────────────────────────────────────────

exports.getTemplates = async (req, res) => {
  try {
    const templates = await Checklist.findAllTemplates();
    res.json({ success: true, data: templates });
  } catch (e) {
    console.error('getTemplates:', e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getTemplateById = async (req, res) => {
  try {
    const tmpl = await Checklist.findTemplateById(req.params.id);
    if (!tmpl) return res.status(404).json({ success: false, message: 'Template not found.' });
    res.json({ success: true, data: tmpl });
  } catch (e) {
    console.error('getTemplateById:', e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.createTemplate = async (req, res) => {
  const { title, description, frequency, frequency_day, assign_type, assigned_staff_id, assigned_role, items } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'Title is required.' });
  if (!frequency) return res.status(400).json({ success: false, message: 'Frequency is required.' });
  if (!items || !Array.isArray(items) || items.filter(i => i.trim()).length === 0)
    return res.status(400).json({ success: false, message: 'At least one checklist item is required.' });

  try {
    const id = await Checklist.createTemplate({
      title, description, frequency,
      frequency_day: frequency_day || null,
      assign_type: assign_type || 'staff',
      assigned_staff_id: assigned_staff_id || null,
      assigned_role: assigned_role || null,
      items,
      created_by: req.user.id
    });
    // Immediately generate schedule for today if applicable
    try {
      const today = new Date().toISOString().slice(0, 10);
      await Checklist.generateSchedulesForDate(today);
    } catch (e) { console.warn('Auto-generate after create failed:', e.message); }

    // Notify assigned staff via socket
    const tmpl = await Checklist.findTemplateById(id);
    const io = req.app.get('io');
    if (io && tmpl) {
      const notifPayload = {
        type: 'checklist_assigned',
        title: 'New Checklist Assigned',
        message: `You have a new checklist: "${tmpl.title}"`,
        link: '/staff/checklists'
      };
      if (tmpl.assigned_staff_id) {
        io.to(`user_${tmpl.assigned_staff_id}`).emit('notification', notifPayload);
      }
    }

    res.status(201).json({ success: true, data: { id }, message: 'Checklist template created.' });
  } catch (e) {
    console.error('createTemplate:', e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateTemplate = async (req, res) => {
  const { title, description, frequency, frequency_day, assign_type, assigned_staff_id, assigned_role, is_active, items } = req.body;
  try {
    const tmpl = await Checklist.findTemplateById(req.params.id);
    if (!tmpl) return res.status(404).json({ success: false, message: 'Template not found.' });
    await Checklist.updateTemplate(req.params.id, {
      title: title || tmpl.title,
      description, frequency: frequency || tmpl.frequency,
      frequency_day, assign_type: assign_type || tmpl.assign_type,
      assigned_staff_id, assigned_role, is_active, items
    });
    res.json({ success: true, message: 'Template updated.' });
  } catch (e) {
    console.error('updateTemplate:', e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    await Checklist.deleteTemplate(req.params.id);
    res.json({ success: true, message: 'Template deleted.' });
  } catch (e) {
    console.error('deleteTemplate:', e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Schedule Generation (Admin) ─────────────────────────────────────────────

exports.generateSchedules = async (req, res) => {
  const dateStr = req.body.date || new Date().toISOString().slice(0, 10);
  try {
    const count = await Checklist.generateSchedulesForDate(dateStr);
    res.json({ success: true, message: `Generated ${count} schedule(s) for ${dateStr}.`, data: { count } });
  } catch (e) {
    console.error('generateSchedules:', e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Monitoring (Admin) ───────────────────────────────────────────────────────

exports.getMonitoring = async (req, res) => {
  const dateStr = req.query.date || new Date().toISOString().slice(0, 10);
  try {
    const data = await Checklist.getMonitoringData(dateStr);
    res.json({ success: true, data });
  } catch (e) {
    console.error('getMonitoring:', e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getHistory = async (req, res) => {
  const { date_from, date_to, staff_id, status } = req.query;
  try {
    const rows = await Checklist.getScheduleHistory({ date_from, date_to, staff_id, status });
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('getHistory:', e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── Staff — My Checklists ────────────────────────────────────────────────────

exports.getMyChecklists = async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const dateStr = req.query.date || today;
  try {
    const todaySchedules  = await Checklist.getSchedulesForStaff(req.user.id, dateStr);
    const pendingSchedules = await Checklist.getPendingSchedules(req.user.id);
    res.json({ success: true, data: { today: todaySchedules, pending: pendingSchedules, date: dateStr } });
  } catch (e) {
    console.error('getMyChecklists:', e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await Checklist.getScheduleById(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found.' });
    // Staff can only see their own; admin/helpdesk can see all
    if (!['admin','helpdesk'].includes(req.user.role) && schedule.assigned_to !== req.user.id)
      return res.status(403).json({ success: false, message: 'Access denied.' });
    res.json({ success: true, data: schedule });
  } catch (e) {
    console.error('getScheduleById:', e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateItem = async (req, res) => {
  const { scheduleId, itemId } = req.params;
  const { is_completed, remark } = req.body;
  try {
    // Verify ownership
    const schedule = await Checklist.getScheduleById(scheduleId);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found.' });
    if (!['admin','helpdesk'].includes(req.user.role) && schedule.assigned_to !== req.user.id)
      return res.status(403).json({ success: false, message: 'Access denied.' });
    if (schedule.status === 'completed' || schedule.status === 'missed')
      return res.status(400).json({ success: false, message: 'This checklist is already closed.' });

    let photo_url = null;
    if (req.file) {
      photo_url = `/uploads/checklists/${req.file.filename}`;
    }

    await Checklist.updateScheduleItem(scheduleId, itemId, {
      is_completed: is_completed === '1' || is_completed === true || is_completed === 'true',
      remark, photo_url
    });

    const updated = await Checklist.getScheduleById(scheduleId);
    res.json({ success: true, message: 'Item updated.', data: updated });
  } catch (e) {
    console.error('updateItem:', e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.submitSchedule = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  try {
    const schedule = await Checklist.getScheduleById(id);
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found.' });
    if (!['admin','helpdesk'].includes(req.user.role) && schedule.assigned_to !== req.user.id)
      return res.status(403).json({ success: false, message: 'Access denied.' });
    if (schedule.status === 'completed')
      return res.status(400).json({ success: false, message: 'Already submitted.' });

    await Checklist.submitSchedule(id, req.user.id, notes);

    // Notify admin
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('notification', {
        type: 'checklist_submitted',
        title: 'Checklist Submitted',
        message: `${req.user.name} completed: "${schedule.template_title}"`,
        link: '/admin/checklists'
      });
    }

    res.json({ success: true, message: 'Checklist submitted successfully.' });
  } catch (e) {
    console.error('submitSchedule:', e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
