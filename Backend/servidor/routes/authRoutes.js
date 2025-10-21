const express = require('express');
const { login, refresh, me } = require('../controllers/authController');
const { authenticateJWT } = require('../middlewares/auth');

const router = express.Router();

// Public endpoints
router.post('/auth/login', login);
router.post('/auth/refresh', refresh);

// Protected helper endpoint
router.get('/auth/me', authenticateJWT, me);

module.exports = router;
