const db = require('../config/db');
const emailService = require('../services/emailService');

exports.getCallLogs = async (req, res) => {
  try {
    const { customer_id } = req.query;
    let query = `SELECT cl.*,
                   c.name as customer_name, c.email as customer_email, c.mobile as customer_mobile,
                   s.name as staff_name,
                   t.ticket_number
                 FROM call_logs cl
                 JOIN users c ON cl.customer_id = c.id
                 JOIN users s ON cl.staff_id = s.id
                 LEFT JOIN tickets t ON cl.ticket_id = t.id`;
    const params = [];
    if (customer_id) { query += ' WHERE cl.customer_id = ?'; params.push(customer_id); }
    query += ' ORDER BY cl.call_date DESC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.createCallLog = async (req, res) => {
  const { customer_id, call_date, call_type, duration_minutes, notes, ticket_id } = req.body;
  if (!customer_id || !call_date) return res.status(400).json({ success: false, message: 'customer_id and call_date required.' });
  try {
    const [result] = await db.execute(
      'INSERT INTO call_logs (customer_id, staff_id, call_date, call_type, duration_minutes, notes, ticket_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [customer_id, req.user.id, call_date, call_type || 'outbound', duration_minutes || 0, notes || null, ticket_id || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Call log saved.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.deleteCallLog = async (req, res) => {
  try {
    await db.execute('DELETE FROM call_logs WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Call log deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.getEmailLogs = async (req, res) => {
  try {
    const { customer_id } = req.query;
    let query = `SELECT el.*,
                   c.name as customer_name, c.email as customer_email, c.mobile as customer_mobile,
                   s.name as staff_name
                 FROM email_logs el
                 JOIN users c ON el.customer_id = c.id
                 JOIN users s ON el.staff_id = s.id`;
    const params = [];
    if (customer_id) { query += ' WHERE el.customer_id = ?'; params.push(customer_id); }
    query += ' ORDER BY el.sent_at DESC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

exports.sendEmail = async (req, res) => {
  const { customer_id, subject, message } = req.body;
  if (!customer_id || !subject || !message) {
    return res.status(400).json({ success: false, message: 'customer_id, subject, message required.' });
  }
  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [customer_id]);
    if (!users.length) return res.status(404).json({ success: false, message: 'Customer not found.' });
    await emailService.sendCustomEmail(users[0].email, subject, message, users[0].name);
    // Save to email_logs
    await db.execute(
      'INSERT INTO email_logs (customer_id, staff_id, subject, message) VALUES (?, ?, ?, ?)',
      [customer_id, req.user.id, subject, message]
    );
    res.json({ success: true, message: 'Email sent successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to send email.' });
  }
};

exports.sendWhatsApp = async (req, res) => {
  const { customer_id, message } = req.body;
  if (!customer_id || !message) {
    return res.status(400).json({ success: false, message: 'customer_id and message required.' });
  }
  if (!process.env.GUPSHUP_USERID || !process.env.GUPSHUP_PASSWORD) {
    return res.status(503).json({
      success: false,
      message: 'WhatsApp not configured. Add GUPSHUP_USERID and GUPSHUP_PASSWORD to .env'
    });
  }
  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [customer_id]);
    if (!users.length) return res.status(404).json({ success: false, message: 'Customer not found.' });
    const customer = users[0];
    if (!customer.mobile) return res.status(400).json({ success: false, message: 'Customer has no mobile number.' });

    const mobile = customer.mobile.replace(/\D/g, '').slice(-10);
    const axios = require('axios');

    const params = new URLSearchParams({
      userid: process.env.GUPSHUP_USERID,
      password: process.env.GUPSHUP_PASSWORD,
      send_to: mobile,
      v: '1.1',
      format: 'json',
      msg_type: 'TEXT',
      method: 'SENDMESSAGE',
      msg: message,
    });

    const response = await axios.get(
      `https://mediaapi.smsgupshup.com/GatewayAPI/rest?${params.toString()}`
    );

    const data = response.data;
    // Gupshup returns { response: { status: 'success', ... } }
    if (data?.response?.status === 'success' || data?.response?.status === 'submitted') {
      res.json({ success: true, message: 'WhatsApp message sent via Gupshup.' });
    } else {
      const errMsg = data?.response?.details || data?.response?.status || 'Unknown error from Gupshup';
      res.status(500).json({ success: false, message: `Gupshup error: ${errMsg}` });
    }
  } catch (err) {
    console.error('sendWhatsApp error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to send WhatsApp.' });
  }
};
