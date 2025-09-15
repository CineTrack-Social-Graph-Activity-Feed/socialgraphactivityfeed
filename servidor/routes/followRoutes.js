const express = require('express');
const { followUser, unfollowUser, getFeed, getFollowed, getFollowers } = require('../controllers/followController');

const router = express.Router();

// Rutas de seguimiento
router.post('/follow', followUser);
router.post('/unfollow', unfollowUser);

// Ruta del feed
router.get('/feed', getFeed);

// Listas de seguidos y seguidores
router.get('/followed', getFollowed);
router.get('/followers', getFollowers);

module.exports = router;
