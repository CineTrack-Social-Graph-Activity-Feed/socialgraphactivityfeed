const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  target_type: {
    type: String,
    required: true,
    enum: ['review', 'rating', 'list'],
    lowercase: true
  },
  target_id: {
    type: String, // Ahora acepta IDs externos (por ejemplo, de películas/series)
    required: true
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 500
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
commentSchema.index({ target_id: 1, created_at: -1 });
commentSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model('Comment', commentSchema);
