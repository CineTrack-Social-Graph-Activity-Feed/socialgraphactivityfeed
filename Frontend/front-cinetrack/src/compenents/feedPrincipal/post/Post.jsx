import { useState, useEffect } from "react";
import "./Post.css";
import { useUser } from "../../../../UserContex";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import { API_URL } from "../../../config/api";

dayjs.extend(relativeTime);
dayjs.locale("es");

function Post({ post }) {
  console.log("🚀 Inicializando componente Post");
  const { userId } = useUser();
  const [user, setUser] = useState({});
  const [comment, setComment] = useState("");
  const [commentsByPost, setCommentsByPost] = useState({});
  const [showAllComments, setShowAllComments] = useState({});
  const [likesByPost, setLikesByPost] = useState({});
  
  // Sin datos locales: todo viene del backend
  
  // Depuración inicial
  console.log("👤 userId:", userId);

  /* Obtengo los datos del usuario logueado */
  useEffect(() => {
    console.log("🔄 Obteniendo datos del usuario:", userId);
    fetch(`${API_URL}/api/user/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("👤 Datos de usuario obtenidos:", data.user);
        
        // Si no se puede obtener el usuario del backend, crearemos uno local para demostración
        if (!data.user) {
          console.log("⚠️ No se pudo obtener el usuario del backend, usando datos de demostración");
          setUser({
            id: userId,
            username: "usuario_demo",
            name: "Usuario Demo",
            avatar_url: "https://i.pravatar.cc/60?img=1"
          });
          return;
        }
        
        setUser(data.user);
      })
      .catch((err) => {
        console.error("Error al traer usuario:", err);
        
        // En caso de error, usar un usuario de demostración
        console.log("⚠️ Error al obtener usuario, usando datos de demostración");
        setUser({
          id: userId,
          username: "usuario_demo",
          name: "Usuario Demo",
          avatar_url: "https://i.pravatar.cc/60?img=1"
        });
      });
  }, [userId]);

  /* Guarda el comentario de una publicacion a la BD o localmente */
  const handleSubmit = async (e, post) => {
    e.preventDefault();

    if (!comment.trim()) return;

    try {
      console.log("📝 Enviando comentario:", {
        user_id: userId,
        target_type: post.type,
        target_id: post.id,
        comment,
      });
      
      // Intentar primero con el backend
      try {
        console.log("🔄 Intentando guardar comentario en el backend...");
        const res = await fetch(`${API_URL}/api/comment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            target_type: post.type,
            target_id: post.id,
            comment,
          }),
        });

        // Obtener respuesta como texto primero
        const responseText = await res.text();
        console.log("📄 Respuesta en texto:", responseText);
        
        // Intentar parsear como JSON si es posible
        let responseData;
        try {
          if (responseText) {
            responseData = JSON.parse(responseText);
          }
        } catch (parseErr) {
          console.error("❌ Error al parsear respuesta JSON:", parseErr);
        }
        
        console.log("📊 Respuesta al crear comentario:", {
          status: res.status,
          ok: res.ok,
          data: responseData
        });

        if (res.ok) {
          // Si el backend funcionó, actualizamos con los datos del backend
          try {
            console.log("✅ Comentario guardado en backend, actualizando lista...");
            const resComments = await fetch(
              `${API_URL}/api/comment/publication/${post.id}`
            );
            
            if (resComments.ok) {
              const dataComments = await resComments.json();
              console.log("📊 Comentarios actualizados desde backend:", dataComments);
              setCommentsByPost((prev) => ({
                ...prev,
                [post.id]: Array.isArray(dataComments.comments) ? dataComments.comments : [],
              }));
              setComment("");
              return;
            } else {
              console.warn("⚠️ La respuesta del backend para obtener comentarios no fue exitosa:", resComments.status);
              throw new Error(`GET comments failed: ${resComments.status}`);
            }
          } catch (fetchErr) {
            console.warn("⚠️ Error al obtener comentarios actualizados:", fetchErr);
            throw fetchErr;
          }
        } else {
          console.warn("⚠️ La respuesta del backend no fue exitosa:", res.status);
          throw new Error(`POST comment failed: ${res.status}`);
        }
      } catch (backendErr) {
        console.warn("⚠️ Error con el backend al crear comentario:", backendErr.message);
        alert(`No se pudo guardar el comentario: ${backendErr.message}`);
      }
      // Limpiar después del éxito; si falló, lo dejamos para reintentar

    } catch (err) {
      console.error("❌ Error al guardar comentario:", err);
      alert(`Error al guardar comentario: ${err.message}`);
    }
  };

  /**
   * Posts de ejemplo
   * Esto es los que nos pasaria el modulo de reviews, tambien seguramente de peliculas y usuarios
   */
  const [posts, setPosts] = useState([
    {
      id: "65f5e1d77c65c827d8536abc", // ID de MongoDB válido (generado como ejemplo)
      type: "review",
      author: {
        name: "Paul Rudd",
        username: "antman_wasp",
        avatar: "https://i.pravatar.cc/60?img=15",
      },
      createdAt: "4h ago",
      pelicula_name: "The Conjuring: Last Rites",
      text: "The Conjuring: Last Rites me sorprendió bastante. Tiene un montón de sustos bien logrados y la atmósfera es súper tensa. Me gustó mucho cómo cerraron la historia de los Warren, se siente más personal y emotiva que otras entregas. Eso sí, en algunas partes el ritmo decae un poco y la trama se vuelve predecible, pero en general salí conforme. Creo que es un buen final para la saga.",
      puntuacion: 4.5,
      image:
        "https://a.ltrbxd.com/resized/film-poster/9/3/6/0/6/5/936065-the-conjuring-last-rites-0-1000-0-1500-crop.jpg?v=597eedcd06",
    },
    {
      id: "65f5e1d77c65c827d8536abd", // ID de MongoDB válido (generado como ejemplo)
      type: "review",
      author: {
        name: "Jane Foster",
        username: "jane_foster",
        avatar: "https://i.pravatar.cc/60?img=10",
      },
      createdAt: "1 day ago",
      pelicula_name: "Superman",
      text: "Superman (2025) me dejó con sentimientos encontrados. Por un lado, las escenas de acción son impresionantes y la cinematografía es de primera, realmente capturan la grandeza del personaje. Sin embargo, siento que la historia no estuvo a la altura de las expectativas; algunos giros fueron bastante predecibles y los personajes secundarios no tuvieron mucho desarrollo. Aun así, disfruté viendo a Superman en pantalla",
      puntuacion: 3,
      image:
        "https://a.ltrbxd.com/resized/film-poster/9/5/7/0/5/0/957050-superman-2025-0-1000-0-1500-crop.jpg?v=54e41a55ff",
    },
    {
      id: "65f5e1d77c65c827d8536abe", // ID de MongoDB válido (generado como ejemplo)
      type: "review",
      author: {
        name: "Jane Foster",
        username: "jane_foster",
        avatar: "https://i.pravatar.cc/60?img=10",
      },
      createdAt: "1 day ago",
      pelicula_name: "F1",
      text: "F1 (2024) es una película que realmente captura la emoción y la adrenalina del automovilismo. Las escenas de carrera son espectaculares, con tomas que te hacen sentir como si estuvieras en el asiento del conductor. Además, la historia detrás de los pilotos añade una capa emocional que me mantuvo enganchado. Sin embargo, creo que algunos personajes podrían haberse desarrollado más para darle mayor profundidad a la trama. En general, es una película emocionante que cualquier fanático de la Fórmula 1 debería ver.",
      puntuacion: 5,
      image:
        "https://a.ltrbxd.com/resized/film-poster/8/1/7/9/7/7/817977-f1-the-movie-0-1000-0-1500-crop.jpg?v=f5ae2b99b9",
    },
  ]);

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const results = await Promise.all(
          posts.map(async (p) => {
            try {
              const res = await fetch(
                `${API_URL}/api/like/publication/${p.id}`
              );
  
              if (!res.ok) throw new Error(`GET likes failed: ${res.status}`);
  
              const data = await res.json();

              const backendLikes = Array.isArray(data.likes) ? data.likes : [];
              const backendTotal = typeof data.total_likes === 'number' ? data.total_likes : backendLikes.length;
              const myBackendLike = backendLikes.find((l) => String(l.user?.id) === String(userId));

              return [
                p.id,
                {
                  total_likes: backendTotal,
                  liked: !!myBackendLike,
                  like_id: myBackendLike?.id || null,
                },
              ];
            } catch (err) {
              console.warn(`Error al obtener likes para post ${p.id}:`, err);
              return [p.id, { total_likes: 0, liked: false, like_id: null }];
            }
          })
        );
  
        setLikesByPost(Object.fromEntries(results));
      } catch (err) {
        console.error("Error al obtener likes:", err);
      }
    };

    fetchLikes();
  }, [posts, userId]);

  // Eliminado: no se inyectan datos locales de demo

  // Cargar comentarios desde backend o usar locales
  useEffect(() => {
    const loadComments = async () => {
      try {
        console.log("🔄 Cargando comentarios para los posts...");
        const results = await Promise.all(
          posts.map(async (p) => {
            try {
              console.log(`📥 Intentando obtener comentarios para post ${p.id} del backend...`);
              const res = await fetch(`${API_URL}/api/comment/publication/${p.id}`);
              
              // Loggear respuesta completa
              const responseText = await res.text();
              console.log(`📄 Respuesta para post ${p.id}:`, { 
                status: res.status, 
                ok: res.ok,
                responseText 
              });
              
              if (!res.ok) {
                console.warn(`⚠️ No se encontraron comentarios para el post ${p.id}.`);
                return [p.id, []];
              }
              
              // Parsear la respuesta de texto a JSON
              let data;
              try {
                data = JSON.parse(responseText);
              } catch (parseErr) {
                console.error(`❌ Error al parsear la respuesta para post ${p.id}:`, parseErr);
                return [p.id, []];
              }
              
              const backendComments = Array.isArray(data.comments) ? data.comments : [];
              const ordered = backendComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              console.log(`✅ Post ${p.id} -> Comentarios desde backend:`, ordered);
              return [p.id, ordered];
            } catch (err) {
              console.warn(`⚠️ Error al obtener comentarios para post ${p.id}:`, err);
              return [p.id, []];
            }
          })
        );

        // Convertimos el array en objeto { postId: comments }
        const newCommentsByPost = results.reduce((acc, [id, comments]) => {
          acc[id] = comments;
          return acc;
        }, {});

        console.log("📊 Nuevo estado de comentarios por post:", newCommentsByPost);
        setCommentsByPost(newCommentsByPost);
      } catch (err) {
        console.error("❌ Error al cargar comentarios:", err);
      }
    };

    loadComments();
  }, [posts]);

  const handleLike = async (post) => {
    try {
      const state = likesByPost[post.id] || { liked: false, like_id: null };

      // Intento primero con el backend
      try {
        if (!state.liked) {
          // 👉 Dar like
          console.log("Enviando like:", {
            user_id: userId,
            target_id: post.id,
            target_type: post.type
          });
          
          const res = await fetch(`${API_URL}/api/like`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              target_id: post.id,
              target_type: post.type,
            }),
          });
          
          // Procesar respuesta
          const data = await res.json();
          console.log("Respuesta al dar like:", {
            status: res.status,
            ok: res.ok,
            data: data
          });

          if (res.ok) {
            // Éxito con el backend
            refreshLikes(post.id);
            return;
          }
        } else {
          // 👉 Quitar like
          console.log("Eliminando like:", {
            like_id: state.like_id,
            user_id: userId
          });
          
          const res = await fetch(
            `${API_URL}/api/like/${state.like_id}`,
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: userId }),
            }
          );

          if (res.ok) {
            // Éxito con el backend
            refreshLikes(post.id);
            return;
          }
        }
      } catch (backendErr) {
        console.warn("Error con el backend al procesar like:", backendErr.message);
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
      console.log(`Obteniendo likes para post ${postId}`);
      
      try {
        const res = await fetch(
          `${API_URL}/api/like/publication/${postId}`
        );
        
        if (!res.ok) return;
        
        const data = await res.json();

        console.log("Post", postId, "-> Likes:", data);

        const backendLikes = Array.isArray(data.likes) ? data.likes : [];
        const total = typeof data.total_likes === 'number' ? data.total_likes : backendLikes.length;
        const myLike = backendLikes.find((l) => String(l.user?.id) === String(userId));

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
    try {
      // Si no es local, intentar con el backend
      try {
        const res = await fetch(
          `${API_URL}/api/comment/${commentId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id: userId }), // 👈 necesario para permisos
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Error al eliminar comentario");
        }

        console.log(`Comentario ${commentId} eliminado`);

        // 👇 refrescar comentarios del post
        const resComments = await fetch(
          `${API_URL}/api/comment/publication/${postId}`
        );
        const dataComments = await resComments.json();

        setCommentsByPost((prev) => ({
          ...prev,
          [postId]: Array.isArray(dataComments.comments) ? dataComments.comments : [],
        }));
      } catch (err) {
        console.warn("Error al eliminar comentario con el backend:", err.message);
        alert(`No se pudo eliminar el comentario: ${err.message}`);
      }
    } catch (err) {
      console.error("Error al eliminar comentario:", err.message);
      alert(`Error al eliminar comentario: ${err.message}`);
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
    if (post.type === "review") {
      return (
        <div key={post.id} className="post">
          <div className="post-type">
            <p>Escribio una reseña</p>
          </div>
          {/* Header */}
          <div className="post-header">
            <img
              src={post.author.avatar}
              alt="avatar"
              className="avatar-post"
            />
            <div>
              <div className="post-user-info">
                <h4 className="name">{post.author.name}</h4>
                <span className="username-id">
                  @{post.author.username}
                </span>{" "}
              </div>
              <span className="time">{post.createdAt}</span>
            </div>
          </div>

          {/* Texto */}
          <div className="titulo-pelicula">
            <h3>{post.pelicula_name}</h3>
            <StarRating puntuacion={post.puntuacion} />{" "}
          </div>
          <div className="post-body">
            <div className="post-text-container">
              <p className="post-text">{post.text}</p>
            </div>
            <div className="post-image-container">
              {/* Imagen (si existe) */}
              {post.image && (
                <img src={post.image} alt="post" className="post-image" />
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
                    fill={likesByPost[post.id]?.liked ? "red" : "currentColor"}
                    class="bi bi-heart-fill"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"
                    />
                  </svg>
                </button>
                <span>{likesByPost[post.id]?.total_likes ?? 0}</span>
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
                <span>{(commentsByPost[post.id] || []).length}</span>
              </div>
            </div>

            <div className="comment-post">
              <img
                src={user?.avatar_url || "https://i.pravatar.cc/60?img=1"}
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
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={1}
                  onInput={(e) => {
                    e.target.style.height = "auto"; // resetea
                    e.target.style.height = `${e.target.scrollHeight}px`; // ajusta
                  }}
                />
              </form>
              <button
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
          {(commentsByPost[post.id] || []).length > 0 ? (
            <>
              <hr />
              {/* Depuración: Mostrar datos de los comentarios */}
              <div style={{ display: 'none' }}>
                {console.log(`📄 Renderizando ${(commentsByPost[post.id] || []).length} comentarios para post ${post.id}:`, commentsByPost[post.id])}
              </div>
              {(commentsByPost[post.id] || [])
                .slice() // copia para no mutar el original
                .slice(0, showAllComments[post.id] ? undefined : 2) // muestra 2 más recientes
                .map((c) => (
                  <div key={c.id} className="comment">
                    <img
                      src={c.user?.avatar_url || "https://i.pravatar.cc/60?img=1"}
                      alt="user"
                      className="avatar-comment"
                    />
                    <div className="comment-body">
                      <div>
                        <strong>
                          {c.user?.username || "Usuario"}{" "}
                          <span className="comment-time">
                            {c.created_at ? dayjs(c.created_at).fromNow() : "hace un momento"}
                          </span>
                        </strong>
                        <p className="comment-text">{c.comment}</p>
                      </div>
                      {c.user?.id === userId && (
                        <button
                          className="delete-comment-btn"
                          aria-label="Delete comment"
                          onClick={() => handleDeleteComment(c.id, post.id)}
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
                {(commentsByPost[post.id] || []).length > 2 && (
                  <button
                    className="view-all-btn"
                    onClick={() =>
                      setShowAllComments((prev) => {
                        console.log(`🔄 Cambiando estado 'showAllComments' para post ${post.id}: ${!prev[post.id]}`);
                        return {
                          ...prev,
                          [post.id]: !prev[post.id], // toggle por post
                        };
                      })
                    }
                  >
                    {showAllComments[post.id]
                      ? "Ver menos comentarios"
                      : "Ver todos los comentarios"}
                  </button>
                )}
              </div>
            </>
          ) : (
            // No hay comentarios
            <div className="no-comments" style={{ display: 'none' }}>
              {console.log(`❌ No hay comentarios para mostrar en post ${post.id}`)}
            </div>
          )}
        </div>
      );
    } else if (post.type === "like") {
      return (
        <div key={post.id} className="post post-like">
          <img
            className="avatar-post"
            src={post.author.avatar}
            alt="avatar usuario"
          />
          <p className="usuario">{post.author.name} </p>
          <p className="text-like">le dio like a la reseña de </p>
          <p className="usuario">{post.usuario_like.name}</p>
        </div>
      );
    }
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {posts.map((post) => renderPostByType(post))}
    </div>
  );
}

export default Post;

