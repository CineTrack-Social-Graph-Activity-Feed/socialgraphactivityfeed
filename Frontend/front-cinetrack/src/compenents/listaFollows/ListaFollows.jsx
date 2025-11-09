import "./ListaFollows.css";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../config/AuthContext";

function ListaFollows() {
  const { user, fetchWithAuth } = useAuth();
  const userId = user.user.user_id;
  const [perfil, setPerfil] = useState(null);
  const [seguidos, setSeguidos] = useState([]);
  const [confirmUnfollow, setConfirmUnfollow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  const skeletons = useMemo(
    () => Array.from({ length: 4 }, (_, idx) => idx),
    []
  );

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await fetchWithAuth(`/api/user/${userId}`);
        if (!res.ok) throw new Error("Error al traer usuario");
        const data = await res.json();
        setPerfil(data.user || data); // depende de tu shape
      } catch (err) {
        console.error("Error al traer usuario:", err);
        setError("No pudimos cargar tu perfil. Intenta nuevamente.");
      }
    })();
  }, [userId, fetchWithAuth]);
  const objectId = perfil?.id;

  useEffect(() => {
    if (!objectId) return;
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchWithAuth(`/api/followed?user_id=${objectId}`);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        if (!isMounted) return;
        const normalizados = Array.isArray(data.followed)
          ? data.followed.map((u) => ({ ...u, _id: String(u._id) }))
          : [];
        setSeguidos(normalizados);
      } catch (err) {
        console.error("Error al obtener seguidos:", err);
        if (!isMounted) return;
        setSeguidos([]);
        setError("No pudimos cargar a quién sigues ahora mismo.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    window.addEventListener("followersUpdated", fetchData);

    return () => {
      window.removeEventListener("followersUpdated", fetchData);
      isMounted = false;
    };
  }, [objectId, fetchWithAuth]);

  const unfollowUser = async (targetId) => {
    if (!perfil?.id) return;
    try {
      setPendingId(String(targetId));
      const res = await fetchWithAuth("/api/unfollow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          follower_user_id: perfil.id,
          followed_user_id: targetId,
        }),
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: "Error desconocido" }));
        throw new Error(errorData.message || res.status);
      }
      setSeguidos((prev) => prev.filter((u) => u._id !== String(targetId)));
      window.dispatchEvent(new Event("followersUpdated"));
    } catch (err) {
      console.error("Error en unfollowUser:", err);
      setError(`No pudimos actualizar tu lista: ${err.message}`);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className="followed-card glass-card">
      <header className="followed-header">
        <h2 className="section-title">Siguiendo</h2>
        <p className="section-subtitle">
          Revisa las cuentas que sigues y organiza tu feed.
        </p>
      </header>

      {error && !loading ? (
        <div className="followed-error solid-card">
          <p>{error}</p>
        </div>
      ) : null}

      <div className="followed-list">
        {loading
          ? skeletons.map((item) => (
              <div
                className="followed-row skeleton-block"
                key={`skeleton-follow-${item}`}
              />
            ))
          : seguidos.length === 0
          ? (
              <div className="followed-empty">
                <p>No sigues a nadie todavía. Descubre nuevos perfiles.</p>
              </div>
            )
          : seguidos.map((current) => (
              <article className="followed-row solid-card" key={current._id}>
                <div className="followed-user">
                  <img
                    src={
                      current.avatar_url ||
                      "https://ui-avatars.com/api/?background=1c2740&color=fff&name=" +
                        encodeURIComponent(current.username || "U")
                    }
                    alt={`Avatar de ${current.username}`}
                    className="followed-avatar"
                  />
                  <div className="followed-meta">
                    <h3>{current.username}</h3>
                    {current.bio ? <p>{current.bio}</p> : null}
                  </div>
                </div>
                <div className="followed-actions">
                  <button
                    className="followed-btn"
                    onClick={() => setConfirmUnfollow(current)}
                    disabled={pendingId === current._id}
                  >
                    {pendingId === current._id ? "Guardando..." : "Siguiendo"}
                  </button>
                </div>
              </article>
            ))}
      </div>

      {confirmUnfollow && (
        <div className="modal-overlay">
          <div className="modal-content solid-card">
            <h3>¿Dejar de seguir?</h3>
            <p>
              ¿Estás seguro de que quieres dejar de seguir a{' '}
              <strong>{confirmUnfollow.username}</strong>?
            </p>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setConfirmUnfollow(null)}
              >
                Cancelar
              </button>
              <button
                className="confirm-btn"
                onClick={() => {
                  unfollowUser(confirmUnfollow._id);
                  setConfirmUnfollow(null);
                }}
              >
                Dejar de seguir
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ListaFollows;
