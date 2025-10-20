const mongoose = require('mongoose');

/**
 * Modelo de Usuario UNIFICADO
 * Compatible con el servidor principal y los eventos del Core
 */
const userSchema = new mongoose.Schema({
  // ID del módulo de usuarios (desde el Core)
  user_id: {
    type: String,
    unique: true,
    sparse: true, // Permite nulls pero unique cuando existe
    index: true
  },
  // Campos del servidor principal
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  avatar_url: {
    type: String,
    default: null
  },
  // Campos del Core
  nombre: {
    type: String,
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
  // Tracking de sesiones (desde eventos del Core)
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
  },
  created_at: {
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
 * Crear o actualizar usuario desde evento del Core
 * Maneja la estructura anidada: data.data.idUsuario
 */
userSchema.statics.createOrUpdateFromEvent = async function(eventData) {
  // Extraer datos del formato del Core (pueden estar anidados)
  const actualData = eventData.data || eventData;
  const idUsuario = actualData.idUsuario || eventData.idUsuario || eventData.user_id;
  const nombre = actualData.nombre || eventData.nombre || actualData.name;
  const email = actualData.email || eventData.email;
  const pais = actualData.pais || eventData.pais || actualData.country;
  const fechaRegistro = actualData.fechaRegistro || eventData.fechaRegistro || actualData.created_at;

  if (!idUsuario) {
    throw new Error('No se pudo extraer idUsuario del evento');
  }

  const userData = {
    user_id: idUsuario,
    nombre: nombre || 'Usuario',
    email: email,
    pais: pais,
    fechaRegistro: fechaRegistro ? new Date(fechaRegistro) : new Date(),
    syncedAt: new Date()
  };

  const user = await this.findOneAndUpdate(
    { user_id: idUsuario },
    { $set: userData },
    { upsert: true, new: true, runValidators: false }
  );

  return user;
};

/**
 * Actualizar última sesión iniciada
 * Maneja la estructura anidada del Core
 */
userSchema.statics.updateLastLogin = async function(eventData) {
  // Extraer userId del formato del Core
  const actualData = eventData.data || eventData;
  const userId = actualData.idUsuario || eventData.idUsuario || eventData.user_id;

  if (!userId) {
    throw new Error('No se pudo extraer idUsuario del evento de sesión');
  }

  return await this.findOneAndUpdate(
    { user_id: userId },
    { 
      lastLogin: new Date(),
      syncedAt: new Date(),
      $setOnInsert: {
        nombre: 'Usuario Temporal',
        fechaRegistro: new Date()
      }
    },
    { upsert: true, new: true }
  );
};

/**
 * Actualizar última sesión finalizada
 * Maneja la estructura anidada del Core
 */
userSchema.statics.updateLastLogout = async function(eventData) {
  // Extraer userId del formato del Core
  const actualData = eventData.data || eventData;
  const userId = actualData.idUsuario || eventData.idUsuario || eventData.user_id;

  if (!userId) {
    throw new Error('No se pudo extraer idUsuario del evento de sesión');
  }

  return await this.findOneAndUpdate(
    { user_id: userId },
    { 
      lastLogout: new Date(),
      syncedAt: new Date(),
      $setOnInsert: {
        nombre: 'Usuario Temporal',
        fechaRegistro: new Date()
      }
    },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('User', userSchema);
