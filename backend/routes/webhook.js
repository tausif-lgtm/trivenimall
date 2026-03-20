const express = require('express');
const router = express.Router();
const db = require('../config/db');
const Ticket = require('../models/Ticket');
const { createNotification } = require('../controllers/notificationController');
const emailService = require('../services/emailService');

// Middleware: validate API key from header
function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.WEBHOOK_API_KEY) {
    return res.status(401).json({ success: false, message: 'Invalid or missing API key.' });
  }
  next();
}

/**
 * POST /api/webhook/tickets
 *
 * Create a ticket from an external system (WhatsApp bot, web form, etc.)
 * Treated as: source = 'webhook', created by a helpdesk system user.
 *
 * Headers:
 *   x-api-key: <WEBHOOK_API_KEY>
 *   Content-Type: application/json
 *
 * Body:
 *   mobile         (optional) — registered user's mobile
 *   store_name     (optional) — tenant's store name (used to find user)
 *   title          (required)
 *   description    (optional)
 *   category       (optional)
 *   priority       (optional, default: Medium)
 *   requester_name (optional) — walk-in customer's name
 *   requester_phone(optional) — walk-in customer's phone
 */
router.post('/tickets', requireApiKey, async (req, res) => {
  const { mobile, store_name, title, description, category, priority, requester_name, requester_phone } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Ticket title is required.' });
  }

  const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ success: false, message: `Invalid priority. Use: ${validPriorities.join(', ')}` });
  }

  try {
    let creator = null;

    // Try to find user by mobile
    if (mobile) {
      const [users] = await db.query(
        "SELECT id, name, email, mobile FROM users WHERE mobile = ? LIMIT 1",
        [String(mobile).trim()]
      );
      if (users.length) creator = users[0];
    }

    // Try to find user by store_name
    if (!creator && store_name) {
      const [users] = await db.query(
        `SELECT u.id, u.name, u.email, u.mobile
         FROM users u JOIN stores st ON u.store_id = st.id
         WHERE st.store_name = ? AND u.role = 'tenant'
         LIMIT 1`,
        [store_name.trim()]
      );
      if (users.length) creator = users[0];
    }

    // Fall back to the system helpdesk user (first helpdesk account)
    if (!creator) {
      const [hd] = await db.query("SELECT id, name, email FROM users WHERE role = 'helpdesk' LIMIT 1");
      if (hd.length) {
        creator = hd[0];
      } else {
        // Last resort: first admin
        const [admins] = await db.query("SELECT id, name, email FROM users WHERE role = 'admin' LIMIT 1");
        if (!admins.length) {
          return res.status(500).json({ success: false, message: 'No system user available to own this ticket.' });
        }
        creator = admins[0];
      }
    }

    const { insertId, ticket_number } = await Ticket.create({
      user_id: creator.id,
      title: title.trim(),
      description: description?.trim() || null,
      category: category?.trim() || null,
      priority: priority || 'Medium',
      source: 'webhook',
      requester_name: requester_name || null,
      requester_phone: requester_phone || null,
    });

    const ticket = await Ticket.findById(insertId);
    const io = req.app.get('io');

    // Emit to admin room
    if (io) {
      io.to('admin_room').emit('ticket:created', ticket);
    }

    // Notify admins + helpdesk
    const [notifyUsers] = await db.query("SELECT id FROM users WHERE role IN ('admin','helpdesk')");
    for (const u of notifyUsers) {
      await createNotification(
        u.id,
        'New Ticket via Webhook',
        `${requester_name || creator.name} raised: ${title}`,
        'ticket_created',
        insertId,
        io
      );
    }

    // Send email to creator if they have one
    if (creator.email) {
      emailService.sendTicketCreated(ticket, creator).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      message: `Ticket ${ticket_number} created successfully.`,
      data: {
        ticket_number,
        ticket_id: insertId,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        sla_deadline: ticket.sla_deadline,
        created_at: ticket.created_at,
      },
    });
  } catch (err) {
    console.error('Webhook create ticket error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
