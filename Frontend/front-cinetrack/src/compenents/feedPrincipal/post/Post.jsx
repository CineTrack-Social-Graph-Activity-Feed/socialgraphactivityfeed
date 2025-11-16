import { useState, useEffect } from "react";
import "./Post.css";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import { API_URL } from "../../../config/api";
import { useAuth } from "../../../config/AuthContext";
import { prerenderToNodeStream } from "react-dom/static";

dayjs.extend(relativeTime);
dayjs.locale("es");

function Post({}) {
  const { user, fetchWithAuth, signOut } = useAuth(); // <- user de /me
  const userId = user.user.user_id; // normalizamos ID
  const [perfil, setPerfil] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsConPeli, setPostsConPeli] = useState([]);
  const [comment, setComment] = useState("");
  const [commentsByPost, setCommentsByPost] = useState([]);
  const [showAllComments, setShowAllComments] = useState({});
  const [likesByPost, setLikesByPost] = useState({});
  const [commentByPost, setCommentByPost] = useState({});
  const [revealedPosts, setRevealedPosts] = useState({});
  const [followVersion, setFollowVersion] = useState(0);
  const [expandedPoster, setExpandedPoster] = useState(null); // postId del poster ampliado

  useEffect(() => {
    const onFollowersUpdated = () => setFollowVersion((v) => v + 1);
    window.addEventListener("followersUpdated", onFollowersUpdated);
    return () =>
      window.removeEventListener("followersUpdated", onFollowersUpdated);
  }, []);

  /* Obtengo los datos del usuario logueado */
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await fetchWithAuth(
          `http://localhost:3000/api/user/${userId}`
        );
        if (!res.ok) throw new Error("Error al traer usuario");
        const data = await res.json();
        setPerfil(data.user || data); // depende de tu shape
      } catch (err) {
        console.error("Error al traer usuario:", err);
      }
    })();
  }, [userId, fetchWithAuth]);

  /**
   * Traigo los posts de las personas que sigo desde el backend
   */
  useEffect(() => {
    const objectId = perfil?.id;
    if (!objectId) return;

    (async () => {
      try {
        console.log("Trayendo las reviews de mis amigos...");
        const res = await fetchWithAuth(
          `http://localhost:3000/api/feed?user_id=${objectId}`
        );
        if (!res.ok) throw new Error(`Error ${res.status}`);

        const data = await res.json();
        const feed = data.feed || [];
        setPosts(feed);

        // 1) juntar movie_ids únicos
        const idsUnicos = [
          ...new Set(
            feed
              .map((p) => p._doc?.movie_id)
              .filter((id) => id !== null && id !== undefined) // <-- clave: no elimina 0
          ),
        ];

        // 2) traer películas en paralelo (evita duplicados)
        const peliculas = await Promise.all(
          idsUnicos.map(async (id) => {
            try {
              const r = await fetchWithAuth(
                `http://localhost:3000/api/movie/${id}`
              );
              if (!r.ok) throw new Error(`Movie ${id}: ${r.status}`);
              const movieData = await r.json();
              return { id, movie: movieData };
            } catch (e) {
              console.error("Error trayendo película", id, e);
              return { id, movie: null }; // tolerante a errores
            }
          })
        );

        // 3) armar un map id -> movie
        const movieMap = new Map(peliculas.map(({ id, movie }) => [id, movie]));

        // 4) mergear cada post con su película

        const enriquecidos = feed.map((post) => ({
          ...post,
          movie: movieMap.get(post._doc?.movie_id) ?? null,
        }));

        // Si el post referencia una película y no la tenemos (404/inactiva), no se muestra
        const filtrados = enriquecidos.filter((p) => {
          const mid = p._doc?.movie_id;
          if (mid === null || mid === undefined) return true; // posts sin película siguen
          return !!p.movie; // solo mantener si la movie existe
        });

        setPostsConPeli(filtrados);
        console.log("Publicaciones enriquecidas:", filtrados);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("❌ Error al cargar posts o películas:", err);
        }
      }
    })();
  }, [perfil?.id, fetchWithAuth, followVersion]);

  /* Guarda el comentario de una publicacion a la BD o localmente */
  const handleSubmit = async (e, post) => {
    e.preventDefault();

    const publicationId = post?._doc?._id ?? post?.id;
    const targetType = post?._doc?.type ?? post?.type;

    const text = (commentByPost?.[publicationId] || "").trim(); // 👈 de commentByPost
    if (!text) return;

    try {
      const res = await fetchWithAuth(`http://localhost:3000/api/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: perfil.id,
          target_type: targetType,
          target_id: publicationId,
          comment: text,
        }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);

      const resComments = await fetchWithAuth(
        `http://localhost:3000/api/comment/publication/${String(publicationId)}`
      );
      const dataComments = await resComments.json();

      setCommentsByPost((prev) => {
        const unique = (dataComments.comments || []).filter(
          (c, i, arr) =>
            i === arr.findIndex((x) => (x._id ?? x.id) === (c._id ?? c.id))
        );
        return { ...prev, [publicationId]: unique };
      });

      // limpiar SOLO este textarea (misma key)
      setCommentByPost((prev) => ({ ...prev, [publicationId]: "" }));
    } catch (err) {
      console.error("❌ Error al guardar comentario:", err);
      alert(`Error al guardar comentario: ${err.message}`);
    }
  };

  //LIKE

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const results = await Promise.all(
          posts.map(async (p) => {
            try {
              const res = await fetchWithAuth(
                `http://localhost:3000/api/like/publication/${p._doc._id}`
              );

              if (!res.ok) throw new Error(`GET likes failed: ${res.status}`);

              const data = await res.json();

              const backendLikes = Array.isArray(data.likes) ? data.likes : [];
              const backendTotal =
                typeof data.total_likes === "number"
                  ? data.total_likes
                  : backendLikes.length;
              const myBackendLike = backendLikes.find(
                (l) => String(l.user?.id) === String(perfil?.id)
              );

              return [
                p._doc._id,
                {
                  total_likes: backendTotal,
                  liked: !!myBackendLike,
                  like_id: myBackendLike?.id || null,
                },
              ];
            } catch (err) {
              console.warn(
                `Error al obtener likes para post ${p._doc._id}:`,
                err
              );
              return [
                p._doc._id,
                { total_likes: 0, liked: false, like_id: null },
              ];
            }
          })
        );

        setLikesByPost(Object.fromEntries(results));
      } catch (err) {
        console.error("Error al obtener likes:", err);
      }
    };

    fetchLikes();
  }, [posts, perfil?.id]);

  // Cargar comentarios desde backend o usar locales

  useEffect(() => {
    const loadComments = async () => {
      try {
        const results = await Promise.all(
          posts.map((p) =>
            fetchWithAuth(
              `http://localhost:3000/api/comment/publication/${String(
                p._doc._id
              )}`
            )
              .then((res) => res.json())
              .then((data) => {
                return [p._doc._id, data.comments || []];
              })
          )
        );

        const newCommentsByPost = results.reduce((acc, [id, comments]) => {
          if (id) acc[id] = comments;
          return acc;
        }, {});
        setCommentsByPost(newCommentsByPost);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error al cargar comentarios:", err);
        }
      }
    };

    loadComments();
  }, [posts, fetchWithAuth]);

  const handleLike = async (post) => {
    try {
      const state = likesByPost[post._doc._id] || {
        liked: false,
        like_id: null,
      };

      // Intento primero con el backend
      try {
        if (!state.liked) {
          // 👉 Dar like
          console.log("Enviando like:", {
            user_id: perfil.id,
            target_id: post._doc._id,
            target_type: post._doc.type,
          });

          const res = await fetchWithAuth(`http://localhost:3000/api/like`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: perfil.id,
              target_id: post._doc._id,
              target_type: post._doc.type,
            }),
          });

          // Procesar respuesta
          const data = await res.json();
          console.log("Respuesta al dar like:", {
            status: res.status,
            ok: res.ok,
            data: data,
          });

          if (res.ok) {
            // Éxito con el backend
            refreshLikes(post._doc._id);
            return;
          }
        } else {
          // 👉 Quitar like
          console.log("Eliminando like:", {
            like_id: state.like_id,
            user_id: userId,
          });

          const res = await fetchWithAuth(
            `http://localhost:3000/api/like/${state.like_id}`,
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: perfil.id }),
            }
          );

          if (res.ok) {
            // Éxito con el backend
            refreshLikes(post._doc._id);
            return;
          }
        }
      } catch (backendErr) {
        console.warn(
          "Error con el backend al procesar like:",
          backendErr.message
        );
        alert(`No se pudo procesar el like: ${backendErr.message}`);
      }
    } catch (err) {
      console.error("Error en handleLike:", err);
      alert(`Error al procesar like: ${err.message}`);
    }
  };

  // 🔹 traer likes y estado actualizado desde el back
  const refreshLikes = async (postId) => {
    try {
      try {
        const res = await fetchWithAuth(
          `http://localhost:3000/api/like/publication/${postId}`
        );

        if (!res.ok) return;

        const data = await res.json();

        const backendLikes = Array.isArray(data.likes) ? data.likes : [];
        const total =
          typeof data.total_likes === "number"
            ? data.total_likes
            : backendLikes.length;
        const myLike = backendLikes.find(
          (l) => String(l.user?.id) === String(perfil.id)
        );

        const likeData = {
          total_likes: total,
          liked: !!myLike,
          like_id: myLike?.id ?? null,
        };

        setLikesByPost((prev) => ({
          ...prev,
          [postId]: likeData,
        }));
      } catch (err) {
        console.warn(`Error al obtener likes para post ${postId}:`, err);
        // Error silencioso; mantenemos estado previo
      }
    } catch (err) {
      console.error("Error al refrescar likes:", err);
    }
  };

  const handleDeleteComment = async (commentId, postId) => {
    // Si no es local, intentar con el backend
    try {
      const res = await fetchWithAuth(
        `http://localhost:3000/api/comment/${commentId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: perfil.id }), // 👈 necesario para permisos
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al eliminar comentario");
      }

      console.log(`Comentario ${commentId} eliminado`);

      // 👇 refrescar comentarios del post
      const resComments = await fetchWithAuth(
        `http://localhost:3000/api/comment/publication/${postId}`
      );
      const dataComments = await resComments.json();

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: Array.isArray(dataComments.comments)
          ? dataComments.comments
          : [],
      }));
    } catch (err) {
      console.warn("Error al eliminar comentario con el backend:", err.message);
      alert(`No se pudo eliminar el comentario: ${err.message}`);
    }
  };

  function StarRating({ puntuacion }) {
    const totalEstrellas = 5;

    return (
      <div className="stars">
        {[...Array(totalEstrellas)].map((_, index) => {
          const starIndex = index + 1;

          if (puntuacion >= starIndex) {
            // Estrella llena
            return (
              <svg
                key={index}
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="gold"
                class="bi bi-star-fill estrella"
                viewBox="0 0 16 16"
              >
                <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
              </svg>
            );
          } else if (puntuacion >= starIndex - 0.5) {
            // Media estrella
            return (
              <svg
                key={index}
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="gold"
                class="bi bi-star-half estrella"
                viewBox="0 0 16 16"
              >
                <path d="M5.354 5.119 7.538.792A.52.52 0 0 1 8 .5c.183 0 .366.097.465.292l2.184 4.327 4.898.696A.54.54 0 0 1 16 6.32a.55.55 0 0 1-.17.445l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256a.5.5 0 0 1-.146.05c-.342.06-.668-.254-.6-.642l.83-4.73L.173 6.765a.55.55 0 0 1-.172-.403.6.6 0 0 1 .085-.302.51.51 0 0 1 .37-.245zM8 12.027a.5.5 0 0 1 .232.056l3.686 1.894-.694-3.957a.56.56 0 0 1 .162-.505l2.907-2.77-4.052-.576a.53.53 0 0 1-.393-.288L8.001 2.223 8 2.226z" />
              </svg>
            ); // <- podés cambiar a SVG más bonito
          } else {
            // Estrella vacía
            return (
              <svg
                key={index}
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-star estrella"
                viewBox="0 0 16 16"
              >
                <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z" />
              </svg>
            );
          }
        })}
      </div>
    );
  }

  function renderPostByType(post) {
    const pid = post._doc._id;
    const isSpoiler = post._doc.has_spoilers && !revealedPosts[pid];
    const movieData = post?.movie?.movie || null;
    const hasPoster = !!movieData?.poster;

    return (
      <div className="post-spoiler" key={pid}>
        {isSpoiler && (
          <div className="spam-overlay">
            <button
              className="btn-spoiler"
              onClick={() =>
                setRevealedPosts((prev) => ({ ...prev, [pid]: true }))
              }
            >
              ⚠️ Posible spoiler! Click para revelar la reseña
            </button>
          </div>
        )}
        <div
          key={post._doc._id}
          className={`post ${isSpoiler ? "blurred" : ""}`}
        >
          <div className="post-type">
            <p>Escribio una reseña</p>
          </div>
          {/* Header */}
          <div className="post-header">
            <img
              src={post.author.avatar_url}
              alt="avatar"
              className="avatar-post"
              onError={(e) => {
                e.target.src =
                  "https://st3.depositphotos.com/4111759/13425/v/450/depositphotos_134255670-stock-illustration-avatar-people-male-profile-gray.jpg";
              }}
            />
            <div>
              <div className="post-user-info">
                <h4 className="name">{post.author.username}</h4>
                {/* <span className="username-id">@{post.author.username}</span>{" "} */}
              </div>
              <span className="time">
                {dayjs(post._doc.createdAt).fromNow()}
              </span>
            </div>
          </div>

          {/* Texto */}
          <div className="titulo-pelicula">
            <h3>
              {movieData ? movieData.titulo : "Película no disponible"}
            </h3>
            <StarRating puntuacion={post._doc.rating} />{" "}
          </div>
          <div className="post-body">
            <div className="post-text-container">
              <p className="post-text">{post._doc.content}</p>
            </div>
            <div className="post-image-container">
              {/* Imagen (si existe) */}
              {hasPoster && (
                <img
                  src={movieData.poster}
                  alt="post"
                  className="post-image"
                  onClick={() => setExpandedPoster(pid)}
                />
              )}
            </div>
          </div>

          {/* Reacciones */}
          <div className="post-actions">
            <div className="actions">
              <div className="action">
                <button
                  className="like-post-btn"
                  aria-label="Like post"
                  onClick={() => handleLike(post)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill={
                      likesByPost[post._doc._id]?.liked ? "red" : "currentColor"
                    }
                    class="bi bi-heart-fill"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"
                    />
                  </svg>
                </button>
                <span>{likesByPost[post._doc._id]?.total_likes ?? 0}</span>
              </div>
              <div className="action">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-chat-dots-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M16 8c0 3.866-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.584.296-1.925.864-4.181 1.234-.2.032-.352-.176-.273-.362.354-.836.674-1.95.77-2.966C.744 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7M5 8a1 1 0 1 0-2 0 1 1 0 0 0 2 0m4 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
                </svg>
                <span>{(commentsByPost[post._doc._id] || []).length}</span>
              </div>
            </div>

            <div className="comment-post">
              <img
                src={
                  user.user.image_url
                    ? user.user.image_url
                    : "https://st3.depositphotos.com/4111759/13425/v/450/depositphotos_134255670-stock-illustration-avatar-people-male-profile-gray.jpg"
                }
                alt="avatar"
                className="user-logo-post"
              />
              <form
                className="comment-post-wrap"
                onSubmit={(e) => handleSubmit(e, post)}
              >
                <textarea
                  className="comment-post-input"
                  placeholder="Escribe un comentario..."
                  aria-label="Comentario"
                  value={commentByPost?.[post._doc._id] ?? ""} // 👈 siempre string
                  onChange={(e) =>
                    setCommentByPost((prev) => ({
                      ...prev,
                      [post._doc._id]: e.target.value, // 👈 escribimos en la misma key
                    }))
                  }
                  rows={1}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
              </form>
              <button
                type="submit"
                className="comment-post-btn"
                aria-label="Comment"
                onClick={(e) => handleSubmit(e, post)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-arrow-right-circle"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill-rule="evenodd"
                    d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Comentarios (solo si hay) */}
          {(commentsByPost[post._doc._id] || []).length > 0 ? (
            <>
              <hr />
              {(commentsByPost[post._doc._id] || [])
                .slice() // copia para no mutar el original
                .slice(0, showAllComments[post._doc._id] ? undefined : 2) // muestra 2 más recientes
                .map((c) => (
                  <div key={c.id} className="comment">
                    <img
                      src={
                        c.user?.avatar_url ||
                        "https://st3.depositphotos.com/4111759/13425/v/450/depositphotos_134255670-stock-illustration-avatar-people-male-profile-gray.jpg"
                      }
                      alt="user"
                      className="avatar-comment"
                      onError={(e) => {
                        e.target.src =
                          "https://st3.depositphotos.com/4111759/13425/v/450/depositphotos_134255670-stock-illustration-avatar-people-male-profile-gray.jpg";
                      }}
                    />
                    <div className="comment-body">
                      <div>
                        <strong>
                          {c.user?.username || "Usuario"}{" "}
                          <span className="comment-time">
                            {c.created_at
                              ? dayjs(c.created_at).fromNow()
                              : "hace un momento"}
                          </span>
                        </strong>
                        <p className="comment-text">{c.comment}</p>
                      </div>
                      {String(c.user.id) === String(perfil?.id) && (
                        <button
                          className="delete-comment-btn"
                          aria-label="Delete comment"
                          onClick={() =>
                            handleDeleteComment(c.id, post._doc._id)
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="bi bi-trash3"
                            viewBox="0 0 16 16"
                          >
                            <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {/* Opciones adicionales de comentarios que se pueden agregar en el futuro */}
                  </div>
                ))}

              {/* Botón para ver todos los comentarios */}
              <div className="view-all">
                {(commentsByPost[post._doc._id] || []).length > 2 && (
                  <button
                    className="view-all-btn"
                    onClick={() =>
                      setShowAllComments((prev) => {
                        console.log(
                          `🔄 Cambiando estado 'showAllComments' para post ${
                            post.id
                          }: ${!prev[post._doc._id]}`
                        );
                        return {
                          ...prev,
                          [post._doc._id]: !prev[post._doc._id], // toggle por post
                        };
                      })
                    }
                  >
                    {showAllComments[post._doc._id]
                      ? "Ver menos comentarios"
                      : "Ver todos los comentarios"}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="no-comments">
              <hr />
              <div>
                <p>No hay comentarios para mostrar</p>
              </div>
            </div>
          )}
        </div>
        {/* Lightbox simple para poster ampliado */}
        {expandedPoster === pid && hasPoster && (
          <div
            className="poster-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`Vista ampliada del poster de ${movieData?.titulo || "Película no disponible"}`}
            onClick={() => setExpandedPoster(null)}
          >
            <img
              src={movieData.poster}
              alt={`Poster de ${movieData?.titulo || "Película no disponible"}`}
              className="poster-lightbox-image"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {postsConPeli.length === 0 ? (
        <p style={{ color: "#ccc", textAlign: "center", marginTop: "20px" }}>
          No hay actividad para mostrar por el momento!
        </p>
      ) : (
        postsConPeli.map((post) => renderPostByType(post))
      )}
    </div>
  );
}

export default Post;
