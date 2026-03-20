const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const ticketController = require('../controllers/ticketController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);
  if (ext || mime) {
    cb(null, true);
  } else {
    cb(new Error('Only images and documents are allowed.'));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', verifyToken, ticketController.getTickets);
router.get('/export/excel', requireAdmin, ticketController.exportExcel);
router.get('/:id', verifyToken, ticketController.getTicketById);
router.get('/:id/updates', verifyToken, ticketController.getTicketUpdates);

router.post('/',
  verifyToken,
  [
    body('title').trim().notEmpty().withMessage('Ticket title is required.'),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority.'),
  ],
  ticketController.createTicket
);

router.put('/:id', verifyToken, ticketController.updateTicket);
router.patch('/:id/assign-staff', requireAdmin, ticketController.assignStaff);
router.post('/:id/updates', verifyToken, upload.single('attachment'), ticketController.addTicketUpdate);

module.exports = router;
