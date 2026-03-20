const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { requireAdmin, verifyToken } = require('../middleware/auth');

router.get('/', requireAdmin, userController.getAllUsers);
router.get('/staff', verifyToken, userController.getStaffList);
router.get('/customers', verifyToken, userController.getCustomerList);
router.get('/:id', requireAdmin, userController.getUserById);

router.post('/',
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    body('role').isIn(['admin', 'staff', 'customer']).withMessage('Valid role is required.'),
  ],
  userController.createUser
);

router.put('/:id', requireAdmin, userController.updateUser);
router.delete('/:id', requireAdmin, userController.deleteUser);

module.exports = router;
