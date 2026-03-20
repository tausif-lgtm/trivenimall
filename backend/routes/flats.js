const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const flatController = require('../controllers/flatController');
const { requireAdmin, verifyToken } = require('../middleware/auth');

router.get('/', requireAdmin, flatController.getAllFlats);
router.get('/my-flats', verifyToken, flatController.getMyFlats);
router.get('/:id', verifyToken, flatController.getFlatById);

router.post('/',
  requireAdmin,
  [
    body('project_id').isInt().withMessage('Valid project ID is required.'),
    body('flat_number').trim().notEmpty().withMessage('Flat number is required.'),
  ],
  flatController.createFlat
);

router.put('/:id', requireAdmin, flatController.updateFlat);
router.patch('/:id/assign-owner', requireAdmin, flatController.assignOwner);
router.delete('/:id', requireAdmin, flatController.deleteFlat);

module.exports = router;
