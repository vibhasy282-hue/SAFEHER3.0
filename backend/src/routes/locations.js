const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  updateLocation,
  getLocationHistory,
  getCurrentLocation,
  getGuardianTracking,
  getNearbySafeSpots
} = require('../controllers/locationController');

router.post('/update', protect, updateLocation);
router.get('/history', protect, getLocationHistory);
router.get('/current', protect, getCurrentLocation);
router.get('/tracking/:userId', protect, getGuardianTracking);
router.get('/safe-spots', protect, getNearbySafeSpots);

module.exports = router;
