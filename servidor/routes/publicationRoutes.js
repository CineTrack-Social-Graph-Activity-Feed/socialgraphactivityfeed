const express = require('express');
const { 
  createPublication, 
  getPublication, 
  getUserPublications, 
  deletePublication 
} = require('../controllers/publicationController');

const router = express.Router();

// Rutas de publicaciones
router.post('/publication', createPublication);
router.get('/publication/:publication_id', getPublication);
router.get('/publication/user/:user_id', getUserPublications);
router.delete('/publication/:publication_id', deletePublication);

module.exports = router;
