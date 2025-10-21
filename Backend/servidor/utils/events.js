const { response } = require("express");
const User = require('../models/User');

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

    const eventData = {
      event_type,
      // Enviar SIEMPRE el id externo como actor_id si está disponible
      actor_id: actorExternalId !== undefined ? actorExternalId : actorLocalId,
      target_id: target_id || null,
      timestamp,
      metadata: {
        ...event.metadata
      }
    };

    const payload = {
      type: event_type,
      specversion: '1.0',
      source: '/socialgraph/activityfeed',
      id: `${actor_id}-${Date.now()}`,
      time: timestamp.toISOString(),
      data: eventData,
      datacontenttype: 'application/json'
    };

    const apiUrl = `http://core-letterboxd.us-east-2.elasticbeanstalk.com/events/receive?routingKey=${event_type}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`Error publishing event: ${response.statusText}`);
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