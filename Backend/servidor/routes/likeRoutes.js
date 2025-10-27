const express = require('express');
const { addLike, removeLike, getPublicationLikes } = require('../controllers/likeController');

const router = express.Router();

// Rutas de likes
router.post('/like', addLike);
router.delete('/like/:like_id', removeLike);
router.get('/like/publication/:publication_id', getPublicationLikes);

module.exports = router;