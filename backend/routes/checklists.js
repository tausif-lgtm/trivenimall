const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ctrl = require('../controllers/checklistController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Multer for checklist photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/checklists'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase());
    cb(null, ok);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── Admin: Template Management ─────────────────────────────────────────────
router.get('/templates',          requireAdmin, ctrl.getTemplates);
router.get('/templates/:id',      requireAdmin, ctrl.getTemplateById);
router.post('/templates',         requireAdmin, ctrl.createTemplate);
router.put('/templates/:id',      requireAdmin, ctrl.updateTemplate);
router.delete('/templates/:id',   requireAdmin, ctrl.deleteTemplate);

// ── Admin: Scheduling & Monitoring ────────────────────────────────────────
router.post('/generate',          requireAdmin, ctrl.generateSchedules);
router.get('/monitoring',         requireAdmin, ctrl.getMonitoring);
router.get('/history',            requireAdmin, ctrl.getHistory);

// ── Staff: My Checklists ──────────────────────────────────────────────────
router.get('/my',                 verifyToken,  ctrl.getMyChecklists);
router.get('/schedules/:id',      verifyToken,  ctrl.getScheduleById);
router.put('/schedules/:scheduleId/items/:itemId', verifyToken, upload.single('photo'), ctrl.updateItem);
router.post('/schedules/:id/submit', verifyToken, ctrl.submitSchedule);

module.exports = router;
