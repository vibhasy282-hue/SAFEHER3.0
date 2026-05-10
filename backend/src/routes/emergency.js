const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  triggerSOS,
  resolveEmergency,
  getEmergencyHistory,
  getEmergencyById
} = require('../controllers/emergencyController');

router.post('/sos', protect, triggerSOS);
router.post('/resolve', protect, resolveEmergency);
router.get('/history', protect, getEmergencyHistory);
router.get('/:id', protect, getEmergencyById);

module.exports = router;
