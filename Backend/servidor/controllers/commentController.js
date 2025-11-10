const Comment = require("../models/Comment");
const Publication = require("../models/Publication");
const User = require("../models/User");
const {
  createCommentEvent,
  createDeleteCommentEvent,
} = require("../utils/events");

// --- DEMO MODE for hardcoded publications ---
const DEMO_PUBLICATION_IDS = new Set([
  "65f5e1d77c65c827d8536abc",
  "65f5e1d77c65c827d8536abd",
  "65f5e1d77c65c827d8536abe",
]);

// In-memory store for comments
// demoComments[publicationId] = [{ id, user_id, comment, target_id, target_type, created_at }]
const demoComments = Object.create(null);
function ensureDemoCommentsArray(id) {
  if (!demoComments[id]) demoComments[id] = [];
  return demoComments[id];
}

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

    // Opción B: exigir mapping local y match estricto
    if (!req.actor?.mongo_id) {
      return res.status(409).json({ error: "Usuario no sincronizado en este servicio" });
    }
    if (String(req.actor.mongo_id) !== String(user_id)) {
      return res.status(403).json({ error: "No puedes actuar en nombre de otro usuario" });
    }

    // Validar target_type
    const validTargetTypes = ["review", "rating", "list"];
    if (!validTargetTypes.includes(target_type)) {
      console.log(`❌ addComment - Target type inválido: ${target_type}`);
      return res.status(400).json({
        error: "target_type debe ser: review, rating o list",
      });
    }

        // Verificar que la publicación exista y sea del tipo correcto
    const publication = await Publication.findOne({
      _id: target_id,
      type: target_type
    }).populate('author_id', 'username');

    if (!publication) {
      return res.status(404).json({
        error: '❌ Publicación no encontrada o tipo incorrecto'
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

    // Verificar que el usuario exista (relajado para DEMO)
    let user = null;
    try {
      user = await User.findOne({ _id: user_id });
    } catch (_) {}
    if (!DEMO_PUBLICATION_IDS.has(String(target_id))) {
      if (!user) {
        console.log(`❌ addComment - Usuario no encontrado: ${user_id}`);
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      console.log(`✅ addComment - Usuario encontrado: ${user.username}`);
    } else {
      if (user) console.log(`ℹ️ addComment[DEMO] - Usuario encontrado para enriquecer: ${user.username}`);
      else console.log(`ℹ️ addComment[DEMO] - Usuario no existe, continuamos igualmente`);
    }

    if (DEMO_PUBLICATION_IDS.has(String(target_id))) {
      // DEMO path: store comment in memory
      const list = ensureDemoCommentsArray(String(target_id));
      const demoComment = {
        id: `demo_comment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        user_id: String(user_id),
        target_id: String(target_id),
        target_type,
        comment: comment.trim(),
        created_at: new Date().toISOString(),
      };
      list.push(demoComment);

      // Intentar usar ID externo (review_id) si existe publicación en DB
      let externalTargetId = String(target_id);
      try {
        const pubDoc = await Publication.findById(target_id).select('review_id');
        if (pubDoc && pubDoc.review_id !== undefined && pubDoc.review_id !== null) {
          externalTargetId = String(pubDoc.review_id);
        }
      } catch (_) { /* noop */ }
      createCommentEvent(user_id, externalTargetId, demoComment.id, target_type);

      const responseData = {
        message: "Comentario agregado exitosamente (demo)",
        comment: {
          id: demoComment.id,
          user: {
            id: user?._id || String(user_id),
            username: user?.username || `user_${String(user_id).slice(-4)}`,
            avatar_url: user?.avatar_url || null,
          },
          target: {
            id: target_id,
            type: target_type,
          },
          comment: demoComment.comment,
          created_at: demoComment.created_at,
        },
      };
      console.log(`✅ addComment[DEMO] - Respondiendo con éxito:`, responseData);
      return res.status(201).json(responseData);
    } else {
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

      // Usar ID externo si está disponible en la publicación
      const externalTargetId = (publication && publication.review_id !== undefined && publication.review_id !== null)
        ? String(publication.review_id)
        : String(target_id);
      if (externalTargetId !== String(target_id)) {
        console.log(`🔄 addComment - Usando review_id externo ${externalTargetId} en lugar de _id ${target_id}`);
      } else {
        console.log(`ℹ️ addComment - No hay review_id externo, usando _id local ${target_id}`);
      }
      createCommentEvent(user_id, externalTargetId, newComment._id, target_type);

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
    }
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

    if (!req.actor?.mongo_id) {
      return res.status(409).json({ error: "Usuario no sincronizado en este servicio" });
    }
    if (String(req.actor.mongo_id) !== String(user_id)) {
      return res.status(403).json({ error: "No puedes actuar en nombre de otro usuario" });
    }

    // DEMO path: if comment id starts with demo_comment_, remove from memory
    if (String(comment_id).startsWith('demo_comment_')) {
      let removed = false;
      for (const pubId of Object.keys(demoComments)) {
        const idx = demoComments[pubId].findIndex((c) => c.id === comment_id);
        if (idx !== -1) {
          const c = demoComments[pubId][idx];
          if (String(c.user_id) !== String(user_id)) {
            return res.status(403).json({ error: "No tienes permisos para eliminar este comentario" });
          }
          demoComments[pubId].splice(idx, 1);
          // Intentar mapear a ID externo
          let externalTargetId = String(c.target_id);
          try {
            const pubDoc = await Publication.findById(c.target_id).select('review_id');
            if (pubDoc && pubDoc.review_id !== undefined && pubDoc.review_id !== null) {
              externalTargetId = String(pubDoc.review_id);
            }
          } catch (_) { /* noop */ }
          createDeleteCommentEvent(c.user_id, externalTargetId, comment_id);
          removed = true;
          break;
        }
      }
      if (!removed) {
        return res.status(404).json({ error: "Comentario no encontrado" });
      }
      return res.status(200).json({ message: "Comentario eliminado exitosamente (demo)" });
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
    // Mapear a ID externo si disponible
    let externalTargetId = String(comment.target_id);
    try {
      const pubDoc = await Publication.findById(comment.target_id).select('review_id');
      if (pubDoc && pubDoc.review_id !== undefined && pubDoc.review_id !== null) {
        externalTargetId = String(pubDoc.review_id);
      }
    } catch (_) { /* noop */ }
    if (externalTargetId !== String(comment.target_id)) {
      console.log(`🔄 deleteComment - Usando review_id externo ${externalTargetId} en lugar de _id ${comment.target_id}`);
    } else {
      console.log(`ℹ️ deleteComment - No hay review_id externo, usando _id local ${comment.target_id}`);
    }
    createDeleteCommentEvent(comment.user_id, externalTargetId, comment_id);
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
    
    // Verificar que la publicación exista
    const publication = await Publication.findById(publication_id);
    if (!publication) {
      return res.status(404).json({
        error: 'Publicación no encontrada'
      });
    }
    
    if (DEMO_PUBLICATION_IDS.has(String(publication_id))) {
      const mem = ensureDemoCommentsArray(String(publication_id));

      // Traer también comentarios de DB y fusionarlos
      const dbComments = await Comment.find({ target_id: publication_id })
        .populate("user_id", "username avatar_url")
        .sort({ created_at: -1 });

      const memEnriched = await Promise.all(
        mem.map(async (c) => {
          const u = await User.findById(c.user_id).select("username avatar_url");
          return {
            id: c.id,
            user: {
              id: c.user_id,
              username: u?.username || `user_${String(c.user_id).slice(-4)}`,
              avatar_url: u?.avatar_url || null,
            },
            comment: c.comment,
            created_at: c.created_at,
          };
        })
      );

      const dbNormalized = dbComments.map((comment) => ({
        id: comment._id,
        user: {
          id: comment.user_id._id,
          username: comment.user_id.username,
          avatar_url: comment.user_id.avatar_url,
        },
        comment: comment.comment,
        created_at: comment.created_at,
      }));

      // Merge memoria + DB y paginar
      const merged = [...memEnriched, ...dbNormalized].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      const totalComments = merged.length;
      const paginated = merged.slice(skip, skip + limit);
      return res.status(200).json({
        comments: paginated,
        total_comments: totalComments,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(totalComments / limit),
          total_items: totalComments,
          items_per_page: limit,
        },
      });
    } else {
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
    }
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
