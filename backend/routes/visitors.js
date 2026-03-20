const router = require('express').Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/visitorController');

// Public
router.post('/', ctrl.registerVisitor);

// Admin
router.get('/', verifyToken, ctrl.getVisitors);
router.get('/stats', verifyToken, ctrl.getVisitorStats);
router.patch('/:id/qualify', verifyToken, requireAdmin, ctrl.markQualified);

module.exports = router;
