import "./Post.css";

function Post() {
  const posts = [
    {
      id: 1,
      author: {
        name: "Paul Rudd",
        username: "antman_wasp",
        avatar: "https://i.pravatar.cc/60?img=15",
      },
      createdAt: "4h ago",
      text: "Exploring the amazing nature with my loved daughter and wife...",
      image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      likes: 1558,
      commentsCount: 351,
      comments: [{ id: 1, user: "username", text: "Nice view" }],
    },
    {
      id: 2,
      author: {
        name: "Jane Foster",
        username: "astro_jane",
        avatar: "https://i.pravatar.cc/60?img=10",
      },
      createdAt: "8h ago",
      text: "Reading ‘Astrophysics for People in a Hurry’. Highly recommend!",
      image: null, // <- sin imagen
      likes: 457,
      commentsCount: 0,
      comments: [],
    },
    {
      id: 3,
      author: {
        name: "Anna Parker",
        username: "web_shooter",
        avatar: "https://i.pravatar.cc/60?img=32",
      },
      createdAt: "1h ago",
      text: "Quick swing across the city. Perfect sunset today! 🕷️",
      image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
      likes: 982,
      commentsCount: 102,
      comments: [{ id: 2, user: "mj", text: "Save me a photo!" }],
    },
  ];

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {posts.map((post) => (
        <div key={post.id} className="post">
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
          <p className="post-text">{post.text}</p>

          {/* Imagen (solo si existe) */}
          {post.image && (
            <img src={post.image} alt="post" className="post-image" />
          )}

          {/* Reacciones */}
          <div className="post-actions">
            <div className="actions">
              <div className="action">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-heart-fill"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"
                  />
                </svg>
                <span>{post.likes}</span>
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
                <span>{post.commentsCount}</span>
              </div>
            </div>

            <div className="comment-post">
              <img
                src="https://www.w3.org/thumbnails/200/avatar-images/7mtpjeh4in8kw04ksso8ss4ocsksswo.webp"
                alt=""
                className="user-logo-post"
              />
              <form className="comment-post-wrap">
                <input
                  className="comment-post-input"
                  placeholder="Escribe un comentario..."
                  aria-label="Buscar"
                />
              </form>
              <button className="comment-post-btn" aria-label="Comment">
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
          {post.comments.length > 0 && (
            <>
              <hr />
              {post.comments.map((c) => (
                <div key={c.id} className="comment">
                  <img
                    src="https://www.w3.org/thumbnails/200/avatar-images/7mtpjeh4in8kw04ksso8ss4ocsksswo.webp"
                    alt="user"
                    className="avatar-comment"
                  />
                  <div className="comment-body">
                    <div>
                      <strong>Juan Gonzales</strong>
                      <p>{c.text}</p>
                    </div>
                    <button
                      className="delete-comment-btn"
                      aria-label="Delete comment"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        class="bi bi-trash3"
                        viewBox="0 0 16 16"
                      >
                        <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
                      </svg>
                    </button>
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
                      class="bi bi-heart-fill"
                      viewBox="0 0 16 16"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"
                      />
                    </svg>
                    <span>23</span>
                  </button>
                </div>
              ))}
              <div className="view-all">
                <a href="#" className="view-all-btn">
                  Ver todos los comentarios
                </a>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default Post;
