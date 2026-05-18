const express = require('express');
const router = express.Router();
const { register, login, updateProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// @route   POST api/auth/register
router.post('/register', register);

// @route   POST api/auth/login
router.post('/login', login);

// @route   PUT api/auth/profile
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;
