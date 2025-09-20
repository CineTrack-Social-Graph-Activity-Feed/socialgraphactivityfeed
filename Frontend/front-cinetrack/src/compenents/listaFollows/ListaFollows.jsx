import "./ListaFollows.css";
import { Eye, List, Heart, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useUser } from "../../../UserContex";

// URL base de la API desde las variables de entorno
const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://social-graph-app-env.eba-2hqyxuyh.us-east-2.elasticbeanstalk.com";

console.log("API URL configurada:", API_URL);

const ListaFollows = () => {
  const { userId } = useUser();
  const [seguidores, setSeguidores] = useState([]);
  const [confirmUnfollow, setConfirmUnfollow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const unfollowUser = async (targetId) => {
    try {
      console.log(`Enviando solicitud unfollow a ${API_URL}/api/unfollow`);
      const res = await fetch(`${API_URL}/api/unfollow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          follower_user_id: userId,
          followed_user_id: targetId,
        }),
      });

      console.log("Respuesta del servidor:", res.status);

      if (res.ok) {
        // Se actualiza inmediatamente la lista
        setSeguidores((prev) => prev.filter((u) => u._id !== targetId));
      } else {
        const error = await res.json().catch(() => ({ message: "Error desconocido" }));
        console.error("Error al dejar de seguir:", error);
        setError(`Error al dejar de seguir: ${error.message || res.status}`);
      }
    } catch (err) {
      console.error("Error en unfollowUser:", err);
      setError(`Error de conexión: ${err.message}`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(`Fetching from: ${API_URL}/api/followed?user_id=${userId}`);
        const res = await fetch(`${API_URL}/api/followed?user_id=${userId}`);
        
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

    // Primera carga
    if (userId) {
      fetchData();
    }

    // Escuchar cambios globales
    window.addEventListener("followersUpdated", fetchData);

    return () => {
      window.removeEventListener("followersUpdated", fetchData);
    };
  }, [userId]);

  // Mostrar estado de carga o error
  if (loading) {
    return <div className="loading">Cargando seguidores...</div>;
  }
  
  if (error) {
    return <div className="error-message">
      <h3>Error de conexión</h3>
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Reintentar</button>
    </div>;
  }

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
