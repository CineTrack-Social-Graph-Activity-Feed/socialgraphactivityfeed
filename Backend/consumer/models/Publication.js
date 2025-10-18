const mongoose = require('mongoose');

/**
 * Modelo de Publicación (Reseña) sincronizado desde el módulo de Reseñas
 */
const publicationSchema = new mongoose.Schema({
  review_id: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  movie_id: {
    type: Number,
    required: true,
    index: true
  },
  user_id: {
    type: String, // ID del usuario desde el módulo de usuarios
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  has_spoilers: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  // Control de estado
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  // Metadata
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices compuestos para optimizar consultas
publicationSchema.index({ user_id: 1, created_at: -1 });
publicationSchema.index({ movie_id: 1, created_at: -1 });
publicationSchema.index({ isDeleted: 1, created_at: -1 });

/**
 * Crear publicación desde evento de reseña creada
 */
publicationSchema.statics.createFromEvent = async function(eventData) {
  const {
    id,
    movie_id,
    user_id,
    title,
    body,
    rating,
    has_spoilers = false,
    tags = [],
    created_at
  } = eventData;

  const publicationData = {
    review_id: id,
    movie_id,
    user_id: String(user_id),
    title,
    body,
    rating,
    has_spoilers,
    tags: Array.isArray(tags) ? tags : [],
    created_at: created_at ? new Date(created_at) : new Date(),
    updated_at: new Date(),
    syncedAt: new Date()
  };

  const publication = await this.create(publicationData);
  return publication;
};

/**
 * Actualizar publicación desde evento de reseña actualizada
 */
publicationSchema.statics.updateFromEvent = async function(eventData) {
  const {
    id,
    title,
    body,
    rating,
    has_spoilers,
    tags
  } = eventData;

  const updateData = {
    updated_at: new Date(),
    syncedAt: new Date()
  };

  if (title !== undefined) updateData.title = title;
  if (body !== undefined) updateData.body = body;
  if (rating !== undefined) updateData.rating = rating;
  if (has_spoilers !== undefined) updateData.has_spoilers = has_spoilers;
  if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];

  const publication = await this.findOneAndUpdate(
    { review_id: id },
    updateData,
    { new: true, runValidators: true }
  );

  return publication;
};

/**
 * Marcar publicación como eliminada (soft delete)
 */
publicationSchema.statics.markAsDeleted = async function(reviewId) {
  return await this.findOneAndUpdate(
    { review_id: reviewId },
    {
      isDeleted: true,
      deletedAt: new Date(),
      syncedAt: new Date()
    },
    { new: true }
  );
};

/**
 * Eliminar publicación permanentemente (hard delete)
 */
publicationSchema.statics.deleteFromEvent = async function(reviewId) {
  return await this.findOneAndDelete({ review_id: reviewId });
};

module.exports = mongoose.model('Publication', publicationSchema);
