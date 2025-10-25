const Like = require("../models/Like");
const Publication = require("../models/Publication");
const User = require("../models/User");
const { createLikeEvent, createUnlikeEvent } = require("../utils/events");

// --- DEMO MODE for hardcoded publications ---
// Allow likes for hardcoded posts that exist only on the frontend.
// We keep an in-memory store so the feature works in the cloud without a Publications DB.
const DEMO_PUBLICATION_IDS = new Set([
  "65f5e1d77c65c827d8536abc",
  "65f5e1d77c65c827d8536abd",
  "65f5e1d77c65c827d8536abe",
]);

// In-memory store structure:
// demoLikes[publicationId] = [{ id, user_id, target_id, target_type, created_at }]
const demoLikes = Object.create(null);
function ensureDemoArray(id) {
  if (!demoLikes[id]) demoLikes[id] = [];
  return demoLikes[id];
}

/**
 * Dar like a una publicación
 * POST /api/like
 */
const addLike = async (req, res) => {
  try {
    const { user_id, target_id, target_type } = req.body;
    
    console.log("📩 addLike - Request recibido:", { user_id, target_id, target_type });

    // Validaciones básicas
    if (!user_id || !target_id || !target_type) {
      console.log("❌ addLike - Validación fallida: campos requeridos faltantes");
      return res.status(400).json({
        error: "user_id, target_id y target_type son requeridos",
      });
    }

    // Opción B: exigir mapping local y coincidencia
    if (!req.actor?.mongo_id) {
      return res.status(409).json({ error: "Usuario no sincronizado en este servicio" });
    }
    if (String(req.actor.mongo_id) !== String(user_id)) {
      return res.status(403).json({ error: "No puedes actuar en nombre de otro usuario" });
    }

    // Validar target_type
    const validTargetTypes = ["review", "rating", "list"];
    if (!validTargetTypes.includes(target_type)) {
      console.log(`❌ addLike - Target type inválido: ${target_type}`);
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

    // Verificar que el usuario exista (relajado para DEMO)
    let user = null;
    try {
      user = await User.findOne({ user_id: user_id });
    } catch (_) {}
    if (!DEMO_PUBLICATION_IDS.has(String(target_id))) {
      if (!user) {
        console.log(`❌ addLike - Usuario no encontrado: ${user_id}`);
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      console.log(`✅ addLike - Usuario encontrado: ${user.username}`);
    } else {
      // Para DEMO, no bloqueamos si el usuario no existe; enriquecemos si está
      if (user) console.log(`ℹ️ addLike[DEMO] - Usuario encontrado para enriquecer: ${user.username}`);
      else console.log(`ℹ️ addLike[DEMO] - Usuario no existe, continuamos igualmente`);
    }

    if (DEMO_PUBLICATION_IDS.has(String(target_id))) {
      // DEMO path: store like in memory
      const list = ensureDemoArray(String(target_id));
      const duplicate = list.find((l) => String(l.user_id) === String(user_id));
      if (duplicate) {
        console.log(`❌ addLike[DEMO] - Like duplicado`);
        return res.status(409).json({ error: "Ya has dado like a esta publicación" });
      }

      const demoLike = {
        id: `demo_like_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        user_id: String(user_id),
        target_id: String(target_id),
        target_type,
        created_at: new Date().toISOString(),
      };
      list.push(demoLike);

      createLikeEvent(user_id, target_id, target_type);

      const responseData = {
        message: "Like agregado exitosamente (demo)",
        like: {
          id: demoLike.id,
          user: {
            id: user?._id || String(user_id),
            username: user?.username || `user_${String(user_id).slice(-4)}`,
          },
          target: target_id,
          created_at: demoLike.created_at,
        },
      };
      console.log(`✅ addLike[DEMO] - Respondiendo con éxito:`, responseData);
      return res.status(201).json(responseData);
    } else {
      // Normal DB path
      // Verificar si ya existe el like
      const existingLike = await Like.findOne({
        user_id,
        target_id,
        target_type,
      });

      console.log('Buscando like existente:', { user_id, target_id, target_type });
      console.log('Like existente encontrado:', existingLike);

      if (existingLike) {
        console.log(`❌ addLike - Like duplicado detectado: ${existingLike._id}`);
        return res.status(409).json({
          error: "Ya has dado like a esta publicación",
        });
      }

      // Crear el like
      const like = new Like({
        user_id,
        target_id,
        target_type,
      });

      try {
        await like.save();
        console.log(`✅ addLike - Like guardado exitosamente: ${like._id}`);
      } catch (saveError) {
        console.log(`❌ addLike - Error al guardar like:`, saveError);
        throw saveError;
      }

      // Publicar evento
      createLikeEvent(user_id, target_id, target_type);
      console.log(`✉️ addLike - Evento de like publicado`);

      const responseData = {
        message: "Like agregado exitosamente",
        like: {
          id: like._id,
          user: {
            id: user._id,
            username: user.username,
          },
          target: target_id,
          created_at: like.created_at,
        },
      };
      
      console.log(`✅ addLike - Respondiendo con éxito:`, responseData);
      return res.status(201).json(responseData);
    }
  } catch (error) {
    console.error("Error en addLike:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      error: "Error interno del servidor",
      details: error.message,
      code: error.name || 'UnknownError'
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
        error: "like_id es requerido",
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

    // DEMO path: if like_id starts with demo_like_, remove from memory
    if (String(like_id).startsWith('demo_like_')) {
      let removed = false;
      for (const pubId of Object.keys(demoLikes)) {
        const idx = demoLikes[pubId].findIndex((l) => l.id === like_id);
        if (idx !== -1) {
          const like = demoLikes[pubId][idx];
          if (String(like.user_id) !== String(user_id)) {
            return res.status(403).json({ error: "No tienes permisos para eliminar este like" });
          }
          demoLikes[pubId].splice(idx, 1);
          createUnlikeEvent(like.user_id, like.target_id, like.target_type);
          removed = true;
          break;
        }
      }
      if (!removed) {
        return res.status(404).json({ error: "Like no encontrado" });
      }
      return res.status(200).json({ message: "Like eliminado exitosamente (demo)" });
    }

    // Normal DB path
    const like = await Like.findById(like_id);
    if (!like) {
      return res.status(404).json({
        error: "Like no encontrado",
      });
    }

    if (like.user_id.toString() !== user_id) {
      return res.status(403).json({
        error: "No tienes permisos para eliminar este like",
      });
    }

    await Like.findByIdAndDelete(like_id);
    createUnlikeEvent(like.user_id, like.target_id, like.target_type);
    res.status(200).json({ message: "Like eliminado exitosamente" });
  } catch (error) {
    console.error("Error en removeLike:", error);
    res.status(500).json({
      error: "Error interno del servidor",
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
        error: "publication_id es requerido",
      });
    }

    /*
    // Verificar que la publicación exista
    const publication = await Publication.findById(publication_id);
    if (!publication) {
      return res.status(404).json({
        error: "Publicación no encontrada",
      });
    }
    */

    if (DEMO_PUBLICATION_IDS.has(String(publication_id))) {
      const mem = ensureDemoArray(String(publication_id));
      // También traemos likes de DB y fusionamos
      const dbLikes = await Like.find({ target_id: publication_id })
        .populate("user_id", "username avatar_url")
        .sort({ created_at: -1 });

      const memEnriched = await Promise.all(
        mem.map(async (l) => {
          const u = await User.findById(l.user_id).select("username avatar_url");
          return {
            id: l.id,
            user: {
              id: l.user_id,
              username: u?.username || `user_${String(l.user_id).slice(-4)}`,
              avatar_url: u?.avatar_url || null,
            },
            created_at: l.created_at,
          };
        })
      );

      const dbNormalized = dbLikes.map((like) => ({
        id: like._id,
        user: {
          id: like.user_id._id,
          username: like.user_id.username,
          avatar_url: like.user_id.avatar_url,
        },
        created_at: like.created_at,
      }));

      // Merge memoria + DB, ordenado desc por fecha
      const merged = [...memEnriched, ...dbNormalized].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      const totalLikes = merged.length;
      const paginated = merged.slice(skip, skip + limit);
      return res.status(200).json({
        likes: paginated,
        total_likes: totalLikes,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(totalLikes / limit),
          total_items: totalLikes,
          items_per_page: limit,
        },
      });
    } else {
      // DB path
      const likes = await Like.find({ target_id: publication_id })
        .populate("user_id", "username avatar_url")
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const totalLikes = await Like.countDocuments({ target_id: publication_id });

      return res.status(200).json({
        likes: likes.map((like) => ({
          id: like._id,
          user: {
            id: like.user_id._id,
            username: like.user_id.username,
            avatar_url: like.user_id.avatar_url,
          },
          created_at: like.created_at,
        })),
        total_likes: totalLikes,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(totalLikes / limit),
          total_items: totalLikes,
          items_per_page: limit,
        },
      });
    }
  } catch (error) {
    console.error("Error en getPublicationLikes:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
};

module.exports = {
  addLike,
  removeLike,
  getPublicationLikes,
};