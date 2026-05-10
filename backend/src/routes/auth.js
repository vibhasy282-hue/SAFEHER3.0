const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  refreshToken,
  forgotPassword,
  resetPassword,
  guestLogin
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/guest', guestLogin);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
