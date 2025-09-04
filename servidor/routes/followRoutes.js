const express = require('express');
const { followUser, unfollowUser, getFeed } = require('../controllers/followController');

const router = express.Router();

// Rutas de seguimiento
router.post('/follow', followUser);
router.post('/unfollow', unfollowUser);

// Ruta del feed
router.get('/feed', getFeed);

module.exports = router;
