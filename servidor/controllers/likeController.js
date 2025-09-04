const Like = require('../models/Like');
const Publication = require('../models/Publication');
const User = require('../models/User');
const { createLikeEvent, createUnlikeEvent } = require('../utils/events');

/**
 * Dar like a una publicación
 * POST /api/like
 */
const addLike = async (req, res) => {
  try {
    const { user_id, target_id, target_type } = req.body;

    // Validaciones básicas
    if (!user_id || !target_id || !target_type) {
      return res.status(400).json({
        error: 'user_id, target_id y target_type son requeridos'
      });
    }

    // Validar target_type
    const validTargetTypes = ['review', 'rating', 'list'];
    if (!validTargetTypes.includes(target_type)) {
      return res.status(400).json({
        error: 'target_type debe ser: review, rating o list'
      });
    }

    // Verificar que el usuario exista
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Verificar que la publicación exista y sea del tipo correcto
    const publication = await Publication.findOne({
      _id: target_id,
      type: target_type
    }).populate('author_id', 'username');

    if (!publication) {
      return res.status(404).json({
        error: 'Publicación no encontrada o tipo incorrecto'
      });
    }

    // Verificar si ya existe el like
    const existingLike = await Like.findOne({
      user_id,
      target_id,
      target_type
    });

    if (existingLike) {
      return res.status(409).json({
        error: 'Ya has dado like a esta publicación'
      });
    }

    // Crear el like
    const like = new Like({
      user_id,
      target_id,
      target_type
    });

    await like.save();

    // Publicar evento
    createLikeEvent(user_id, target_id, target_type);

    res.status(201).json({
      message: 'Like agregado exitosamente',
      like: {
        id: like._id,
        user: {
          id: user._id,
          username: user.username
        },
        target: {
          id: publication._id,
          type: publication.type,
          author: publication.author_id.username
        },
        created_at: like.created_at
      }
    });

  } catch (error) {
    console.error('Error en addLike:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Quitar like de una publicación
 * DELETE /api/like/:like_id
 */
const removeLike = async (req, res) => {
  try {
    const { like_id } = req.params;
    const { user_id } = req.body; // Para verificar que el usuario puede eliminar este like

    if (!like_id) {
      return res.status(400).json({
        error: 'like_id es requerido'
      });
    }

    if (!user_id) {
      return res.status(400).json({
        error: 'user_id es requerido para verificar permisos'
      });
    }

    // Buscar el like
    const like = await Like.findById(like_id);
    if (!like) {
      return res.status(404).json({
        error: 'Like no encontrado'
      });
    }

    // Verificar que el usuario que quiere eliminar el like sea el propietario
    if (like.user_id.toString() !== user_id) {
      return res.status(403).json({
        error: 'No tienes permisos para eliminar este like'
      });
    }

    // Eliminar el like
    await Like.findByIdAndDelete(like_id);

    // Publicar evento
    createUnlikeEvent(like.user_id, like.target_id, like.target_type);

    res.status(200).json({
      message: 'Like eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en removeLike:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener likes de una publicación
 * GET /api/like/publication/:publication_id
 */
const getPublicationLikes = async (req, res) => {
  try {
    const { publication_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!publication_id) {
      return res.status(400).json({
        error: 'publication_id es requerido'
      });
    }

    // Verificar que la publicación exista
    const publication = await Publication.findById(publication_id);
    if (!publication) {
      return res.status(404).json({
        error: 'Publicación no encontrada'
      });
    }

    // Obtener likes con información del usuario
    const likes = await Like.find({ target_id: publication_id })
      .populate('user_id', 'username avatar_url')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // Obtener total de likes
    const totalLikes = await Like.countDocuments({ target_id: publication_id });

    res.status(200).json({
      likes: likes.map(like => ({
        id: like._id,
        user: {
          id: like.user_id._id,
          username: like.user_id.username,
          avatar_url: like.user_id.avatar_url
        },
        created_at: like.created_at
      })),
      total_likes: totalLikes,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalLikes / limit),
        total_items: totalLikes,
        items_per_page: limit
      }
    });

  } catch (error) {
    console.error('Error en getPublicationLikes:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

module.exports = {
  addLike,
  removeLike,
  getPublicationLikes
};
