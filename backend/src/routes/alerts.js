const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAlerts,
  updateAlertStatus,
  getGuardianAlerts
} = require('../controllers/alertController');

router.get('/', protect, getAlerts);
router.get('/guardian', protect, getGuardianAlerts);
router.put('/:id/status', protect, updateAlertStatus);

module.exports = router;
