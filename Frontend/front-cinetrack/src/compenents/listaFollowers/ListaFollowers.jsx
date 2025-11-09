import "./ListaFollowers.css";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../config/AuthContext";

const ListaFollowers = () => {
  const { user, fetchWithAuth } = useAuth();
  const userId = user.user.user_id;
  const [perfil, setPerfil] = useState(null);

  const [seguidores, setSeguidores] = useState([]);
  const [seguidos, setSeguidos] = useState([]);
  const [confirmUnfollow, setConfirmUnfollow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingId, setPendingId] = useState(null);

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
  const skeletons = useMemo(
    () => Array.from({ length: 4 }, (_, idx) => idx),
    []
  );
  // Traigo los usuarios que me siguen
  useEffect(() => {
    if (!objectId) return;
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetchWithAuth(`/api/followers?user_id=${objectId}`);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        if (!isMounted) return;
        setSeguidores(Array.isArray(data.followers) ? data.followers : []);
      } catch (err) {
        console.error("Error al obtener seguidores:", err);
        if (!isMounted) return;
        setSeguidores([]);
        setError("No pudimos cargar tus seguidores en este momento.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Primera carga
    fetchData();

    // Escuchar cambios globales
    window.addEventListener("followersUpdated", fetchData);

    return () => {
      window.removeEventListener("followersUpdated", fetchData);
      isMounted = false;
    };
  }, [objectId, fetchWithAuth]);

  // Traigo los usuarios que sigo
  useEffect(() => {
    if (!objectId) return;
    let isMounted = true;

    (async () => {
      try {
        const response = await fetchWithAuth(
          `/api/followed?user_id=${objectId}`
        );
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const data = await response.json();
        if (!isMounted) return;
        const ids = Array.isArray(data.followed)
          ? data.followed.map((u) => String(u._id))
          : [];
        setSeguidos(ids);
      } catch (err) {
        console.error("Error al obtener seguidos:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [objectId, fetchWithAuth]);

  // Función para seguir/dejar de seguir
  const toggleFollow = async (targetIdRaw) => {
    if (!perfil?.id) return;
    const targetId = String(targetIdRaw);
    const isFollowing = seguidos.includes(targetId);

    const url = isFollowing ? "/api/unfollow" : "/api/follow";

    try {
      setPendingId(targetId);
      const res = await fetchWithAuth(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          follower_user_id: perfil.id,
          followed_user_id: targetId,
        }),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(
          `Error ${isFollowing ? "unfollow" : "follow"}: ${res.status} ${err}`
        );
      }

      setSeguidos((prev) =>
        isFollowing ? prev.filter((id) => id !== targetId) : [...prev, targetId]
      );
      window.dispatchEvent(new Event("followersUpdated"));
    } catch (e) {
      console.error("Error en toggleFollow:", e);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section className="followers-card glass-card">
      <header className="followers-header">
        <h2 className="section-title">Tus seguidores</h2>
        <p className="section-subtitle">
          Gestiona fácilmente quién te sigue y a quién sigues de vuelta.
        </p>
      </header>

      {error && !loading ? (
        <div className="followers-error solid-card">
          <p>{error}</p>
        </div>
      ) : null}

      <div className="followers-list">
        {loading
          ? skeletons.map((item) => (
              <div
                className="follower-row skeleton-block"
                key={`skeleton-${item}`}
              />
            ))
          : seguidores.length === 0
          ? (
              <div className="followers-empty">
                <p>Aún no tienes seguidores. ¡Comparte tu perfil!</p>
              </div>
            )
          : seguidores.map((current) => {
              const following = seguidos.includes(String(current._id));
              return (
                <article className="follower-row solid-card" key={current._id}>
                  <div className="follower-user">
                    <img
                      src={
                        current.avatar_url ||
                        "https://ui-avatars.com/api/?background=1c2740&color=fff&name=" +
                          encodeURIComponent(current.username || "U")
                      }
                      alt={`Avatar de ${current.username}`}
                      className="follower-avatar"
                    />
                    <div className="follower-meta">
                      <h3>{current.username}</h3>
                      {current.bio ? <p>{current.bio}</p> : null}
                    </div>
                  </div>
                  <div className="follower-actions">
                    <button
                      type="button"
                      className={`follow-btn ${following ? "following" : ""}`}
                      onClick={() => {
                        if (following) {
                          setConfirmUnfollow(current);
                        } else {
                          toggleFollow(current._id);
                        }
                      }}
                      disabled={pendingId === String(current._id)}
                    >
                      {pendingId === String(current._id)
                        ? "Guardando..."
                        : following
                        ? "Siguiendo"
                        : "Seguir"}
                    </button>
                  </div>
                </article>
              );
            })}
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
                  toggleFollow(confirmUnfollow._id);
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
};

export default ListaFollowers;
