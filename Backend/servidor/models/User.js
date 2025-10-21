const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  
  // Identificador del usuario en el módulo de usuarios (externo)
  user_id: {
    type: Number,
    index: true,
    unique: true,
    sparse: true
  },

  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  avatar_url: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ user_id: 1 });

module.exports = mongoose.model('User', userSchema);
