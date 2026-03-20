const { validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const TicketUpdate = require('../models/TicketUpdate');
const db = require('../config/db');
const emailService = require('../services/emailService');
const { createNotification } = require('./notificationController');
const whatsappService = require('../services/whatsappService');

// Roles that create tickets on behalf of others (helpdesk creates for walk-in visitors)
const CREATOR_ROLES = ['admin', 'staff', 'customer', 'tenant', 'security', 'helpdesk'];

// Roles that see only their own submitted tickets
const OWN_TICKET_ROLES = ['customer', 'tenant', 'security'];

exports.getTickets = async (req, res) => {
  try {
    const { status, priority, category, source } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;
    if (source) filters.source = source;

    const role = req.user.role;

    if (OWN_TICKET_ROLES.includes(role)) {
      // Can only see tickets they created
      filters.user_id = req.user.id;
    } else if (role === 'staff') {
      // Staff see only tickets assigned to them
      filters.assigned_staff = req.user.id;
    }
    // helpdesk and admin see all tickets (no extra filter)

    const tickets = await Ticket.findAll(filters);
    return res.json({ success: true, data: tickets });
  } catch (err) {
    console.error('Get tickets error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const role = req.user.role;

    // Own-ticket roles: must be the ticket creator
    if (OWN_TICKET_ROLES.includes(role) && ticket.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    // Staff: must be assigned
    if (role === 'staff' && ticket.assigned_staff !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    // helpdesk and admin: full access

    const updates = await TicketUpdate.findByTicketId(ticket.id);
    return res.json({ success: true, data: { ...ticket, updates } });
  } catch (err) {
    console.error('Get ticket error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.createTicket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const role = req.user.role;
  const { title, description, category, priority, requester_name, requester_phone } = req.body;

  // Determine source tag
  const sourceMap = { helpdesk: 'helpdesk', admin: 'web', default: 'web' };
  const source = sourceMap[role] || sourceMap.default;

  try {
    const { insertId, ticket_number } = await Ticket.create({
      user_id: req.user.id,
      title,
      description,
      category,
      priority,
      source,
      requester_name: role === 'helpdesk' ? (requester_name || null) : null,
      requester_phone: role === 'helpdesk' ? (requester_phone || null) : null,
    });

    const ticket = await Ticket.findById(insertId);
    const io = req.app.get('io');

    // Auto-assign staff based on category (skip for helpdesk — admin assigns manually)
    if (role !== 'helpdesk') {
      const autoStaffId = await Ticket.autoAssign(insertId, category);
      if (autoStaffId && io) {
        const autoAssignedTicket = await Ticket.findById(insertId);
        io.to(`user_${autoStaffId}`).emit('ticket:assigned', autoAssignedTicket);

        const [staffRows] = await db.query('SELECT name, mobile FROM users WHERE id = ?', [autoStaffId]);
        if (staffRows.length) {
          await createNotification(
            autoStaffId,
            'Ticket Auto-Assigned to You',
            `"${title}" has been auto-assigned based on category`,
            'ticket_assigned',
            insertId,
            io
          );
          whatsappService.sendTicketAssigned(autoAssignedTicket, staffRows[0]).catch(() => {});
        }
      }
    }

    // Socket: emit to admin room
    if (io) {
      io.to('admin_room').emit('ticket:created', ticket);
    }

    // Notify all admins
    const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
    const roleLabel = { tenant: 'Tenant', security: 'Security', helpdesk: 'Help Desk', customer: 'Customer', staff: 'Staff', admin: 'Admin' };
    for (const admin of admins) {
      await createNotification(
        admin.id,
        'New Ticket Submitted',
        `[${roleLabel[role] || role}] ${req.user.name}: ${title}`,
        'ticket_created',
        insertId,
        io
      );
    }

    // Also notify helpdesk users when tenant/security creates a ticket
    if (['tenant', 'security', 'customer'].includes(role)) {
      const [helpdesks] = await db.query("SELECT id FROM users WHERE role = 'helpdesk'");
      for (const hd of helpdesks) {
        await createNotification(
          hd.id,
          'New Ticket Submitted',
          `${req.user.name} raised: ${title}`,
          'ticket_created',
          insertId,
          io
        );
      }
    }

    // Email confirmation to creator
    const creator = { name: req.user.name, email: req.user.email };
    emailService.sendTicketCreated(ticket, creator).catch(() => {});

    // WhatsApp alert to admin
    whatsappService.sendNewTicketAlert(ticket).catch(() => {});

    return res.status(201).json({
      success: true,
      data: ticket,
      message: `Ticket ${ticket_number} created successfully.`,
    });
  } catch (err) {
    console.error('Create ticket error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const role = req.user.role;
    const oldStatus = ticket.status;
    const { title, description, category, priority, status, assigned_staff } = req.body;

    // Own-ticket roles: can only edit their own Open tickets
    if (OWN_TICKET_ROLES.includes(role)) {
      if (ticket.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      if (ticket.status !== 'Open') {
        return res.status(400).json({ success: false, message: 'Cannot edit a ticket that is already being processed.' });
      }
    }

    // Staff: can only update status of assigned tickets (In Progress / Resolved)
    if (role === 'staff') {
      if (ticket.assigned_staff !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      const allowedStatuses = ['In Progress', 'Resolved'];
      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Staff can only set status to In Progress or Resolved.' });
      }
      await Ticket.update(req.params.id, { status });

    // HelpDesk: can update details + status, but NOT resolve/close (admin only resolves)
    } else if (role === 'helpdesk') {
      const blockedStatuses = ['Resolved', 'Closed'];
      if (status && blockedStatuses.includes(status)) {
        return res.status(403).json({ success: false, message: 'Help Desk cannot resolve or close tickets.' });
      }
      await Ticket.update(req.params.id, { title, description, category, priority, status });

    // Admin: full update
    } else if (role === 'admin') {
      await Ticket.update(req.params.id, { title, description, category, priority, status, assigned_staff });

    // Customer/Tenant/Security: limited to editing description of Open tickets
    } else {
      await Ticket.update(req.params.id, { description });
    }

    const updated = await Ticket.findById(req.params.id);
    const io = req.app.get('io');

    // If status changed → notify ticket creator
    if (status && status !== oldStatus) {
      if (io) {
        io.to(`user_${ticket.user_id}`).emit('ticket:updated', updated);
      }

      const [ownerRows] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [ticket.user_id]);
      if (ownerRows.length > 0) {
        const owner = ownerRows[0];
        const notifType = status === 'Resolved' ? 'ticket_resolved' : 'ticket_updated';
        await createNotification(
          owner.id,
          `Ticket Status: ${status}`,
          `Your ticket "${ticket.title}" is now ${status}`,
          notifType,
          ticket.id,
          io
        );

        if (status === 'Resolved') {
          emailService.sendTicketResolved(updated, owner).catch(() => {});
        } else {
          emailService.sendTicketStatusUpdated(updated, owner, status).catch(() => {});
        }
      }
    }

    return res.json({ success: true, data: updated, message: 'Ticket updated successfully.' });
  } catch (err) {
    console.error('Update ticket error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.assignStaff = async (req, res) => {
  const { staff_id } = req.body;

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    await Ticket.assignStaff(req.params.id, staff_id);
    const updated = await Ticket.findById(req.params.id);
    const io = req.app.get('io');

    if (staff_id) {
      if (io) {
        io.to(`user_${staff_id}`).emit('ticket:assigned', updated);
        io.to(`user_${ticket.user_id}`).emit('ticket:updated', updated);
      }

      const [staffRows] = await db.query('SELECT id, name, email, mobile FROM users WHERE id = ?', [staff_id]);
      const [customerRows] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [ticket.user_id]);

      if (staffRows.length > 0) {
        const staff = staffRows[0];
        await createNotification(
          staff.id,
          'Ticket Assigned to You',
          `"${ticket.title}" has been assigned to you`,
          'ticket_assigned',
          ticket.id,
          io
        );

        const customer = customerRows[0] || {};
        emailService.sendTicketAssigned(updated, staff, customer).catch(() => {});
        whatsappService.sendTicketAssigned(updated, staff).catch(() => {});
      }

      if (customerRows.length > 0) {
        const customer = customerRows[0];
        await createNotification(
          customer.id,
          'Staff Assigned to Your Ticket',
          `A staff member has been assigned to "${ticket.title}"`,
          'ticket_assigned',
          ticket.id,
          io
        );
      }
    }

    return res.json({ success: true, data: updated, message: 'Staff assigned successfully.' });
  } catch (err) {
    console.error('Assign staff error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.addTicketUpdate = async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required.' });
  }

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const role = req.user.role;

    // Permission: own-ticket roles can only comment on their own tickets
    if (OWN_TICKET_ROLES.includes(role) && ticket.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    // Staff can only comment on assigned tickets
    if (role === 'staff' && ticket.assigned_staff !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    // helpdesk and admin can comment on any ticket

    const attachment = req.file ? req.file.filename : null;

    await TicketUpdate.create({
      ticket_id: ticket.id,
      message: message.trim(),
      updated_by: req.user.id,
      attachment,
    });

    // Auto-move to In Progress when staff/admin/helpdesk replies on Open or Assigned ticket
    if (['admin','staff','helpdesk'].includes(role) && ['Open','Assigned'].includes(ticket.status)) {
      await Ticket.update(req.params.id, { status: 'In Progress' });
    } else {
      await Ticket.update(req.params.id, {});
    }

    const updates = await TicketUpdate.findByTicketId(ticket.id);
    const io = req.app.get('io');

    const isCreator = OWN_TICKET_ROLES.includes(role);

    if (!isCreator) {
      // Staff / admin / helpdesk commented → notify ticket owner
      const [ownerRows] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [ticket.user_id]);
      if (ownerRows.length > 0) {
        await createNotification(
          ownerRows[0].id,
          'New Update on Your Ticket',
          `${req.user.name} added an update to "${ticket.title}"`,
          'ticket_updated',
          ticket.id,
          io
        );
      }
      if (io) io.to(`user_${ticket.user_id}`).emit('ticket:updated', { ticket_id: ticket.id });
    } else {
      // Owner commented → notify admins, helpdesk, and assigned staff
      const [admins] = await db.query("SELECT id FROM users WHERE role IN ('admin','helpdesk')");
      for (const a of admins) {
        await createNotification(
          a.id,
          'Reply on Ticket',
          `${req.user.name} replied on "${ticket.title}"`,
          'ticket_updated',
          ticket.id,
          io
        );
      }
      if (ticket.assigned_staff) {
        await createNotification(
          ticket.assigned_staff,
          'Reply on Ticket',
          `${req.user.name} replied on "${ticket.title}"`,
          'ticket_updated',
          ticket.id,
          io
        );
        if (io) io.to(`user_${ticket.assigned_staff}`).emit('ticket:updated', { ticket_id: ticket.id });
      }
    }

    return res.status(201).json({ success: true, data: updates, message: 'Update added successfully.' });
  } catch (err) {
    console.error('Add ticket update error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getTicketUpdates = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const role = req.user.role;
    if (OWN_TICKET_ROLES.includes(role) && ticket.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (role === 'staff' && ticket.assigned_staff !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const updates = await TicketUpdate.findByTicketId(ticket.id);
    return res.json({ success: true, data: updates });
  } catch (err) {
    console.error('Get ticket updates error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const xlsx = require('xlsx');
    const [tickets] = await db.query(`
      SELECT
        t.ticket_number AS "Ticket#",
        t.title AS "Title",
        t.category AS "Category",
        t.priority AS "Priority",
        t.status AS "Status",
        t.source AS "Source",
        u.name AS "Raised By",
        u.role AS "Raised By Role",
        COALESCE(t.requester_name, '') AS "Walk-in Customer",
        COALESCE(t.requester_phone, '') AS "Walk-in Phone",
        st.store_name AS "Store",
        s.name AS "Assigned Staff",
        t.sla_deadline AS "SLA Deadline",
        t.created_at AS "Created",
        t.updated_at AS "Updated"
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users s ON t.assigned_staff = s.id
      LEFT JOIN stores st ON u.store_id = st.id
      ORDER BY t.created_at DESC
    `);

    const ws = xlsx.utils.json_to_sheet(tickets);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Tickets');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=tickets.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Export excel error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
