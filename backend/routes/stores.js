const router = require('express').Router();
const { verifyToken, requireAdmin, requireStaff } = require('../middleware/auth');
const ctrl = require('../controllers/storesController');

router.get('/', verifyToken, ctrl.getStores);
router.get('/:id', verifyToken, ctrl.getStore);
router.post('/', verifyToken, requireAdmin, ctrl.createStore);
router.put('/:id', verifyToken, requireAdmin, ctrl.updateStore);
router.delete('/:id', verifyToken, requireAdmin, ctrl.deleteStore);

module.exports = router;
