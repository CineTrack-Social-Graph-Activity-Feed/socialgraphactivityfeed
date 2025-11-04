import "./ListaFollowers.css";
import { Eye, List, Heart, CheckCircle } from "lucide-react";
import { use, useEffect, useState } from "react";
import { API_URL } from "../../config/api";
import { useAuth } from "../../config/AuthContext";

const ListaFollowers = () => {
  const { user, fetchWithAuth, signOut } = useAuth(); // <- user de /me
  const userId = user.user.user_id; // normalizamos ID
  const [perfil, setPerfil] = useState(null);

  const [seguidores, setSeguidores] = useState([]);
  const [seguidos, setSeguidos] = useState([]);
  const [confirmUnfollow, setConfirmUnfollow] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const objectId = perfil?.id;
  // Traigo los usuarios que me siguen
  useEffect(() => {
    if (!objectId) return;
    const fetchData = () => {
      setLoading(true);
      fetchWithAuth(`http://localhost:3000/api/followers?user_id=${objectId}`)
        .then((res) => res.json())
        .then((data) => setSeguidores(data.followers));
      setLoading(false);
    };

    // Primera carga
    fetchData();

    // Escuchar cambios globales
    window.addEventListener("followersUpdated", fetchData);

    return () => {
      window.removeEventListener("followersUpdated", fetchData);
    };
  }, [objectId, fetchWithAuth]);

  // Traigo los usuarios que sigo
  useEffect(() => {
    if (!objectId) return;

    fetchWithAuth(`http://localhost:3000/api/followed?user_id=${objectId}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Followers data:", data);
        // 👇 extraemos solo los _id en un array
        setSeguidos(data.followed.map((u) => u._id));
      });
  }, [objectId, fetchWithAuth]);

  // Función para seguir/dejar de seguir
  const toggleFollow = async (targetIdRaw) => {
    const targetId = String(targetIdRaw);
    const isFollowing = seguidos.includes(targetId);

    const url = isFollowing
      ? "http://localhost:3000/api/unfollow"
      : "http://localhost:3000/api/follow";

    try {
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
    }
  };

  if (loading) {
    return <div className="loading">Cargando seguidores...</div>;
  }

  console.log("Seguidos en ListaFollowers:", seguidos);
  return (
    <div className="container">
      <div className="list-table">
        {/* Rows */}
        <div className="user-list">
          {seguidores.length === 0 ? (
            <p className="no-following">
              Por el momento nadie te esta siguiendo
            </p>
          ) : (
            seguidores.map((user) => (
              <div key={user._id} className="user-row">
                <div>
                  <a className="followed-user">
                    <img
                      src={user.avatar_url}
                      alt="avatar user"
                      className="avatar-post"
                      style={{ width: "50px", height: "50px" }}
                    />
                    <div className="user-info">
                      <h2 className="username">{user.username}</h2>
                    </div>
                  </a>
                </div>

                <div className="col watched numeric">
                  <div className="stat"></div>
                </div>

                <div className="col lists numeric">
                  <div className="stat"></div>
                </div>

                <div className="col likes numeric">
                  <div className="followed-actions">
                    <button
                      type="button"
                      className={`follow-btn ${
                        seguidos.includes(user._id) ? "following" : ""
                      }`}
                      onClick={() => {
                        if (seguidos.includes(user._id)) {
                          setConfirmUnfollow(user); // 👈 abre modal
                        } else {
                          toggleFollow(user._id); // seguir directamente
                        }
                      }}
                    >
                      {seguidos.includes(user._id) ? "Siguiendo" : "Seguir"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Modal de confirmación */}
      {confirmUnfollow && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>¿Dejar de seguir?</h3>
            <p>
              ¿Estás seguro de que quieres dejar de seguir a{" "}
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
    </div>
  );
};

export default ListaFollowers;
