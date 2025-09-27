const Comment = require("../models/Comment");
const Publication = require("../models/Publication");
const User = require("../models/User");
const { createCommentEvent, createDeleteCommentEvent } = require("../utils/events");

/**
 * Agregar comentario a una publicación
 * POST /api/comment
 */
const addComment = async (req, res) => {
  try {
    const { user_id, target_id, target_type, comment } = req.body;
    
    console.log("📩 addComment - Request recibido:", { user_id, target_id, target_type, comment: comment?.substring(0, 30) + (comment?.length > 30 ? '...' : '') });

    // Validaciones básicas
    if (!user_id || !target_id || !target_type || !comment) {
      console.log("❌ addComment - Validación fallida: campos requeridos faltantes");
      return res.status(400).json({
        error: "user_id, target_id, target_type y comment son requeridos",
      });
    }

    // Validar target_type
    const validTargetTypes = ["review", "rating", "list"];
    if (!validTargetTypes.includes(target_type)) {
      console.log(`❌ addComment - Target type inválido: ${target_type}`);
      return res.status(400).json({
        error: "target_type debe ser: review, rating o list",
      });
    }

    // Validar longitud del comentario
    if (comment.trim().length === 0) {
      console.log(`❌ addComment - Comentario vacío`);
      return res.status(400).json({
        error: "El comentario no puede estar vacío",
      });
    }

    if (comment.length > 500) {
      console.log(`❌ addComment - Comentario excede límite: ${comment.length} caracteres`);
      return res.status(400).json({
        error: "El comentario no puede exceder 500 caracteres",
      });
    }

    // Verificar que el usuario exista (requerido para persistir en DB)
    let user = null;
    try {
      user = await User.findById(user_id);
    } catch (_) {}
    if (!user) {
      console.log(`❌ addComment - Usuario no encontrado: ${user_id}`);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    console.log(`✅ addComment - Usuario encontrado: ${user.username}`);

    /*
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
    */

    // DB path
    const newComment = new Comment({
      user_id,
      target_id,
      target_type,
      comment: comment.trim(),
    });

    try {
      await newComment.save();
      console.log(`✅ addComment - Comentario guardado exitosamente: ${newComment._id}`);
    } catch (saveError) {
      console.log(`❌ addComment - Error al guardar comentario:`, saveError);
      throw saveError;
    }

    try {
      await newComment.populate("user_id", "username avatar_url");
      console.log(`✅ addComment - Comentario poblado con información de usuario`);
    } catch (populateError) {
      console.log(`❌ addComment - Error al poblar comentario:`, populateError);
    }

    createCommentEvent(user_id, target_id, newComment._id, target_type);

    const responseData = {
      message: "Comentario agregado exitosamente",
      comment: {
        id: newComment._id,
        user: {
          id: newComment.user_id._id,
          username: newComment.user_id.username,
          avatar_url: newComment.user_id.avatar_url,
        },
        target: {
          id: target_id,
          type: target_type,
        },
        comment: newComment.comment,
        created_at: newComment.created_at,
      },
    };
    console.log(`✅ addComment - Respondiendo con éxito:`, responseData);
    return res.status(201).json(responseData);
  } catch (error) {
    console.error("Error en addComment:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
      code: error.name || 'UnknownError'
    });
  }
};

/**
 * Eliminar comentario
 * DELETE /api/comment/:comment_id
 */
const deleteComment = async (req, res) => {
  try {
    const { comment_id } = req.params;
    const { user_id } = req.body; // Para verificar permisos

    if (!comment_id) {
      return res.status(400).json({
        error: "comment_id es requerido",
      });
    }

    if (!user_id) {
      return res.status(400).json({
        error: "user_id es requerido para verificar permisos",
      });
    }

    // DB path
    const comment = await Comment.findById(comment_id);
    if (!comment) {
      return res.status(404).json({
        error: "Comentario no encontrado",
      });
    }
    if (comment.user_id.toString() !== user_id) {
      return res.status(403).json({
        error: "No tienes permisos para eliminar este comentario",
      });
    }
    await Comment.findByIdAndDelete(comment_id);
    createDeleteCommentEvent(comment.user_id, comment.target_id, comment_id);
    res.status(200).json({ message: "Comentario eliminado exitosamente" });
  } catch (error) {
    console.error("Error en deleteComment:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

/**
 * Obtener comentarios de una publicación
 * GET /api/comment/publication/:publication_id
 */
const getPublicationComments = async (req, res) => {
  try {
    const { publication_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!publication_id) {
      return res.status(400).json({
        error: "publication_id es requerido",
      });
    }
    /*
    // Verificar que la publicación exista
    const publication = await Publication.findById(publication_id);
    if (!publication) {
      return res.status(404).json({
        error: 'Publicación no encontrada'
      });
    }
    */
   
    const comments = await Comment.find({ target_id: publication_id })
      .populate("user_id", "username avatar_url")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const totalComments = await Comment.countDocuments({ target_id: publication_id });

    return res.status(200).json({
      comments: comments.map((comment) => ({
        id: comment._id,
        user: {
          id: comment.user_id._id,
          username: comment.user_id.username,
          avatar_url: comment.user_id.avatar_url,
        },
        comment: comment.comment,
        created_at: comment.created_at,
      })),
      total_comments: totalComments,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalComments / limit),
        total_items: totalComments,
        items_per_page: limit,
      },
    });
  } catch (error) {
    console.error("Error en getPublicationComments:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

module.exports = {
  addComment,
  deleteComment,
  getPublicationComments,
};
