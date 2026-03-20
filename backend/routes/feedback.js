const router = require('express').Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/feedbackController');

// Public - no auth needed
router.post('/', ctrl.submitFeedback);

// Admin only
router.get('/', verifyToken, ctrl.getFeedback);
router.get('/analytics', verifyToken, ctrl.getFeedbackAnalytics);

module.exports = router;
