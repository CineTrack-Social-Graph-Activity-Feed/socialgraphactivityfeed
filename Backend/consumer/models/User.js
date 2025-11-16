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
  // Email opcional (lo usamos, pero no agregamos campos extra del evento)
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    default: null
  },
  avatar_url: {
    type: String,
    default: null
  },
  // Activación / estado lógico (no hard delete)
  activated: {
    type: Boolean,
    default: true,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  reactivatedAt: {
    type: Date,
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
  // (Ignoramos campos avanzados del evento como bio, location, etc.)
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
userSchema.index({ activated: 1, user_id: 1 });
userSchema.index({ email: 1 });

/**
 * Crear o actualizar usuario desde evento del Core
 * Maneja la estructura anidada: data.data.idUsuario
 */
userSchema.statics.createOrUpdateFromEvent = async function(eventData) {
  // Extraer datos del formato del Core (pueden estar anidados)
  const actualData = eventData.data || eventData;
  const idUsuario = actualData.idUsuario || eventData.idUsuario || eventData.user_id;
  const username = actualData.username || eventData.username;
  const pais = actualData.pais || eventData.pais || actualData.country;
  const fechaRegistro = actualData.fechaRegistro || eventData.fechaRegistro || actualData.created_at;
  const avatar_url = actualData.imageUrl || eventData.imageUrl || actualData.avatar_url || eventData.avatar_url;
  const email = actualData.email || eventData.email;

  if (!idUsuario) {
    throw new Error('No se pudo extraer idUsuario del evento');
  }

  // Construir set solo con campos definidos para evitar duplicados en índices únicos (email=null)
  const userData = {
    user_id: idUsuario,
    username: username || undefined,
    email: email ? String(email).toLowerCase().trim() : undefined,
    pais: pais || undefined,
    fechaRegistro: fechaRegistro ? new Date(fechaRegistro) : new Date(),
    avatar_url: avatar_url || undefined,
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
 * Sobrescribir usuario desde evento completo de actualización (usuarios.usuario.actualizado)
 * No borra activated si no viene en el evento.
 */
userSchema.statics.overwriteFromFullUpdateEvent = async function(eventData) {
  const actualData = eventData.data || eventData;
  const idUsuario = actualData.idUsuario || actualData.user_id || eventData.idUsuario || eventData.user_id;
  if (!idUsuario) throw new Error('No se pudo extraer idUsuario del evento actualizado');
  const normalizedId = Number(String(idUsuario).replace(/\D+/g, ''));
  if (!normalizedId) throw new Error('idUsuario inválido en evento actualizado');

  // Seleccionar sólo los campos que usamos
  const username = actualData.username;
  const pais = actualData.pais;
  const fechaRegistro = actualData.fechaRegistro || actualData.fechaRegistroUsuario || actualData.created_at;
  const avatar_url = actualData.imageUrl || actualData.avatar_url;
  const email = actualData.email;
  const baseSet = {
    user_id: normalizedId,
    username: username || undefined,
    pais: pais || undefined,
    fechaRegistro: fechaRegistro ? new Date(fechaRegistro) : undefined,
    avatar_url: avatar_url || undefined,
    email: email ? String(email).toLowerCase().trim() : undefined,
    syncedAt: new Date()
  };

  // Upsert conservando activated si no viene
  const current = await this.findOne({ user_id: normalizedId });
  if (current && !Object.prototype.hasOwnProperty.call(actualData, 'activated')) {
    baseSet.activated = current.activated; // mantener estado
  } else if (Object.prototype.hasOwnProperty.call(actualData, 'activated')) {
    baseSet.activated = !!actualData.activated;
  }

  const user = await this.findOneAndUpdate(
    { user_id: normalizedId },
    { $set: baseSet },
    { upsert: true, new: true }
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

/**
 * Desactivar usuario (marcar como eliminado lógico)
 */
userSchema.statics.deactivateUser = async function(userId, fechaEliminacion) {
  const when = fechaEliminacion ? new Date(fechaEliminacion) : new Date();
  const user = await this.findOneAndUpdate(
    { user_id: userId },
    {
      $set: {
        activated: false,
        deletedAt: when,
        reactivatedAt: null,
        syncedAt: new Date()
      },
      $setOnInsert: { fechaRegistro: new Date() }
    },
    { upsert: true, new: true }
  );
  return user;
};

/**
 * Reactivar usuario (revivir)
 */
userSchema.statics.reactivateUser = async function(userId, fechaReactivacion) {
  const when = fechaReactivacion ? new Date(fechaReactivacion) : new Date();
  const user = await this.findOneAndUpdate(
    { user_id: userId },
    {
      $set: {
        activated: true,
        reactivatedAt: when,
        // No borramos deletedAt para conservar histórico
        syncedAt: new Date()
      },
      $setOnInsert: { fechaRegistro: new Date() }
    },
    { upsert: true, new: true }
  );
  return user;
};

/**
 * Actualización parcial de campos según lista recibida
 */
userSchema.statics.partialUpdate = async function(userId, fields, fechaActualizacion) {
  const allowedFieldsMap = {
    nombre: 'username',
    name: 'username',
    // last_name se combina con name si está presente
    email: 'email', // no existe en schema; se ignorará si no se añade
    pais: 'pais',
    avatar_url: 'avatar_url',
    image_url: 'avatar_url',
    bio: 'bio', // no existe; se ignorará si no se añade
    location: 'location', // idem
    website: 'website', // idem
    birth_date: 'birth_date', // idem
    gender: 'gender', // idem
    experience: 'experience' // idem
  };

  const setObj = { syncedAt: new Date() };
  if (fechaActualizacion) setObj.lastSeenAt = new Date(fechaActualizacion);

  // Componer username a partir de name/last_name si ambos existen
  const usernameParts = [];
  if (fields && fields.name) usernameParts.push(String(fields.name));
  if (fields && fields.last_name) usernameParts.push(String(fields.last_name));
  if (usernameParts.length > 0) {
    setObj.username = usernameParts.join(' ').replace(/\s+/g, ' ').trim();
  }

  Object.entries(fields || {}).forEach(([k, v]) => {
    if (k === 'name' || k === 'last_name') return; // ya lo gestionamos arriba
    const mapped = allowedFieldsMap[k];
    if (mapped) {
      setObj[mapped] = v;
    }
  });

  const user = await this.findOneAndUpdate(
    { user_id: userId },
    { $set: setObj, $setOnInsert: { fechaRegistro: new Date() } },
    { upsert: true, new: true }
  );
  return user;
};

module.exports = mongoose.model('User', userSchema);
