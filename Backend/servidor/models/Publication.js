const mongoose = require('mongoose');

/**
 * Modelo UNIFICADO de Publication/Review
 * Compatible con el servidor principal Y las reseñas del Core
 */
const publicationSchema = new mongoose.Schema({
  // ID de la reseña desde el Core (si viene de ahí)
  review_id: {
    type: Number,
    unique: true,
    sparse: true, // Permite nulls pero unique cuando existe
    index: true
  },
  
  // ID del autor (compatible con ambos sistemas)
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true // Opcional si viene user_id
  },
  user_id: {
    type: String, // ID del usuario desde el Core
    sparse: true,
    index: true
  },
  
  // Tipo de publicación
  type: {
    type: String,
    default: 'review',
    enum: ['review', 'rating', 'list'],
    lowercase: true
  },
  
  // ID de la película/serie
  target_id: {
    type: String, // Para compatibilidad con servidor
    sparse: true
  },
  movie_id: {
    type: Number, // Desde el Core
    sparse: true,
    index: true
  },
  
  // Título de la reseña (desde el Core)
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Contenido (ambos nombres para compatibilidad)
  content: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  body: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  
  // Rating
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Campos adicionales del Core
  has_spoilers: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Control de estado
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
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
publicationSchema.index({ author_id: 1, created_at: -1 });
publicationSchema.index({ user_id: 1, created_at: -1 });
publicationSchema.index({ type: 1, created_at: -1 });
publicationSchema.index({ target_id: 1 });
publicationSchema.index({ movie_id: 1, created_at: -1 });
publicationSchema.index({ isDeleted: 1, created_at: -1 });

// Virtual para obtener el ID de usuario sin importar el formato
publicationSchema.virtual('userId').get(function() {
  return this.user_id || this.author_id;
});

// Virtual para obtener el ID de película sin importar el formato
publicationSchema.virtual('movieId').get(function() {
  return this.movie_id || this.target_id;
});

// Virtual para obtener el contenido sin importar el campo
publicationSchema.virtual('text').get(function() {
  return this.body || this.content;
});

// Virtual populate alias: permitir populate('user', 'username') como alias de author_id
publicationSchema.virtual('user', {
  ref: 'User',
  localField: 'author_id',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Publication', publicationSchema);
