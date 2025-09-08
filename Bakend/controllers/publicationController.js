const Publication = require('../models/Publication');
const User = require('../models/User');
const { createNewPublicationEvent, createDeletePublicationEvent } = require('../utils/events');

/**
 * Crear nueva publicación
 * POST /api/publication
 */
const createPublication = async (req, res) => {
  try {
    const { author_id, type, target_id, content, rating } = req.body;

    // Validaciones básicas
    if (!author_id || !type || !target_id || !content) {
      return res.status(400).json({
        error: 'author_id, type, target_id y content son requeridos'
      });
    }

    // Validar type
    const validTypes = ['review', 'rating', 'list'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'type debe ser: review, rating o list'
      });
    }

    // Validar rating si el tipo es 'rating'
    if (type === 'rating') {
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          error: 'Para publicaciones de tipo rating, se requiere un rating entre 1 y 5'
        });
      }
    }

    // Verificar que el autor exista
    const author = await User.findById(author_id);
    if (!author) {
      return res.status(404).json({
        error: 'Usuario autor no encontrado'
      });
    }

    // Crear la publicación
    const publication = new Publication({
      author_id,
      type,
      target_id,
      content: content.trim(),
      rating: type === 'rating' ? rating : undefined
    });

    await publication.save();

    // Poblar con información del autor
    await publication.populate('author_id', 'username avatar_url');

    // Publicar evento
    createNewPublicationEvent(author_id, publication._id, type);

    res.status(201).json({
      message: 'Publicación creada exitosamente',
      publication: {
        id: publication._id,
        author: {
          id: publication.author_id._id,
          username: publication.author_id.username,
          avatar_url: publication.author_id.avatar_url
        },
        type: publication.type,
        target_id: publication.target_id,
        content: publication.content,
        rating: publication.rating,
        created_at: publication.created_at
      }
    });

  } catch (error) {
    console.error('Error en createPublication:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener publicación por ID
 * GET /api/publication/:publication_id
 */
const getPublication = async (req, res) => {
  try {
    const { publication_id } = req.params;

    if (!publication_id) {
      return res.status(400).json({
        error: 'publication_id es requerido'
      });
    }

    const publication = await Publication.findById(publication_id)
      .populate('author_id', 'username avatar_url');

    if (!publication) {
      return res.status(404).json({
        error: 'Publicación no encontrada'
      });
    }

    res.status(200).json({
      publication: {
        id: publication._id,
        author: {
          id: publication.author_id._id,
          username: publication.author_id.username,
          avatar_url: publication.author_id.avatar_url
        },
        type: publication.type,
        target_id: publication.target_id,
        content: publication.content,
        rating: publication.rating,
        created_at: publication.created_at
      }
    });

  } catch (error) {
    console.error('Error en getPublication:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener publicaciones de un usuario
 * GET /api/publication/user/:user_id
 */
const getUserPublications = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { type } = req.query; // Filtro opcional por tipo
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

    // Construir filtro
    const filter = { author_id: user_id };
    if (type && ['review', 'rating', 'list'].includes(type)) {
      filter.type = type;
    }

    // Obtener publicaciones
    const publications = await Publication.find(filter)
      .populate('author_id', 'username avatar_url')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // Obtener total
    const totalPublications = await Publication.countDocuments(filter);

    res.status(200).json({
      publications: publications.map(pub => ({
        id: pub._id,
        author: {
          id: pub.author_id._id,
          username: pub.author_id.username,
          avatar_url: pub.author_id.avatar_url
        },
        type: pub.type,
        target_id: pub.target_id,
        content: pub.content,
        rating: pub.rating,
        created_at: pub.created_at
      })),
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalPublications / limit),
        total_items: totalPublications,
        items_per_page: limit
      }
    });

  } catch (error) {
    console.error('Error en getUserPublications:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Eliminar publicación
 * DELETE /api/publication/:publication_id
 */
const deletePublication = async (req, res) => {
  try {
    const { publication_id } = req.params;
    const { user_id } = req.body; // Para verificar permisos

    if (!publication_id) {
      return res.status(400).json({
        error: 'publication_id es requerido'
      });
    }

    if (!user_id) {
      return res.status(400).json({
        error: 'user_id es requerido para verificar permisos'
      });
    }

    // Buscar la publicación
    const publication = await Publication.findById(publication_id);
    if (!publication) {
      return res.status(404).json({
        error: 'Publicación no encontrada'
      });
    }

    // Verificar que el usuario sea el autor
    if (publication.author_id.toString() !== user_id) {
      return res.status(403).json({
        error: 'No tienes permisos para eliminar esta publicación'
      });
    }

    // Eliminar la publicación
    await Publication.findByIdAndDelete(publication_id);

    // Publicar evento
    createDeletePublicationEvent(user_id, publication_id);

    res.status(200).json({
      message: 'Publicación eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error en deletePublication:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

module.exports = {
  createPublication,
  getPublication,
  getUserPublications,
  deletePublication
};
