const mongoose = require('mongoose');
const User = require('./User');

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

/**
 * Crear publicación desde evento de reseña creada del Core
 * Maneja la estructura de datos que puede estar anidada en data.data
 */
publicationSchema.statics.createFromEvent = async function(eventData) {
  // Extraer datos reales (por si vienen anidados en data.data)
  const actualData = eventData.data || eventData;
  const reviewData = actualData.data || actualData;
  
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
  } = reviewData;

  const publicationData = {
    review_id: id,
    movie_id,
    user_id: String(user_id),
    type: 'review', // Por defecto es review desde el Core
    title,
    body, // Se guarda en body para las reseñas del Core
    content: body, // También en content para compatibilidad servidor
    rating,
    has_spoilers,
    tags: Array.isArray(tags) ? tags : [],
    created_at: created_at ? new Date(created_at) : new Date(),
    updated_at: new Date(),
    syncedAt: new Date()
  };

  // Si el usuario ya existe localmente, asociar referencia ObjectId
  try {
    if (user_id !== undefined && user_id !== null) {
      const userDoc = await User.findOne({ user_id: String(user_id) }).select('_id');
      if (userDoc) {
        publicationData.author_id = userDoc._id;
      }
    }
  } catch (e) {
    // No bloquear creación por fallo en lookup
  }

  const publication = await this.create(publicationData);
  return publication;
};

/**
 * Actualizar publicación desde evento de reseña actualizada
 * Maneja la estructura de datos que puede estar anidada en data.data
 */
publicationSchema.statics.updateFromEvent = async function(eventData) {
  // Extraer datos reales (por si vienen anidados en data.data)
  const actualData = eventData.data || eventData;
  const reviewData = actualData.data || actualData;
  
  const {
    id,
    title,
    body,
    rating,
    has_spoilers,
    tags
  } = reviewData;

  const updateData = {
    updated_at: new Date(),
    syncedAt: new Date()
  };

  if (title !== undefined) updateData.title = title;
  if (body !== undefined) {
    updateData.body = body;
    updateData.content = body; // Mantener sincronizados ambos campos
  }
  if (rating !== undefined) updateData.rating = rating;
  if (has_spoilers !== undefined) updateData.has_spoilers = has_spoilers;
  if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];

  const publication = await this.findOneAndUpdate(
    { review_id: id },
    updateData,
    { new: true, runValidators: true }
  );

  // Si la publicación existe pero aún no tiene author_id, intentar asociarlo
  if (publication && !publication.author_id && publication.user_id) {
    try {
      const userDoc = await User.findOne({ user_id: String(publication.user_id) }).select('_id');
      if (userDoc) {
        publication.author_id = userDoc._id;
        await publication.save();
      }
    } catch (e) {
      // Ignorar errores de lookup/guardado aquí
    }
  }

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
