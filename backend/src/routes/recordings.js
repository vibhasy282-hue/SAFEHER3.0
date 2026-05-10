const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const {
  uploadRecording,
  getRecordings,
  getRecordingById,
  deleteRecording
} = require('../controllers/recordingController');

router.post('/upload', protect, upload.single('file'), handleUploadError, uploadRecording);
router.post('/upload-base64', protect, uploadRecording);
router.get('/', protect, getRecordings);
router.get('/:id', protect, getRecordingById);
router.delete('/:id', protect, deleteRecording);

module.exports = router;
