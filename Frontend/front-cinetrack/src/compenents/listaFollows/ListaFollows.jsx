import "./ListaFollows.css";
import { useEffect, useState } from "react";
import { useUser } from "../../../UserContex";
import { API_URL } from "../../config/api";
import { useAuth } from "../../config/AuthContext";

// Asegurar que estamos usando la API_URL centralizada
//console.log("ListaFollows usando API URL:", API_URL);

function ListaFollows() {
  const { user, fetchWithAuth, signOut } = useAuth(); // <- user de /me
  const userId = user.user.user_id; // normalizamos ID
  const [perfil, setPerfil] = useState(null);
  const [seguidores, setSeguidores] = useState([]);
  const [confirmUnfollow, setConfirmUnfollow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const unfollowUser = async (targetId) => {
    try {
      console.log(`Enviando solicitud unfollow a ${API_URL}/api/unfollow`);
      const res = await fetchWithAuth("http://localhost:3000/api/unfollow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          follower_user_id: perfil.id,
          followed_user_id: targetId,
        }),
      });

      console.log("Respuesta del servidor:", res.status);

      if (res.ok) {
        setSeguidores((prev) => prev.filter((u) => u._id !== targetId));
      } else {
        const errorData = await res
          .json()
          .catch(() => ({ message: "Error desconocido" }));
        console.error("Error al dejar de seguir:", errorData);
        setError(
          `Error al dejar de seguir: ${errorData.message || res.status}`
        );
      }
    } catch (err) {
      console.error("Error en unfollowUser:", err);
      setError(`Error de conexión: ${err.message}`);
    }
  };

  useEffect(() => {
    const objectId = perfil?.id;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(
          `Fetching from: ${API_URL}/api/followed?user_id=${objectId}`
        );
        const res = await fetchWithAuth(
          `http://localhost:3000/api/followed?user_id=${objectId}`
        );

        console.log("Status de respuesta:", res.status);

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("Datos recibidos:", data);
        setSeguidores(data.followed || []);
      } catch (err) {
        console.error("Error al obtener seguidores:", err);
        setError(`Error al cargar seguidores: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (objectId) {
      fetchData();
    }

    window.addEventListener("followersUpdated", fetchData);
    return () => {
      window.removeEventListener("followersUpdated", fetchData);
    };
  }, [perfil?.id, fetchWithAuth]);

  if (loading) {
    return <div className="loading">Cargando seguidos...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        <h3>Error de conexión</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="list-table">
        <div className="user-list">
          {seguidores.length === 0 ? (
            <p className="no-following">
              Usted no sigue a nadie. Busque a tus amigos y comience a
              seguirlos!
            </p>
          ) : (
            seguidores.map((user) => (
              <div key={user._id} className="user-row">
                <div>
                  <a className="followed-user">
                    <img
                      src={
                        user.avatar_url
                          ? user.avatar_url
                          : "https://st3.depositphotos.com/4111759/13425/v/450/depositphotos_134255670-stock-illustration-avatar-people-male-profile-gray.jpg"
                      }
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
                  <button
                    className="follow-btn"
                    onClick={() => setConfirmUnfollow(user)}
                    style={{ backgroundColor: "#d6d5d4", color: "#000" }}
                  >
                    Siguiendo
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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
    </div>
  );
}

export default ListaFollows;
