const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
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
    type: String, 
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Prevenir likes duplicados del mismo usuario a la misma publicación
likeSchema.index({ user_id: 1, target_id: 1 }, { unique: true });

// Índices para optimizar consultas
likeSchema.index({ target_id: 1, created_at: -1 });
likeSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model('Like', likeSchema);
