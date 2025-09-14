const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['review', 'rating', 'list'],
    lowercase: true
  },
  target_id: {
    type: String,
    required: true // ID de la película/serie externa
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    validate: {
      validator: function(v) {
        // Solo requerido si type es 'rating'
        return this.type !== 'rating' || (v != null && v >= 1 && v <= 5);
      },
      message: 'Rating debe ser entre 1 y 5 para publicaciones de tipo rating'
    }
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
publicationSchema.index({ author_id: 1, created_at: -1 });
publicationSchema.index({ type: 1, created_at: -1 });
publicationSchema.index({ target_id: 1 });

module.exports = mongoose.model('Publication', publicationSchema);
