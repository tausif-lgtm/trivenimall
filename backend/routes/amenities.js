const router = require('express').Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/amenityController');

// Amenities CRUD (admin)
router.get('/', verifyToken, ctrl.getAmenities);
router.post('/', verifyToken, requireAdmin, ctrl.createAmenity);
router.put('/:id', verifyToken, requireAdmin, ctrl.updateAmenity);
router.delete('/:id', verifyToken, requireAdmin, ctrl.deleteAmenity);

// Bookings
router.get('/bookings', verifyToken, ctrl.getBookings);
router.post('/bookings', verifyToken, ctrl.createBooking);
router.patch('/bookings/:id/status', verifyToken, requireAdmin, ctrl.updateBookingStatus);

module.exports = router;
