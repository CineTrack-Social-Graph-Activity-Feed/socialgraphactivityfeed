const express = require('express');
const followRoutes = require('./followRoutes');
const likeRoutes = require('./likeRoutes');
const commentRoutes = require('./commentRoutes');
const publicationRoutes = require('./publicationRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'SocialGraphActivityFeed API is running',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
router.use('/api', followRoutes);
router.use('/api', likeRoutes);
router.use('/api', commentRoutes);
router.use('/api', publicationRoutes);
router.use('/api', userRoutes);

// Ruta catch-all para 404
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

module.exports = router;
