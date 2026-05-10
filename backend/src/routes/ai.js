const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  analyzeVoice,
  analyzeEmotion,
  analyzeGesture,
  processAIEvent
} = require('../controllers/aiController');

router.post('/voice', protect, analyzeVoice);
router.post('/emotion', protect, analyzeEmotion);
router.post('/gesture', protect, analyzeGesture);
router.post('/event', protect, processAIEvent);

module.exports = router;
