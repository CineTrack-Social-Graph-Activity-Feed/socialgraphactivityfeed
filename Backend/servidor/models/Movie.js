const mongoose = require('mongoose');

/**
 * Modelo de Movie (Película)
 * Almacena información básica de películas consumidas desde el módulo de Películas
 */
const movieSchema = new mongoose.Schema({
  // ID de la película desde el módulo de Películas
  movie_id: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  
  // Ruta del poster de la película
  poster: {
    type: String,
    required: true,
    trim: true
  },
  
  // Título de la película
  titulo: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  // Estado de actividad (permite ocultar sin borrar)
  activa: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Timestamps
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
movieSchema.index({ movie_id: 1 });
movieSchema.index({ titulo: 1 });

/**
 * Crear o actualizar película desde datos del módulo de Películas
 */
movieSchema.statics.upsertFromMovieData = async function(movieData) {
  const {
    id,
    poster,
    titulo,
    activa
  } = movieData;

  if (!id || !poster || !titulo) {
    throw new Error('Faltan datos requeridos: id, poster o titulo');
  }

  const update = {
    movie_id: id,
    poster,
    titulo,
    updated_at: new Date(),
    syncedAt: new Date()
  };
  if (activa !== undefined) {
    update.activa = Boolean(activa);
  }

  const movie = await this.findOneAndUpdate(
    { movie_id: id },
    update,
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );

  return movie;
};

/**
 * Obtener película por movie_id
 */
movieSchema.statics.getByMovieId = async function(movieId) {
  return await this.findOne({ movie_id: movieId });
};

/**
 * Obtener múltiples películas por sus IDs
 */
movieSchema.statics.getByMovieIds = async function(movieIds) {
  return await this.find({ movie_id: { $in: movieIds }, activa: { $ne: false } });
};

/** Marcar película inactiva (soft delete) */
movieSchema.statics.markInactive = async function(movieId) {
  return await this.findOneAndUpdate(
    { movie_id: movieId },
    { activa: false, updated_at: new Date(), syncedAt: new Date() },
    { new: true }
  );
};

module.exports = mongoose.model('Movie', movieSchema);
