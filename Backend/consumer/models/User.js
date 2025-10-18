const mongoose = require('mongoose');

/**
 * Modelo de Usuario sincronizado desde el módulo de Usuarios
 */
const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  pais: {
    type: String,
    default: null,
    trim: true
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  // Campos adicionales para tracking de sesiones
  lastLogin: {
    type: Date,
    default: null
  },
  lastLogout: {
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

// Índices para optimizar consultas
userSchema.index({ user_id: 1 });
userSchema.index({ nombre: 1 });
userSchema.index({ fechaRegistro: -1 });

/**
 * Crear o actualizar usuario desde evento
 */
userSchema.statics.createOrUpdateFromEvent = async function(eventData) {
  const { idUsuario, nombre, pais, fechaRegistro } = eventData;

  const userData = {
    user_id: idUsuario,
    nombre,
    pais,
    fechaRegistro: fechaRegistro ? new Date(fechaRegistro) : new Date(),
    syncedAt: new Date()
  };

  const user = await this.findOneAndUpdate(
    { user_id: idUsuario },
    userData,
    { upsert: true, new: true, runValidators: true }
  );

  return user;
};

/**
 * Actualizar última sesión iniciada
 */
userSchema.statics.updateLastLogin = async function(userId) {
  return await this.findOneAndUpdate(
    { user_id: userId },
    { 
      lastLogin: new Date(),
      syncedAt: new Date()
    },
    { new: true }
  );
};

/**
 * Actualizar última sesión finalizada
 */
userSchema.statics.updateLastLogout = async function(userId) {
  return await this.findOneAndUpdate(
    { user_id: userId },
    { 
      lastLogout: new Date(),
      syncedAt: new Date()
    },
    { new: true }
  );
};

module.exports = mongoose.model('User', userSchema);
