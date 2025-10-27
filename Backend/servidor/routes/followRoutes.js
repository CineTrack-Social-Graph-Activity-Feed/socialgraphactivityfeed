const express = require('express');
const { followUser, unfollowUser, getFeed, getFollowedUsers, getFollowersUsers } = require('../controllers/followController');

const router = express.Router();

// Rutas de seguimiento
router.post('/follow', followUser);
router.post('/unfollow', unfollowUser);

// Ruta del feed
router.get('/feed', getFeed);

// Ruta para obtener los usuarios que tú sigues
router.get('/followed', getFollowedUsers);

// Ruta para obtener los usuarios que te siguen
router.get('/followers', getFollowersUsers);

module.exports = router;