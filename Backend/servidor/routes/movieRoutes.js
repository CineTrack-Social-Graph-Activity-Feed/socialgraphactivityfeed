const express = require('express');
const router = express.Router();

const movieController = require('../controllers/movieController');
router.post('/', movieController.upsertMovie);
router.get('/:movie_id', movieController.getMovie);
router.get('/', movieController.getMovies);
router.delete('/:movie_id', movieController.deleteMovie);

module.exports = router;
