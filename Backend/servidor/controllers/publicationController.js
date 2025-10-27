const Publication = require('../models/Publication');
const User = require('../models/User');
const { createNewPublicationEvent, createDeletePublicationEvent } = require('../utils/events');

/**
 * Crear nueva publicación
 * POST /api/publication
 */
const createPublication = async (req, res) => {
  try {
    const { author_id, type, target_id, content, rating, title, has_spoilers, tags } = req.body;

    // Validaciones básicas
    if (!author_id || !type || !target_id || !content) {
      return res.status(400).json({
        error: 'author_id, type, target_id y content son requeridos'
      });
    }

    // Opción B: mapping obligatorio + match
    if (!req.actor?.mongo_id) {
      return res.status(409).json({ error: 'Usuario no sincronizado en este servicio' });
    }
    if (String(req.actor.mongo_id) !== String(author_id)) {
      return res.status(403).json({ error: 'No puedes crear publicaciones en nombre de otro usuario' });
    }

    // Validar type
    const validTypes = ['review', 'rating', 'list'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'type debe ser: review, rating o list'
      });
    }

    // Validar rating si el tipo es 'rating' o 'review'
    if ((type === 'rating' || type === 'review') && rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          error: 'El rating debe estar entre 1 y 5'
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

    // Crear la publicación con el modelo unificado
    const publicationData = {
      author_id,
      type,
      target_id,
      content: content.trim(),
      body: content.trim(), // Mantener sincronizados
      rating: rating || undefined,
      title: title || undefined,
      has_spoilers: has_spoilers || false,
      tags: tags || []
    };

    const publication = new Publication(publicationData);
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
        title: publication.title,
        rating: publication.rating,
        has_spoilers: publication.has_spoilers,
        tags: publication.tags,
        created_at: publication.created_at
      }
    });

  } catch (error) {
    console.error('Error en createPublication:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
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

    // Construir respuesta compatible con ambos formatos
    const response = {
      id: publication._id,
      type: publication.type,
      content: publication.content || publication.body,
      rating: publication.rating,
      created_at: publication.created_at,
      // Campos adicionales del modelo unificado
      title: publication.title,
      has_spoilers: publication.has_spoilers,
      tags: publication.tags,
      // Información de origen
      review_id: publication.review_id, // Si viene del Core
      movie_id: publication.movie_id || publication.target_id
    };

    // Manejar autor (puede ser author_id o user_id)
    if (publication.author_id) {
      response.author = {
        id: publication.author_id._id,
        username: publication.author_id.username,
        avatar_url: publication.author_id.avatar_url
      };
    } else if (publication.user_id) {
      // Si solo tiene user_id (del Core), buscar el usuario
      const user = await User.findOne({ user_id: publication.user_id });
      if (user) {
        response.author = {
          user_id: publication.user_id,
          username: user.username || user.nombre,
          avatar_url: user.avatar_url
        };
      } else {
        response.user_id = publication.user_id;
      }
    }

    res.status(200).json({ publication: response });

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
    const { type, include_deleted } = req.query; // Filtros opcionales
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!user_id) {
      return res.status(400).json({
        error: 'user_id es requerido'
      });
    }

    // Intentar buscar usuario por ObjectId o por user_id (Core)
    let user;
    if (user_id.match(/^[0-9a-fA-F]{24}$/)) {
      // Es un ObjectId válido
      user = await User.findOne({ user_id: user_id });
    } else {
      // Buscar por user_id del Core
      user = await User.findOne({ user_id: user_id });
    }

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Construir filtro flexible (buscar por author_id O user_id)
    const filter = {
      $or: [
        { author_id: user._id }, // Publicaciones locales
        { user_id: user.user_id } // Publicaciones del Core
      ]
    };

    // Filtrar por tipo si se especifica
    if (type && ['review', 'rating', 'list'].includes(type)) {
      filter.type = type;
    }

    // Filtrar eliminadas (soft delete)
    if (include_deleted !== 'true') {
      filter.isDeleted = { $ne: true };
    }

    // Obtener publicaciones
    const publications = await Publication.find(filter)
      .populate('author_id', 'username avatar_url')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // Obtener total
    const totalPublications = await Publication.countDocuments(filter);

    // Mapear publicaciones con formato compatible
    const mappedPublications = publications.map(pub => {
      const pubData = {
        id: pub._id,
        type: pub.type,
        target_id: pub.target_id || pub.movie_id,
        movie_id: pub.movie_id,
        content: pub.content || pub.body,
        title: pub.title,
        rating: pub.rating,
        has_spoilers: pub.has_spoilers,
        tags: pub.tags,
        created_at: pub.created_at,
        review_id: pub.review_id, // Si viene del Core
        isDeleted: pub.isDeleted
      };

      // Manejar autor
      if (pub.author_id) {
        pubData.author = {
          id: pub.author_id._id,
          username: pub.author_id.username,
          avatar_url: pub.author_id.avatar_url
        };
      } else if (pub.user_id) {
        pubData.author = {
          user_id: pub.user_id,
          username: user.username || user.nombre
        };
      }

      return pubData;
    });

    res.status(200).json({
      publications: mappedPublications,
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
 * Obtener publicaciones de una película
 * GET /api/publication/movie/:movie_id
 */
const getMoviePublications = async (req, res) => {
  try {
    const { movie_id } = req.params;
    const { type, include_deleted } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!movie_id) {
      return res.status(400).json({
        error: 'movie_id es requerido'
      });
    }

    // Construir filtro (buscar por target_id O movie_id)
    const filter = {
      $or: [
        { target_id: movie_id.toString() }, // Publicaciones locales
        { movie_id: parseInt(movie_id) } // Publicaciones del Core
      ]
    };

    // Filtrar por tipo si se especifica
    if (type && ['review', 'rating', 'list'].includes(type)) {
      filter.type = type;
    }

    // Filtrar eliminadas (soft delete)
    if (include_deleted !== 'true') {
      filter.isDeleted = { $ne: true };
    }

    // Obtener publicaciones
    const publications = await Publication.find(filter)
      .populate('author_id', 'username avatar_url')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // Obtener total
    const totalPublications = await Publication.countDocuments(filter);

    // Mapear publicaciones
    const mappedPublications = await Promise.all(publications.map(async (pub) => {
      const pubData = {
        id: pub._id,
        type: pub.type,
        target_id: pub.target_id || pub.movie_id,
        movie_id: pub.movie_id,
        content: pub.content || pub.body,
        title: pub.title,
        rating: pub.rating,
        has_spoilers: pub.has_spoilers,
        tags: pub.tags,
        created_at: pub.created_at,
        review_id: pub.review_id
      };

      // Manejar autor
      if (pub.author_id) {
        pubData.author = {
          id: pub.author_id._id,
          username: pub.author_id.username,
          avatar_url: pub.author_id.avatar_url
        };
      } else if (pub.user_id) {
        // Buscar usuario del Core
        const user = await User.findOne({ user_id: pub.user_id });
        pubData.author = {
          user_id: pub.user_id,
          username: user ? (user.username || user.nombre) : 'Usuario desconocido'
        };
      }

      return pubData;
    }));

    res.status(200).json({
      publications: mappedPublications,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalPublications / limit),
        total_items: totalPublications,
        items_per_page: limit
      }
    });

  } catch (error) {
    console.error('Error en getMoviePublications:', error);
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

    if (!req.actor?.mongo_id) {
      return res.status(409).json({ error: 'Usuario no sincronizado en este servicio' });
    }
    if (String(req.actor.mongo_id) !== String(user_id)) {
      return res.status(403).json({ error: 'No puedes actuar en nombre de otro usuario' });
    }

    // Buscar la publicación
    const publication = await Publication.findById(publication_id);
    if (!publication) {
      return res.status(404).json({
        error: 'Publicación no encontrada'
      });
    }

    // Verificar permisos (author_id O user_id)
    const isAuthor = 
      (publication.author_id && publication.author_id.toString() === user_id) ||
      (publication.user_id && publication.user_id === user_id);

    if (!isAuthor) {
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
  getMoviePublications,
  deletePublication
};