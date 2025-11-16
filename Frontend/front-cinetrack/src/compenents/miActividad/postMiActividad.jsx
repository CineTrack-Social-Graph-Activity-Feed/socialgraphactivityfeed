import { useState, useEffect } from "react";
import "./postMiActividad.css";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";
import { useAuth } from "../../config/AuthContext";

dayjs.extend(relativeTime);
dayjs.locale("es");

function PostMiActividad() {
  const { user, fetchWithAuth } = useAuth();
  const coreUserId = user?.user?.user_id; // ID numérico del Core
  const [perfil, setPerfil] = useState(null); // Perfil backend (incluye _id Mongo)
  const [posts, setPosts] = useState([]);
  const [postsConPeli, setPostsConPeli] = useState([]);
  const [likesByPost, setLikesByPost] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentByPost, setCommentByPost] = useState({});
  const [showAllComments, setShowAllComments] = useState({});
  const [expandedPoster, setExpandedPoster] = useState(null);

  // Cargar perfil
  useEffect(() => {
    if (!coreUserId) return;
    (async () => {
      try {
        const res = await fetchWithAuth(`http://localhost:3000/api/user/${coreUserId}`);
        if (!res.ok) throw new Error(`Perfil ${res.status}`);
        const data = await res.json();
        setPerfil(data.user || data);
      } catch (e) {
        console.warn("No se pudo cargar perfil MiActividad:", e.message);
      }
    })();
  }, [coreUserId, fetchWithAuth]);

  // Cargar publicaciones propias y películas activas
  useEffect(() => {
    if (!coreUserId) return;
    (async () => {
      try {
        const res = await fetchWithAuth(`http://localhost:3000/api/publication/user/${coreUserId}`);
        if (res.status === 404) {
          setPosts([]);
          setPostsConPeli([]);
          return;
        }
        if (!res.ok) throw new Error(`Publications ${res.status}`);
        const data = await res.json();
        const feed = data.publications || [];
        setPosts(feed);

        const idsUnicos = [
          ...new Set(feed.map(p => p.movie_id).filter(id => id !== null && id !== undefined))
        ];

        const peliculas = await Promise.all(idsUnicos.map(async (id) => {
          try {
            const r = await fetchWithAuth(`http://localhost:3000/api/movie/${id}`);
            if (!r.ok) throw new Error(`Movie ${id}: ${r.status}`);
            const movieData = await r.json();
            return { id, movie: movieData };
          } catch (e) {
            return { id, movie: null }; // película inactiva o error
          }
        }));

        const movieMap = new Map(peliculas.map(({ id, movie }) => [id, movie]));
        const enriquecidos = feed.map(post => ({ ...post, movie: movieMap.get(post.movie_id) ?? null }));
        const filtrados = enriquecidos.filter(p => {
          const mid = p.movie_id;
          if (mid === null || mid === undefined) return true; // publicaciones sin película
          return !!p.movie; // sólo mostrar si la película está activa y se pudo traer
        });
        setPostsConPeli(filtrados);
      } catch (e) {
        console.error("❌ Error cargando publicaciones propias:", e);
      }
    })();
  }, [coreUserId, fetchWithAuth]);

  // Likes
  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const results = await Promise.all(
          posts.map(async (p) => {
            try {
              const res = await fetchWithAuth(`http://localhost:3000/api/like/publication/${p.id}`);
              if (!res.ok) throw new Error(`GET likes ${res.status}`);
              const data = await res.json();
              const backendLikes = Array.isArray(data.likes) ? data.likes : [];
              const backendTotal = typeof data.total_likes === 'number' ? data.total_likes : backendLikes.length;
              const myBackendLike = backendLikes.find(l => String(l.user?.id) === String(perfil?.id || perfil?._id));
              return [p.id, { total_likes: backendTotal, liked: !!myBackendLike, like_id: myBackendLike?.id || null }];
            } catch {
              return [p.id, { total_likes: 0, liked: false, like_id: null }];
            }
          })
        );
        setLikesByPost(Object.fromEntries(results));
      } catch (err) {
        console.error("Error likes MiActividad:", err);
      }
    };
    if (posts.length) fetchLikes();
  }, [posts, perfil?.id]);

  // Comentarios
  useEffect(() => {
    const loadComments = async () => {
      try {
        const results = await Promise.all(
          posts.map(p => fetchWithAuth(`http://localhost:3000/api/comment/publication/${String(p.id)}`)
            .then(res => res.json())
            .then(data => [p.id, data.comments || []]))
        );
        setCommentsByPost(results.reduce((acc, [id, comments]) => { acc[id] = comments; return acc; }, {}));
      } catch (e) {
        console.error("Error comentarios MiActividad:", e);
      }
    };
    if (posts.length) loadComments();
  }, [posts, fetchWithAuth]);

  const handleSubmit = async (e, post) => {
    e.preventDefault();
    const publicationId = post?.id;
    const text = (commentByPost[publicationId] || '').trim();
    if (!text) return;

    // 🚀 OPTIMISTIC UPDATE: agregar comentario inmediatamente
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      _id: `temp-${Date.now()}`,
      comment: text,
      user: {
        id: perfil?.id || perfil?._id,
        username: perfil?.username,
        avatar_url: perfil?.avatar_url,
      },
      created_at: new Date().toISOString(),
      isPending: true,
    };

    setCommentsByPost(prev => ({
      ...prev,
      [publicationId]: [...(prev[publicationId] || []), optimisticComment]
    }));
    setCommentByPost(prev => ({ ...prev, [publicationId]: '' }));

    try {
      const res = await fetchWithAuth(`http://localhost:3000/api/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: perfil?.id || perfil?._id, target_type: post.type, target_id: publicationId, comment: text })
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      
      // Recargar con IDs reales
      const resComments = await fetchWithAuth(`http://localhost:3000/api/comment/publication/${String(publicationId)}`);
      const dataComments = await resComments.json();
      setCommentsByPost(prev => ({ ...prev, [publicationId]: (dataComments.comments || []).filter((c,i,arr)=> i===arr.findIndex(x=> (x._id??x.id)===(c._id??c.id)) ) }));
    } catch (err) {
      console.error('❌ Error guardar comentario:', err);
      
      // Revertir optimistic update
      setCommentsByPost(prev => ({
        ...prev,
        [publicationId]: (prev[publicationId] || []).filter(c => c.id !== optimisticComment.id)
      }));
      setCommentByPost(prev => ({ ...prev, [publicationId]: text }));
      
      alert(`Error al guardar comentario: ${err.message}`);
    }
  };

  const handleLike = async (post) => {
    const state = likesByPost[post.id] || { liked: false, like_id: null };
    
    // 🚀 OPTIMISTIC UPDATE: actualizar UI inmediatamente
    setLikesByPost(prev => ({
      ...prev,
      [post.id]: {
        total_likes: (prev[post.id]?.total_likes || 0) + (!state.liked ? 1 : -1),
        liked: !state.liked,
        like_id: state.like_id,
      }
    }));

    try {
      if (!state.liked) {
        const res = await fetchWithAuth(`http://localhost:3000/api/like`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: perfil?.id || perfil?._id, target_id: post.id, target_type: post.type })
        });
        if (!res.ok) {
          // Revertir si falla
          setLikesByPost(prev => ({ ...prev, [post.id]: state }));
          return;
        }
        const data = await res.json();
        // Actualizar con like_id real
        setLikesByPost(prev => ({
          ...prev,
          [post.id]: { ...prev[post.id], like_id: data.like?.id || data.id }
        }));
      } else {
        const res = await fetchWithAuth(`http://localhost:3000/api/like/${state.like_id}`, {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: perfil?.id || perfil?._id })
        });
        if (!res.ok) {
          // Revertir si falla
          setLikesByPost(prev => ({ ...prev, [post.id]: state }));
          return;
        }
        // Limpiar like_id
        setLikesByPost(prev => ({
          ...prev,
          [post.id]: { ...prev[post.id], like_id: null }
        }));
      }
    } catch (err) {
      // Revertir en caso de error
      setLikesByPost(prev => ({ ...prev, [post.id]: state }));
      alert(`Error like: ${err.message}`);
    }
  };

  const refreshLikes = async (postId) => {
    try {
      const res = await fetchWithAuth(`http://localhost:3000/api/like/publication/${postId}`);
      if (!res.ok) return;
      const data = await res.json();
      const backendLikes = Array.isArray(data.likes) ? data.likes : [];
      const total = typeof data.total_likes === 'number' ? data.total_likes : backendLikes.length;
      const myLike = backendLikes.find(l => String(l.user?.id) === String(perfil?.id || perfil?._id));
      setLikesByPost(prev => ({ ...prev, [postId]: { total_likes: total, liked: !!myLike, like_id: myLike?.id ?? null } }));
    } catch {}
  };

  const handleDeleteComment = async (commentId, postId) => {
    try {
      const res = await fetchWithAuth(`http://localhost:3000/api/comment/${commentId}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: perfil?.id || perfil?._id })
      });
      if (!res.ok) throw new Error('Error al eliminar comentario');
      const rc = await fetchWithAuth(`http://localhost:3000/api/comment/publication/${postId}`);
      const data = await rc.json();
      setCommentsByPost(prev => ({ ...prev, [postId]: Array.isArray(data.comments) ? data.comments : [] }));
    } catch (e) {
      alert(`No se pudo eliminar el comentario: ${e.message}`);
    }
  };

  function StarRating({ puntuacion }) {
    const totalEstrellas = 5;
    return (
      <div className="stars">
        {[...Array(totalEstrellas)].map((_, i) => {
          const starIndex = i + 1;
          if (puntuacion >= starIndex) return (
            <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="gold" className="bi bi-star-fill estrella" viewBox="0 0 16 16">
              <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
            </svg>
          );
          if (puntuacion >= starIndex - 0.5) return (
            <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="gold" className="bi bi-star-half estrella" viewBox="0 0 16 16">
              <path d="M5.354 5.119 7.538.792A.52.52 0 0 1 8 .5c.183 0 .366.097.465.292l2.184 4.327 4.898.696A.54.54 0 0 1 16 6.32a.55.55 0 0 1-.17.445l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
            </svg>
          );
          return (
            <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-star estrella" viewBox="0 0 16 16">
              <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73z" />
            </svg>
          );
        })}
      </div>
    );
  }

  function renderPostByType(post) {
    const movieData = post?.movie?.movie || null;
    const hasPoster = !!movieData?.poster;
    return (
      <div>
        <div key={post.id} className="post">
          <div className="post-type"><p>Escribio una reseña</p></div>
          <div className="post-header">
            <img
              src={user.user.avatar_url || "https://st3.depositphotos.com/4111759/13425/v/450/depositphotos_134255670-stock-illustration-avatar-people-male-profile-gray.jpg"}
              alt="avatar" className="avatar-post"
              onError={(e) => { e.target.src = "https://st3.depositphotos.com/4111759/13425/v/450/depositphotos_134255670-stock-illustration-avatar-people-male-profile-gray.jpg"; }}
            />
            <div>
              <div className="post-user-info"><h4 className="name">{post.author.username}</h4></div>
              <span className="time">{dayjs(post.created_at).fromNow()}</span>
            </div>
          </div>
          <div className="titulo-pelicula">
            <h3>{post.movie?.movie?.titulo ?? 'Sin título'}</h3>
            <StarRating puntuacion={post.rating} />{" "}
          </div>
          <div className="post-body">
            <div className="post-text-container"><p className="post-text">{post.content}</p></div>
            <div className="post-image-container">
              {hasPoster && (
                <img
                  src={post.movie?.movie?.poster ?? ''}
                  alt="post"
                  className="post-image"
                  onClick={() => setExpandedPoster(post.id)}
                />
              )}
            </div>
          </div>
          <div className="post-actions">
            <div className="actions">
              <div className="action">
                <button className="like-post-btn" aria-label="Like post" onClick={() => handleLike(post)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill={likesByPost[post.id]?.liked ? "red" : "currentColor"} className="bi bi-heart-fill" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314" />
                  </svg>
                </button>
                <span>{likesByPost[post.id]?.total_likes ?? 0}</span>
              </div>
              <div className="action">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chat-dots-fill" viewBox="0 0 16 16">
                  <path d="M16 8c0 3.866-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.584.296-1.925.864-4.181 1.234-.2.032-.352-.176-.273-.362.354-.836.674-1.95.77-2.966C.744 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7M5 8a1 1 0 1 0-2 0 1 1 0 0 0 2 0m4 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
                </svg>
                <span>{(commentsByPost[post.id] || []).length}</span>
              </div>
            </div>
            <div className="comment-post">
              <img
                src={user.user.avatar_url || "https://st3.depositphotos.com/4111759/13425/v/450/depositphotos_134255670-stock-illustration-avatar-people-male-profile-gray.jpg"}
                alt="avatar" className="user-logo-post"
              />
              <form className="comment-post-wrap" onSubmit={(e) => handleSubmit(e, post)}>
                <textarea
                  className="comment-post-input" placeholder="Escribe un comentario..." aria-label="Comentario"
                  value={commentByPost[post.id] || ''}
                  onChange={(e) => setCommentByPost(prev => ({ ...prev, [post.id]: e.target.value }))}
                  rows={1}
                  onInput={(e) => { e.target.style.height='auto'; e.target.style.height=`${e.target.scrollHeight}px`; }}
                />
              </form>
              <button type="button" className="comment-post-btn" aria-label="Comment" onClick={(e) => handleSubmit(e, post)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right-circle" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z" />
                </svg>
              </button>
            </div>
          </div>
          {(commentsByPost[post.id] || []).length > 0 ? (
            <>
              <hr />
              {(commentsByPost[post.id] || []).slice(0, showAllComments[post.id] ? undefined : 2).map(c => (
                <div key={c.id} className="comment">
                  <img
                    src={c.user?.avatar_url || "https://st3.depositphotos.com/4111759/13425/v/450/depositphotos_134255670-stock-illustration-avatar-people-male-profile-gray.jpg"}
                    alt="user" className="avatar-comment"
                    onError={(e)=>{e.target.src="https://st3.depositphotos.com/4111759/13425/v/450/depositphotos_134255670-stock-illustration-avatar-people-male-profile-gray.jpg";}}
                  />
                  <div className="comment-body">
                    <div>
                      <strong>{c.user?.username || 'Usuario'} <span className="comment-time">{c.created_at ? dayjs(c.created_at).fromNow() : 'hace un momento'}</span></strong>
                      <p className="comment-text">{c.comment}</p>
                    </div>
                    {String(c.user.id) === String(perfil?.id || perfil?._id) && (
                      <button className="delete-comment-btn" aria-label="Delete comment" onClick={() => handleDeleteComment(c.id, post.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash3" viewBox="0 0 16 16">
                          <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="view-all">
                {(commentsByPost[post.id] || []).length > 2 && (
                  <button className="view-all-btn" onClick={() => setShowAllComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}>
                    {showAllComments[post.id] ? 'Ver menos comentarios' : 'Ver todos los comentarios'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="no-comments"><hr /><div><p>No hay comentarios para mostrar</p></div></div>
          )}
        </div>
        {expandedPoster === post.id && hasPoster && (
          <div
            className="poster-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`Vista ampliada del poster de ${post.movie?.movie?.titulo ?? ''}`}
            onClick={() => setExpandedPoster(null)}
          >
            <img
              src={post.movie?.movie?.poster ?? ''}
              alt={`Poster de ${post.movie?.movie?.titulo ?? ''}`}
              className="poster-lightbox-image"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {postsConPeli.length === 0 ? (
        <p style={{ color: '#ccc', textAlign: 'center', marginTop: '20px' }}>
          Por el momento no has realizado ninguna reseña, anímate a escribir una!
        </p>
      ) : (
        postsConPeli.map(post => renderPostByType(post))
      )}
    </div>
  );
}

export default PostMiActividad;
