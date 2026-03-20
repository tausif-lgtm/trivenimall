const router = require('express').Router();
const multer = require('multer');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/footfallController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', verifyToken, ctrl.getFootfall);
router.get('/summary', verifyToken, ctrl.getFootfallSummary);
router.get('/analytics', verifyToken, ctrl.getFootfallAnalytics);
router.get('/gates', verifyToken, ctrl.getGates);
router.get('/sample', ctrl.downloadSample);
router.post('/', verifyToken, ctrl.addFootfall);
router.post('/bulk', verifyToken, upload.single('file'), ctrl.bulkUpload);
router.delete('/:id', verifyToken, requireAdmin, ctrl.deleteFootfall);

module.exports = router;
