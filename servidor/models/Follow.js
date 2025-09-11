const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  followed_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Prevenir que un usuario se siga a sí mismo y duplicados
followSchema.index({ follower_user_id: 1, followed_user_id: 1 }, { unique: true });

// Validación personalizada para evitar auto-seguimiento
followSchema.pre('save', function(next) {
  if (this.follower_user_id.equals(this.followed_user_id)) {
    const error = new Error('Un usuario no puede seguirse a sí mismo');
    return next(error);
  }
  next();
});

module.exports = mongoose.model('Follow', followSchema);
