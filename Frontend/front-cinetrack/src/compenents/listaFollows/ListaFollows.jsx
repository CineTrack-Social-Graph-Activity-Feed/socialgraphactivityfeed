import "./ListaFollows.css";
import { Eye, List, Heart, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useUser } from "../../../UserContex";
import { apiClient } from "../../config/api"; // Importar el cliente API

const ListaFollows = () => {
  const { userId } = useUser();
  const [seguidores, setSeguidores] = useState([]);
  const [confirmUnfollow, setConfirmUnfollow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const unfollowUser = async (targetId) => {
    try {
      await apiClient.post("api/unfollow", {
        follower_user_id: userId,
        followed_user_id: targetId,
      });

      // Actualizar la lista localmente
      setSeguidores((prev) => prev.filter((u) => u._id !== targetId));
    } catch (err) {
      console.error("Error al dejar de seguir:", err);
      setError(`Error: ${err.message}`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        const data = await apiClient.get(`api/followed?user_id=${userId}`);
        setSeguidores(data.followed || []);
      } catch (err) {
        console.error("Error al obtener seguidores:", err);
        setError(`No se pudieron cargar los seguidores. ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Escuchar cambios globales
    window.addEventListener("followersUpdated", fetchData);

    return () => {
      window.removeEventListener("followersUpdated", fetchData);
    };
  }, [userId]);

  // Mostrar estados de carga y error
  if (loading) return <div className="loading">Cargando seguidores...</div>;
  if (error)
    return (
      <div className="error-message">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );

  return (
    <div className="container">
      <div className="list-table">
        {/* Rows */}
        <div className="user-list">
          {seguidores.map((user) => (
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
                {/* 👇 Botón para dejar de seguir */}
                <button
                  className="follow-btn"
                  onClick={() => setConfirmUnfollow(user)}
                  style={{ backgroundColor: "#d6d5d4", color: "#000" }}
                >
                  Siguiendo
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* 🔹 Modal de confirmación */}
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
};

export default ListaFollows;
                {/* 👇 Botón para dejar de seguir */}
                <button
                  className="follow-btn"
                  onClick={() => setConfirmUnfollow(user)}
                  style={{ backgroundColor: "#d6d5d4", color: "#000" }}
                >
                  Siguiendo
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* 🔹 Modal de confirmación */}
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
};

export default ListaFollows;
