const express = require('express');
const { addComment, deleteComment, getPublicationComments } = require('../controllers/commentController');

const router = express.Router();

// Rutas de comentarios
router.post('/comment', addComment);
router.delete('/comment/:comment_id', deleteComment);
router.get('/comment/publication/:publication_id', getPublicationComments);

module.exports = router;
