const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAdmin, verifyToken } = require('../middleware/auth');

router.get('/admin', requireAdmin, dashboardController.getAdminDashboard);
router.get('/customer', verifyToken, dashboardController.getCustomerDashboard);
router.get('/staff', verifyToken, dashboardController.getStaffDashboard);

module.exports = router;
