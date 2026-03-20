const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const ADMIN_EMAIL = process.env.GMAIL_USER;

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alcove Triveni Mall Operations</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#c2410c;padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="color:#ffffff;font-size:22px;font-weight:bold;">Alcove Triveni Mall Operations</span>
                  <br>
                  <span style="color:#fed7aa;font-size:13px;">Mall Operations Management System</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
              This is an automated message from Alcove Triveni Mall Operations. Please do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const ticketInfoBlock = (ticket) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:16px 0;">
    <tr>
      <td style="padding:16px;">
        <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Ticket Details</p>
        <table width="100%" cellpadding="4" cellspacing="0">
          <tr>
            <td style="color:#64748b;font-size:13px;width:120px;">Ticket #</td>
            <td style="color:#1e293b;font-size:13px;font-weight:bold;font-family:monospace;">${ticket.ticket_number || ticket.id}</td>
          </tr>
          <tr>
            <td style="color:#64748b;font-size:13px;">Title</td>
            <td style="color:#1e293b;font-size:13px;">${ticket.title}</td>
          </tr>
          ${ticket.category ? `<tr><td style="color:#64748b;font-size:13px;">Category</td><td style="color:#1e293b;font-size:13px;">${ticket.category}</td></tr>` : ''}
          ${ticket.priority ? `<tr><td style="color:#64748b;font-size:13px;">Priority</td><td style="color:#1e293b;font-size:13px;">${ticket.priority}</td></tr>` : ''}
          ${ticket.status ? `<tr><td style="color:#64748b;font-size:13px;">Status</td><td style="color:#1e293b;font-size:13px;">${ticket.status}</td></tr>` : ''}
        </table>
      </td>
    </tr>
  </table>`;

const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Alcove Triveni Mall Operations" <${ADMIN_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`Email failed to ${to}:`, err.message);
  }
};

exports.sendTicketCreated = async (ticket, customer) => {
  const customerHtml = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">Ticket Raised Successfully</h2>
    <p style="margin:0 0 16px;color:#64748b;font-size:14px;">Your ticket has been received. Our team will review it shortly.</p>
    ${ticketInfoBlock(ticket)}
    <p style="margin:16px 0 0;color:#64748b;font-size:13px;">You will receive updates via email as the ticket progresses.</p>
  `);

  const adminHtml = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">New Ticket Submitted</h2>
    <p style="margin:0 0 16px;color:#64748b;font-size:14px;">A new support ticket has been submitted by <strong>${customer.name}</strong> (${customer.email}).</p>
    ${ticketInfoBlock(ticket)}
  `);

  await sendMail(customer.email, `Ticket #${ticket.ticket_number || ticket.id} Created — Alcove Triveni Mall Operations`, customerHtml);
  await sendMail(ADMIN_EMAIL, `New Ticket: ${ticket.title} — Alcove Triveni Mall Operations`, adminHtml);
};

exports.sendTicketAssigned = async (ticket, staff, customer) => {
  const staffHtml = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">Ticket Assigned to You</h2>
    <p style="margin:0 0 16px;color:#64748b;font-size:14px;">A ticket has been assigned to you for resolution.</p>
    ${ticketInfoBlock(ticket)}
    <p style="margin:16px 0 0;color:#64748b;font-size:13px;">Please log in to the portal to view details and take action.</p>
  `);

  const customerHtml = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">Staff Assigned to Your Ticket</h2>
    <p style="margin:0 0 16px;color:#64748b;font-size:14px;">Your ticket has been assigned to <strong>${staff.name}</strong> who will be handling it.</p>
    ${ticketInfoBlock(ticket)}
  `);

  if (staff.email) await sendMail(staff.email, `Ticket Assigned: ${ticket.title} — Alcove Triveni Mall Operations`, staffHtml);
  if (customer.email) await sendMail(customer.email, `Ticket #${ticket.ticket_number || ticket.id} Assigned — Alcove Triveni Mall Operations`, customerHtml);
};

exports.sendTicketStatusUpdated = async (ticket, customer, newStatus) => {
  const statusColors = {
    Open: '#3b82f6',
    'In Progress': '#f59e0b',
    Resolved: '#10b981',
    Closed: '#6b7280',
  };
  const color = statusColors[newStatus] || '#64748b';

  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">Ticket Status Updated</h2>
    <p style="margin:0 0 16px;color:#64748b;font-size:14px;">The status of your ticket has been updated.</p>
    ${ticketInfoBlock({ ...ticket, status: newStatus })}
    <p style="margin:16px 0 0;">
      New Status: <span style="display:inline-block;padding:4px 12px;background:${color}20;color:${color};border-radius:20px;font-size:13px;font-weight:600;">${newStatus}</span>
    </p>
  `);

  if (customer.email) await sendMail(customer.email, `Ticket #${ticket.ticket_number || ticket.id} Status: ${newStatus} — Alcove Triveni Mall Operations`, html);
};

exports.sendTicketResolved = async (ticket, customer) => {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#10b981;font-size:20px;">Ticket Resolved!</h2>
    <p style="margin:0 0 16px;color:#64748b;font-size:14px;">Great news! Your ticket has been marked as resolved by our team.</p>
    ${ticketInfoBlock(ticket)}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-top:16px;">
      <p style="margin:0;color:#166534;font-size:13px;">If your issue is not fully resolved, you can reopen the ticket by adding a comment on the portal.</p>
    </div>
  `);

  if (customer.email) await sendMail(customer.email, `Ticket #${ticket.ticket_number || ticket.id} Resolved — Alcove Triveni Mall Operations`, html);
};

exports.sendCustomEmail = async (to, subject, message, recipientName) => {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">Message from Alcove Triveni Mall Operations</h2>
    <p style="margin:0 0 16px;color:#64748b;font-size:14px;">Dear <strong>${recipientName || 'User'}</strong>,</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:16px 0;">
      <p style="margin:0;color:#1e293b;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</p>
    </div>
  `);
  await sendMail(to, subject, html);
};

exports.sendPasswordResetOTP = async (email, otp) => {
  const html = baseTemplate(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">Password Reset Request</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">We received a request to reset your Alcove Triveni Mall Operations account password. Use the OTP below:</p>
    <div style="text-align:center;margin:24px 0;">
      <div style="display:inline-block;background:#1e40af;color:#ffffff;font-size:36px;font-weight:bold;letter-spacing:12px;padding:20px 32px;border-radius:12px;font-family:monospace;">
        ${otp}
      </div>
    </div>
    <p style="text-align:center;color:#ef4444;font-size:13px;margin:16px 0 0;">This OTP is valid for 15 minutes only.</p>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin:8px 0 0;">If you did not request a password reset, please ignore this email.</p>
  `);

  await sendMail(email, 'Password Reset OTP — Alcove Triveni Mall Operations', html);
};
