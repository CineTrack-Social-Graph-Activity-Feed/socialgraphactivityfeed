const Follow = require('../models/Follow');
const User = require('../models/User');
const Publication = require('../models/Publication');
const { createFollowEvent, createUnfollowEvent } = require('../utils/events');
const mongoose = require('mongoose');

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

    // Publicar evento
    createFollowEvent(follower_user_id, followed_user_id);

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

    // Publicar evento
    createUnfollowEvent(follower_user_id, followed_user_id);

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

module.exports = {
  followUser,
  unfollowUser,
  getFeed,
  /**
   * Obtener lista de usuarios que SIGUE un usuario
   * GET /api/followed?user_id=...
   */
  async getFollowed(req, res) {
    try {
      const { user_id } = req.query;
      if (!user_id) {
        return res.status(400).json({ error: 'user_id es requerido' });
      }

      if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(200).json({ followed: [] });
      }

      const follows = await Follow.find({ follower_user_id: user_id })
        .populate('followed_user_id', 'username avatar_url');

      // Normalizar a arreglo de usuarios
      const followed = follows
        .map(f => f.followed_user_id)
        .filter(Boolean)
        .map(u => ({ _id: u._id, username: u.username, avatar_url: u.avatar_url }));

      res.status(200).json({ followed });
    } catch (error) {
      console.error('Error en getFollowed:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * Obtener lista de usuarios que SIGUEN a un usuario
   * GET /api/followers?user_id=...
   */
  async getFollowers(req, res) {
    try {
      const { user_id } = req.query;
      if (!user_id) {
        return res.status(400).json({ error: 'user_id es requerido' });
      }

      if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(200).json({ followers: [] });
      }

      const follows = await Follow.find({ followed_user_id: user_id })
        .populate('follower_user_id', 'username avatar_url');

      const followers = follows
        .map(f => f.follower_user_id)
        .filter(Boolean)
        .map(u => ({ _id: u._id, username: u.username, avatar_url: u.avatar_url }));

      res.status(200).json({ followers });
    } catch (error) {
      console.error('Error en getFollowers:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};
