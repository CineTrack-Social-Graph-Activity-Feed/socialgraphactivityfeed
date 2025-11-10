const User = require('../models/User');

// Config desde variables de entorno (evitar hardcodear secretos)
const CORE_EVENTS_URL = process.env.CORE_EVENTS_URL || 'http://core-letterboxd.us-east-2.elasticbeanstalk.com';
const CORE_EVENTS_API_KEY = process.env.CORE_EVENTS_API_KEY || 'sk_core_social_s2Qw8Vn5Jk1Mz7Lp4Rt9HbXe';
// El CORE valida que la API key coincida con el "source" enviado
// (p. ej., esperan /social/api). Permite sobreescribirlo por entorno.
const CORE_EVENTS_SOURCE = process.env.CORE_EVENTS_SOURCE || '/social/api';

// Normaliza IDs: mantiene null/undefined y fuerza strings en valores válidos
const normalizeId = (val) => (val === null || val === undefined ? null : String(val));

// Quita prefijo 'u' si viene como 'u123' y deja sólo el número como string
const stripUserPrefix = (val) => {
  const s = normalizeId(val);
  if (s === null) return null;
  return s.replace(/^u/i, '');
};

const publishEvent = async (event) => {
  try {
    // Validar que el evento tenga la estructura correcta
    if (!event || typeof event !== 'object') {
      throw new Error('El evento debe ser un objeto válido');
    }

  const { event_type, actor_id, target_id, timestamp = new Date() } = event;

    if (!event_type || !actor_id) {
      throw new Error('event_type y actor_id son requeridos');
    }

    // Mapear actor_id local (ObjectId) -> user_id externo si existe
    let actorExternalId = event.actor_external_id;
    let actorLocalId = actor_id || null;
    if (!actorExternalId && actorLocalId) {
      try {
        const user = await User.findById(actorLocalId).select('user_id');
        if (user && user.user_id !== undefined && user.user_id !== null) {
          actorExternalId = user.user_id;
        }
      } catch (_) { /* ignorar cast errors */ }
    }

    const isUserTarget = [
      EVENT_TYPES.FOLLOW,
      EVENT_TYPES.UNFOLLOW,
    ].includes(event_type);

    const eventData = {
      event_type,
  // Enviar SIEMPRE el id externo como actor_id si está disponible (como String) sin prefijo 'u'
  actor_id: stripUserPrefix(actorExternalId !== undefined ? actorExternalId : actorLocalId),
  // target_id sin prefijo 'u'; sólo normalizar user ids si aplica (follow/unfollow)
  target_id: isUserTarget ? stripUserPrefix(target_id || null) : normalizeId(target_id || null),
      timestamp,
      metadata: {
        // Convierte posibles IDs en metadata manteniendo otros valores intactos
        ...Object.fromEntries(
          Object.entries(event.metadata || {}).map(([k, v]) => {
            // Normalizar si es un ID de usuario conocido, quitando prefijo 'u'
            const userIdKeys = new Set(['user_id', 'follower_id', 'followed_id', 'actor_id', 'author_id']);
            if (userIdKeys.has(k) || k.endsWith('_user_id')) {
              return [k, stripUserPrefix(v)];
            }
            // Otros IDs comunes (no de usuario) sólo normalizar
            if (k.endsWith('_id') || k === 'comment_id' || k === 'publication_id') {
              return [k, normalizeId(v)];
            }
            return [k, v];
          })
        )
      }
    };

    const payload = {
      type: event_type,
      specversion: '1.0',
      source: CORE_EVENTS_SOURCE,
      // Usa el actor_local o externo (ya normalizado) para el id del evento, evita 'null'
      id: `${eventData.actor_id !== null ? eventData.actor_id : 'anon'}-${Date.now()}`,
      time: timestamp.toISOString(),
      data: eventData,
      datacontenttype: 'application/json'
    };

    const apiUrl = `${CORE_EVENTS_URL}/events/receive?routingKey=${encodeURIComponent(event_type)}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json',
        'X-API-KEY': CORE_EVENTS_API_KEY
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      let bodyText = '';
      try {
        // intenta parsear JSON de error; si falla, devuelve texto plano
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await response.json();
          bodyText = JSON.stringify(json);
        } else {
          bodyText = await response.text();
        }
      } catch (_) { /* noop */ }

      const statusMsg = response.statusText || 'Unknown error';
      throw new Error(`Error publishing event: ${response.status} ${statusMsg} - ${bodyText}`);
    }
  console.log('✅ Event published:', payload);
    return response.json();

  } catch (error) {
    console.error('❌ Error publishing event:', error.message);
    throw error;
  }
};

// Tipos de eventos predefinidos
const EVENT_TYPES = {
  // Seguimientos
  FOLLOW: "social.seguimiento.creado",
  UNFOLLOW: "social.seguimiento.borrado",

  // Likes
  LIKE: "social.megusta.creado",
  UNLIKE: "social.megusta.borrado",

  // Comentarios
  COMMENT: "social.comentario.creado",
  DELETE_COMMENT: "social.comentario.borrado",

  // Publicaciones
  NEW_PUBLICATION: "social.publicacion.creada",
  DELETE_PUBLICATION: "social.publicacion.borrada",
};

// Helpers para crear eventos específicos
const createFollowEvent = (follower_id, followed_id) => {
  return publishEvent({
    event_type: EVENT_TYPES.FOLLOW,
    actor_id: follower_id,
    target_id: followed_id
  });
};

const createUnfollowEvent = (follower_id, followed_id) => {
  return publishEvent({
    event_type: EVENT_TYPES.UNFOLLOW,
    actor_id: follower_id,
    target_id: followed_id
  });
};

const createLikeEvent = (user_id, publication_id, target_type) => {
  return publishEvent({
    event_type: EVENT_TYPES.LIKE,
    actor_id: user_id,
    target_id: publication_id,
    metadata: { target_type }
  });
};

const createUnlikeEvent = (user_id, publication_id, target_type) => {
  return publishEvent({
    event_type: EVENT_TYPES.UNLIKE,
    actor_id: user_id,
    target_id: publication_id,
    metadata: { target_type }
  });
};

const createCommentEvent = (user_id, publication_id, comment_id, target_type) => {
  return publishEvent({
    event_type: EVENT_TYPES.COMMENT,
    actor_id: user_id,
    target_id: publication_id,
    metadata: { comment_id, target_type }
  });
};

const createDeleteCommentEvent = (user_id, publication_id, comment_id) => {
  return publishEvent({
    event_type: EVENT_TYPES.DELETE_COMMENT,
    actor_id: user_id,
    target_id: publication_id,
    metadata: { comment_id }
  });
};

const createNewPublicationEvent = (author_id, publication_id, publication_type) => {
  return publishEvent({
    event_type: EVENT_TYPES.NEW_PUBLICATION,
    actor_id: author_id,
    target_id: publication_id,
    metadata: { publication_type }
  });
};

const createDeletePublicationEvent = (author_id, publication_id) => {
  return publishEvent({
    event_type: EVENT_TYPES.DELETE_PUBLICATION,
    actor_id: author_id,
    target_id: publication_id
  });
};

module.exports = {
  publishEvent,
  EVENT_TYPES,
  createFollowEvent,
  createUnfollowEvent,
  createLikeEvent,
  createUnlikeEvent,
  createCommentEvent,
  createDeleteCommentEvent,
  createNewPublicationEvent,
  createDeletePublicationEvent
};