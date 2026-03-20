const router = require('express').Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/communicationController');

// Call Logs
router.get('/call-logs', verifyToken, ctrl.getCallLogs);
router.post('/call-logs', verifyToken, ctrl.createCallLog);
router.delete('/call-logs/:id', verifyToken, requireAdmin, ctrl.deleteCallLog);

// Email Logs
router.get('/email-logs', verifyToken, ctrl.getEmailLogs);

// Send Email
router.post('/send-email', verifyToken, ctrl.sendEmail);

// Send WhatsApp
router.post('/send-whatsapp', verifyToken, ctrl.sendWhatsApp);

module.exports = router;
