const router = require('express').Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/constructionController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/construction');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Updates
router.get('/updates', verifyToken, ctrl.getUpdates);
router.post('/updates', verifyToken, requireAdmin, ctrl.createUpdate);
router.delete('/updates/:id', verifyToken, requireAdmin, ctrl.deleteUpdate);

// Photos
router.get('/photos', verifyToken, ctrl.getPhotos);
router.post('/photos', verifyToken, requireAdmin, upload.single('photo'), ctrl.uploadPhoto);
router.delete('/photos/:id', verifyToken, requireAdmin, ctrl.deletePhoto);

// Possession Timeline
router.get('/timeline', verifyToken, ctrl.getTimeline);
router.post('/timeline', verifyToken, requireAdmin, ctrl.createMilestone);
router.put('/timeline/:id', verifyToken, requireAdmin, ctrl.updateMilestone);
router.delete('/timeline/:id', verifyToken, requireAdmin, ctrl.deleteMilestone);

module.exports = router;
