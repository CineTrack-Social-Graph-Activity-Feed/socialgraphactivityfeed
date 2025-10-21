const Follow = require('../models/Follow');
const User = require('../models/User');
const Publication = require('../models/Publication');
const { createFollowEvent, createUnfollowEvent } = require('../utils/events');

/**
 * Seguir a un usuario
 * POST /api/follow
 */
const followUser = async (req, res) => {
  try {
    const { follower_user_id, followed_user_id } = req.body;

    // Validaciones básicas
    if (!follower_user_id || !followed_user_id) {
      return res.status(400).json({
        error: 'follower_user_id y followed_user_id son requeridos'
      });
    }

    // Opción B: mapping obligatorio + match
    if (!req.actor?.mongo_id) {
      return res.status(409).json({ error: 'Usuario no sincronizado en este servicio' });
    }
    if (String(req.actor.mongo_id) !== String(follower_user_id)) {
      return res.status(403).json({ error: 'No puedes actuar en nombre de otro usuario' });
    }

    if (follower_user_id === followed_user_id) {
      return res.status(400).json({
        error: 'Un usuario no puede seguirse a sí mismo'
      });
    }

    // Verificar que ambos usuarios existan
    const [follower, followed] = await Promise.all([
      User.findById(follower_user_id),
      User.findById(followed_user_id)
    ]);

    if (!follower || !followed) {
      return res.status(404).json({
        error: 'Uno o ambos usuarios no existen'
      });
    }

    // Verificar si ya existe el seguimiento
    const existingFollow = await Follow.findOne({
      follower_user_id,
      followed_user_id
    });

    if (existingFollow) {
      return res.status(409).json({
        error: 'Ya sigues a este usuario'
      });
    }

    // Crear el seguimiento
    const follow = new Follow({
      follower_user_id,
      followed_user_id
    });

    await follow.save();

    // Publicar evento con ids EXTERNOS si están disponibles
    const followerExternalId = (typeof follower.user_id !== 'undefined' && follower.user_id !== null)
      ? follower.user_id
      : follower._id;
    const followedExternalId = (typeof followed.user_id !== 'undefined' && followed.user_id !== null)
      ? followed.user_id
      : followed._id;

    createFollowEvent(followerExternalId, followedExternalId);

    res.status(201).json({
      message: 'Usuario seguido exitosamente',
      follow: {
        id: follow._id,
        follower: {
          id: follower._id,
          username: follower.username
        },
        followed: {
          id: followed._id,
          username: followed.username
        },
        created_at: follow.created_at
      }
    });

  } catch (error) {
    console.error('Error en followUser:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Dejar de seguir a un usuario
 * POST /api/unfollow
 */
const unfollowUser = async (req, res) => {
  try {
    const { follower_user_id, followed_user_id } = req.body;

    // Validaciones básicas
    if (!follower_user_id || !followed_user_id) {
      return res.status(400).json({
        error: 'follower_user_id y followed_user_id son requeridos'
      });
    }

    if (!req.actor?.mongo_id) {
      return res.status(409).json({ error: 'Usuario no sincronizado en este servicio' });
    }
    if (String(req.actor.mongo_id) !== String(follower_user_id)) {
      return res.status(403).json({ error: 'No puedes actuar en nombre de otro usuario' });
    }

    // Buscar y eliminar el seguimiento
    const follow = await Follow.findOneAndDelete({
      follower_user_id,
      followed_user_id
    });

    if (!follow) {
      return res.status(404).json({
        error: 'No sigues a este usuario'
      });
    }

  // Publicar evento con ids EXTERNOS si están disponibles
  const follower = await User.findById(follower_user_id).select('user_id');
  const followed = await User.findById(followed_user_id).select('user_id');
  const followerExternalId = (follower && follower.user_id !== undefined && follower.user_id !== null) ? follower.user_id : follower_user_id;
  const followedExternalId = (followed && followed.user_id !== undefined && followed.user_id !== null) ? followed.user_id : followed_user_id;
  createUnfollowEvent(followerExternalId, followedExternalId);

    res.status(200).json({
      message: 'Has dejado de seguir al usuario'
    });

  } catch (error) {
    console.error('Error en unfollowUser:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener el feed de actividad de un usuario
 * GET /api/feed?user_id=...&page=1&limit=20
 */
const getFeed = async (req, res) => {
  try {
    const { user_id } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!user_id) {
      return res.status(400).json({
        error: 'user_id es requerido'
      });
    }

    // Verificar que el usuario exista
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Obtener usuarios seguidos
    const followedUsers = await Follow.find({
      follower_user_id: user_id
    }).select('followed_user_id');

    const followedUserIds = followedUsers.map(f => f.followed_user_id);

    // Incluir al propio usuario en el feed
    followedUserIds.push(user_id);

    // Obtener publicaciones de usuarios seguidos (incluyendo el propio)
    const publications = await Publication.find({
      author_id: { $in: followedUserIds }
    })
    .populate('author_id', 'username avatar_url')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);

    // Obtener total de publicaciones para paginación
    const totalPublications = await Publication.countDocuments({
      author_id: { $in: followedUserIds }
    });

    const totalPages = Math.ceil(totalPublications / limit);

    res.status(200).json({
      feed: publications,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalPublications,
        items_per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('Error en getFeed:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener todos los usuarios que tú sigues
 * GET /api/followed?user_id=...
 */
const getFollowedUsers = async (req, res) => {
  try {
    const { user_id } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id es requerido' });
    }

    // Buscar los follows donde el usuario es el follower
    const followedUsers = await Follow.find({
      follower_user_id: user_id
    }).select('followed_user_id');

    const followedUserIds = followedUsers.map(f => f.followed_user_id);

    // Obtener los datos de los usuarios seguidos
    const users = await User.find({
      _id: { $in: followedUserIds }
    }).select('username avatar_url')
    .sort({created_at: -1})
    .skip(skip)
    .limit(limit);

    // Obtener total de seguidos para paginación
    const totalFollowedUsers = await Follow.countDocuments({
      follower_user_id: user_id
    });

    const totalPages = Math.ceil(totalFollowedUsers / limit);

    res.status(200).json({
      followed: users,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalFollowedUsers,
        items_per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('Error en getFollowedUsers:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
};


/**
 * Obtener todos los usuarios que te siguen
 * GET /api/followers?user_id=...
 */
const getFollowersUsers = async (req, res) => {
  try {
    const { user_id } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id es requerido' });
    }

    // Buscar los follows donde el usuario es el seguido
    const followers = await Follow.find({
      followed_user_id: user_id
    }).select('follower_user_id');

    const followerUserIds = followers.map(f => f.follower_user_id);

    // Obtener los datos de los usuarios seguidos
    const users = await User.find({
      _id: { $in: followerUserIds }
    }).select('username avatar_url')
    .sort({created_at: -1})
    .skip(skip)
    .limit(limit);

    // Obtener total de seguidos para paginación
    const totalFollowersUsers = await Follow.countDocuments({
      follower_user_id: user_id
    });

    const totalPages = Math.ceil(totalFollowersUsers / limit);

    res.status(200).json({
      followers: users,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalFollowersUsers,
        items_per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('Error en getFollowersUsers:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  getFeed,
  getFollowedUsers,
  getFollowersUsers
};