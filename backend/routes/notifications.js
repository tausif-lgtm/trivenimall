const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.get('/', verifyToken, notificationController.getNotifications);
router.get('/unread-count', verifyToken, notificationController.getUnreadCount);
router.put('/read-all', verifyToken, notificationController.markAllRead);
router.put('/:id/read', verifyToken, notificationController.markOneRead);
router.post('/broadcast', verifyToken, requireAdmin, notificationController.sendBroadcast);

module.exports = router;
