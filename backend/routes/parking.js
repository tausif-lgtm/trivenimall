const router = require('express').Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/parkingController');

// Public (security staff uses this without login)
router.post('/', ctrl.addEntry);

// Admin
router.get('/', verifyToken, ctrl.getEntries);
router.get('/stats', verifyToken, ctrl.getParkingStats);
router.patch('/:id/exit', ctrl.recordExit);

module.exports = router;
