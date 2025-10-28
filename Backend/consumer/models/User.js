const mongoose = require('mongoose');

/**
 * Modelo de Usuario UNIFICADO
 * Compatible con el servidor principal y los eventos del Core
 */
const userSchema = new mongoose.Schema({
  // ID del módulo de usuarios (desde el Core)
  user_id: {
    type: Number,
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
  avatar_url: {
    type: String,
    default: null
  },
  // Presencia/sesiones
  lastSeenAt: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
  lastLogoutAt: { type: Date, default: null },
  activeSessions: { type: Number, default: 0, min: 0 },
  lastSession: {
    id: { type: String, default: null },
    device: { type: String, default: null },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null }
  },
  // Campos del Core
  pais: {
    type: String,
    default: null,
    trim: true
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
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
userSchema.index({ username: 1 });
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
  const pais = actualData.pais || eventData.pais || actualData.country;
  const fechaRegistro = actualData.fechaRegistro || eventData.fechaRegistro || actualData.created_at;

  if (!idUsuario) {
    throw new Error('No se pudo extraer idUsuario del evento');
  }

  // Construir set solo con campos definidos para evitar duplicados en índices únicos (email=null)
  const userData = {
    user_id: idUsuario,
    username: nombre || undefined,
    pais: pais || undefined,
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
 * Marcar inicio de sesión
 * payload esperado (ya normalizado): { userId, sessionId, device, startedAt }
 */
userSchema.statics.markSessionStarted = async function({ userId, sessionId, device, startedAt }) {
  const when = startedAt ? new Date(startedAt) : new Date();

  const user = await this.findOneAndUpdate(
    { user_id: userId },
    {
      $inc: { activeSessions: 1 },
      $setOnInsert: { fechaRegistro: new Date() },
      $set: {
        lastSeenAt: when,
        lastLoginAt: when,
        'lastSession.id': sessionId || null,
        'lastSession.device': device || null,
        'lastSession.startedAt': when,
        'lastSession.endedAt': null,
        syncedAt: new Date()
      }
    },
    { upsert: true, new: true }
  );

  return user;
};

/**
 * Marcar fin de sesión
 * payload esperado (ya normalizado): { userId, sessionId, endedAt }
 */
userSchema.statics.markSessionFinished = async function({ userId, sessionId, endedAt }) {
  const when = endedAt ? new Date(endedAt) : new Date();

  const user = await this.findOneAndUpdate(
    { user_id: userId },
    {
      $inc: { activeSessions: -1 },
      $setOnInsert: { fechaRegistro: new Date() },
      $set: {
        lastSeenAt: when,
        lastLogoutAt: when,
        'lastSession.id': sessionId || null,
        'lastSession.endedAt': when,
        syncedAt: new Date()
      }
    },
    { upsert: true, new: true }
  );

  // Asegurar que no sea negativo
  if (user.activeSessions < 0) {
    user.activeSessions = 0;
    await user.save();
  }

  return user;
};

module.exports = mongoose.model('User', userSchema);
