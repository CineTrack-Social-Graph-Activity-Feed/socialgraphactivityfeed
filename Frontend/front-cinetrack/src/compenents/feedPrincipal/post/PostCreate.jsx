<<<<<<< HEAD
function PostCreate() {
=======
import { useState } from "react";
import { useUser } from "../../../../UserContex";

function PostCreate() {
  const { userId } = useUser();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/publication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_id: userId,
          type: "review",
          target_id: "Demo target",
          content: text.trim(),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `No se pudo crear la publicación (${res.status})`);
      }
      // Notificar al feed para recargar
      window.dispatchEvent(new Event('publication:created'));
      setText("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

>>>>>>> c027e27338d9d05ca2456cbd5219ffc4b9312a89
  return (
    <div className="post-create-container">
      <div className="post">
        <div className="write-post-header">
          <div className="write-post config-header">
            <button
              className="write-post-btn config-header-btns"
              aria-label="Write Post"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
<<<<<<< HEAD
                class="bi bi-pencil-square"
=======
                className="bi bi-pencil-square"
>>>>>>> c027e27338d9d05ca2456cbd5219ffc4b9312a89
                viewBox="0 0 16 16"
              >
                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                <path
<<<<<<< HEAD
                  fill-rule="evenodd"
=======
                  fillRule="evenodd"
>>>>>>> c027e27338d9d05ca2456cbd5219ffc4b9312a89
                  d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"
                />
              </svg>
            </button>
            <span>Escribe un comentario</span>
          </div>
          <div className="upload-photo config-header">
            <button
              className="upload-photo-btn config-header-btns"
              aria-label="Upload Photo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
<<<<<<< HEAD
                class="bi bi-image"
=======
                className="bi bi-image"
>>>>>>> c027e27338d9d05ca2456cbd5219ffc4b9312a89
                viewBox="0 0 16 16"
              >
                <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
                <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1z" />
              </svg>
            </button>
            <span>Subir Foto</span>
          </div>
          <div className="upload-video config-header">
            <button
              className="upload-video-btn config-header-btns"
              aria-label="Upload Video"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
<<<<<<< HEAD
                class="bi bi-play-circle-fill"
=======
                className="bi bi-play-circle-fill"
>>>>>>> c027e27338d9d05ca2456cbd5219ffc4b9312a89
                viewBox="0 0 16 16"
              >
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M6.79 5.093A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814z" />
              </svg>
            </button>
            <span>Subir Video</span>
          </div>
        </div>
        <hr />
        <div className="create-post">
          <img
            src="https://www.w3.org/thumbnails/200/avatar-images/7mtpjeh4in8kw04ksso8ss4ocsksswo.webp"
            alt=""
            className="user-logo-create-post"
          />
<<<<<<< HEAD
          <form className="create-post-wrap">
=======
          <form className="create-post-wrap" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
>>>>>>> c027e27338d9d05ca2456cbd5219ffc4b9312a89
            <textarea
              className="create-post-textarea"
              placeholder="Escribe un comentario..."
              aria-label="Buscar"
              type="text"
<<<<<<< HEAD
            />
          </form>
          <button className="comment-post-btn" aria-label="Comment">
=======
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </form>
          <button className="comment-post-btn" aria-label="Comment" onClick={handleCreate} disabled={loading}>
>>>>>>> c027e27338d9d05ca2456cbd5219ffc4b9312a89
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
<<<<<<< HEAD
              class="bi bi-arrow-right-circle"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
=======
              className="bi bi-arrow-right-circle"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
>>>>>>> c027e27338d9d05ca2456cbd5219ffc4b9312a89
                d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8m15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5z"
              />
            </svg>
          </button>
<<<<<<< HEAD
=======
          {error && <span style={{ color: 'tomato', marginLeft: 8 }}>{error}</span>}
>>>>>>> c027e27338d9d05ca2456cbd5219ffc4b9312a89
        </div>
      </div>
    </div>
  );
}

export default PostCreate;
