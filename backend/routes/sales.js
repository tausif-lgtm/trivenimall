const router = require('express').Router();
const multer = require('multer');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/salesController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', verifyToken, ctrl.getSales);
router.get('/summary', verifyToken, ctrl.getSalesSummary);
router.get('/sample', ctrl.downloadSample);
router.post('/', verifyToken, ctrl.upsertSales);
router.post('/bulk', verifyToken, upload.single('file'), ctrl.bulkUpload);
router.delete('/:id', verifyToken, requireAdmin, ctrl.deleteSales);

module.exports = router;
