const https = require('https');

const USERID = process.env.GUPSHUP_USERID;
const PASSWORD = process.env.GUPSHUP_PASSWORD;
const ADMIN_PHONE = process.env.WA_ADMIN_PHONE;

/**
 * Send a plain-text WhatsApp message via Gupshup to the admin number.
 */
function sendWhatsApp(phone, message) {
  return new Promise((resolve) => {
    if (!USERID || !PASSWORD || !phone) {
      console.warn('[WhatsApp] Missing credentials or phone — skipping.');
      return resolve(false);
    }

    const params = new URLSearchParams({
      userid: USERID,
      password: PASSWORD,
      send_to: phone,
      v: '1.1',
      format: 'json',
      msg_type: 'TEXT',
      method: 'SENDMESSAGE',
      msg: message,
    });

    const url = `https://mediaapi.smsgupshup.com/GatewayAPI/rest?${params.toString()}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('[WhatsApp] Response:', data);
        resolve(true);
      });
    }).on('error', (err) => {
      console.error('[WhatsApp] Error:', err.message);
      resolve(false);
    });
  });
}

/**
 * Send new ticket notification to admin.
 * Variables: Ticket ID, Store/Shop, Raised By, Category, Priority, Issue, Created At
 */
function sendNewTicketAlert(ticket) {
  const storeName = ticket.store_name || 'N/A';
  const raisedBy = ticket.customer_name || ticket.requester_name || 'N/A';

  // Format date+time as DD-MM-YYYY HH:MM AM/PM (IST)
  const d = ticket.created_at ? new Date(ticket.created_at) : new Date();
  const createdAt = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(d).replace(',', '');

  const message =
    `*New Ticket Created - Alcove Triveni Mall*\n\n` +
    `Ticket ID: ${ticket.ticket_number}\n` +
    `*Store/Shop*: ${storeName}\n` +
    `Raised By: ${raisedBy}\n\n` +
    `Category: ${ticket.category}\n` +
    `Priority: ${ticket.priority}\n\n` +
    `Issue:\n${ticket.description || ticket.title}\n\n` +
    `Created At: ${createdAt}\n\n` +
    `Please check and take necessary action.`;

  return sendWhatsApp(ADMIN_PHONE, message);
}

/**
 * Send ticket assigned notification to the assigned staff member.
 * @param {object} ticket  - full ticket object (from Ticket.findById)
 * @param {object} staff   - { name, mobile }
 */
function sendTicketAssigned(ticket, staff) {
  if (!staff.mobile) {
    console.warn('[WhatsApp] Staff has no mobile — skipping assignment alert.');
    return Promise.resolve(false);
  }

  const storeName = ticket.store_name || 'N/A';

  // Format SLA deadline: "19 Mar 2026, 6:00 PM" (IST)
  const slaDate = ticket.sla_deadline ? new Date(ticket.sla_deadline) : null;
  const slaStr = slaDate
    ? new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      }).format(slaDate).replace(',', '')
    : 'N/A';

  const message =
    `*Ticket Assigned - Alcove Triveni Mall*\n\n` +
    `Ticket ID: ${ticket.ticket_number}\n` +
    `Store/Shop: ${storeName}\n\n` +
    `Category: ${ticket.category}\n` +
    `Priority: ${ticket.priority}\n\n` +
    `Issue:\n${ticket.description || ticket.title}\n` +
    `Assigned To: ${staff.name}\n` +
    `SLA Deadline: ${slaStr}\n\n` +
    `Please start work on this ticket.`;

  return sendWhatsApp(staff.mobile, message);
}

module.exports = { sendNewTicketAlert, sendTicketAssigned };
