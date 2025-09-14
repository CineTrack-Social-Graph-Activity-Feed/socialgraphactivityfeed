import { useState, useEffect, use } from "react";
import "./Post.css";
import { useUser } from "../../../../UserContex";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";

dayjs.extend(relativeTime);
dayjs.locale("es");

function Post({ post }) {
  const { userId } = useUser();
  const [user, setUser] = useState({});
  const [comment, setComment] = useState("");
  const [commentsByPost, setCommentsByPost] = useState({});
  const [showAllComments, setShowAllComments] = useState({});
  const [likesByPost, setLikesByPost] = useState({});

  /* Obtengo los datos del usuario logueado */
  useEffect(() => {
    fetch(`http://localhost:3000/api/user/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
      })
      .catch((err) => console.error("Error al traer usuario:", err));
  }, []);

  /* Guarda el comentario de una publicacion a la BD */
  const handleSubmit = async (e, post) => {
    e.preventDefault();

    if (!comment.trim()) return;

    try {
      const res = await fetch("http://localhost:3000/api/comment", {
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

      //después del POST, vuelvo a pedir todos los comentarios del post asi cuando agrego uno nuevo se actualiza la lista
      const resComments = await fetch(
        `http://localhost:3000/api/comment/publication/${post.id}`
      );
      const dataComments = await resComments.json();

      setCommentsByPost((prev) => {
        const unique = (dataComments.comments || []).filter(
          (c, index, self) => index === self.findIndex((x) => x.id === c.id)
        );
        return {
          ...prev,
          [post.id]: unique,
        };
      });
      setComment("");
    } catch (err) {
      console.error("Error al guardar comentario:", err);
    }
  };

  /**
   * Posts de ejemplo
   * Esto es los que nos pasaria el modulo de reviews, tambien seguramente de peliculas y usuarios
   */
  const [posts, setPosts] = useState([
    {
      id: 1,
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
      id: 2,
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
      id: 3,
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
      const results = await Promise.all(
        posts.map(async (p) => {
          const res = await fetch(
            `http://localhost:3000/api/like/publication/${p.id}`
          );

          const data = await res.json();

          return [
            p.id,
            {
              total_likes: data.total_likes,
              liked: data.likes.some((l) => l.user.id === userId), // check si yo estoy en la lista
              like_id: data.likes.find((l) => l.user.id === userId)?.id || null,
            },
          ];
        })
      );

      setLikesByPost(Object.fromEntries(results));
    };

    fetchLikes();
  }, [posts, userId]);

  useEffect(() => {
    const loadComments = async () => {
      try {
        const results = await Promise.all(
          posts.map((p) =>
            fetch(`http://localhost:3000/api/comment/publication/${p.id}`)
              .then((res) => res.json())
              .then((data) => {
                console.log("Post", p.id, "-> Comentarios:", data.comments);
                return [p.id, data.comments || []];
              })
          )
        );

        // Convertimos el array en objeto { postId: comments }
        const newCommentsByPost = results.reduce((acc, [id, comments]) => {
          acc[id] = comments;
          return acc;
        }, {});

        setCommentsByPost(newCommentsByPost);
      } catch (err) {
        console.error("Error al cargar comentarios:", err);
      }
    };

    loadComments();
  }, []); // solo al montar

  const handleLike = async (post) => {
    try {
      const state = likesByPost[post.id] || { liked: false, like_id: null };

      if (!state.liked) {
        // 👉 Dar like
        const res = await fetch("http://localhost:3000/api/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            target_id: post.id,
            target_type: post.type, // o lo que corresponda
          }),
        });
        const data = await res.json();

        if (res.ok) {
          // recargo likes de ese post
          refreshLikes(post.id);
        }
      } else {
        // 👉 Quitar like
        const res = await fetch(
          `http://localhost:3000/api/like/${state.like_id}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId }),
          }
        );

        if (res.ok) {
          // recargo likes de ese post
          refreshLikes(post.id);
        }
      }
    } catch (err) {
      console.error("Error en handleLike:", err);
    }
  };

  // 🔹 traer likes y estado actualizado desde el back
  const refreshLikes = async (postId) => {
    const res = await fetch(
      `http://localhost:3000/api/like/publication/${postId}`
    );
    const data = await res.json();

    console.log("Post", postId, "-> Likes:", data);

    // OJO: en tu back la key es total_likes, no totalLikes
    const total = data.total_likes ?? 0;

    // Buscar si el usuario actual está en el array
    const myLike = (data.likes || []).find(
      (l) => String(l.user.id) === String(userId)
    );

    setLikesByPost((prev) => ({
      ...prev,
      [postId]: {
        total_likes: total,
        liked: !!myLike,
        like_id: myLike?.id ?? null,
      },
    }));
  };

  const handleDeleteComment = async (commentId, postId) => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/comment/${commentId}`,
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
        `http://localhost:3000/api/comment/publication/${postId}`
      );
      const dataComments = await resComments.json();

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: dataComments.comments || [],
      }));
    } catch (err) {
      console.error("Error al eliminar comentario:", err.message);
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
                src={user.avatar_url}
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
          {(commentsByPost[post.id] || []).length > 0 && (
            <>
              <hr />
              {(commentsByPost[post.id] || [])
                .slice() // copia para no mutar el original

                .slice(0, showAllComments[post.id] ? undefined : 2) // muestra 2 más recientes
                .map((c) => (
                  <div key={c.id} className="comment">
                    <img
                      src={c.user.avatar_url}
                      alt="user"
                      className="avatar-comment"
                    />
                    <div className="comment-body">
                      <div>
                        <strong>
                          {c.user.username}{" "}
                          <span className="comment-time">
                            {dayjs(c.created_at).fromNow()}
                          </span>
                        </strong>
                        <p className="comment-text">{c.comment}</p>
                      </div>
                      {c.user.id === userId && (
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
                    <button
                      className="like-comment-btn"
                      aria-label="Like comment"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-heart-fill"
                        viewBox="0 0 16 16"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"
                        />
                      </svg>
                      <span>-</span>
                    </button>
                  </div>
                ))}

              <div className="view-all">
                {commentsByPost[post.id] &&
                  commentsByPost[post.id].length > 2 && (
                    <button
                      className="view-all-btn"
                      onClick={() =>
                        setShowAllComments((prev) => ({
                          ...prev,
                          [post.id]: !prev[post.id], // toggle por post
                        }))
                      }
                    >
                      {showAllComments[post.id]
                        ? "Ver menos comentarios"
                        : "Ver todos los comentarios"}
                    </button>
                  )}
              </div>
            </>
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
