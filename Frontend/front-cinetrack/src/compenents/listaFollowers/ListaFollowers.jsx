import "./ListaFollowers.css";
import { Eye, List, Heart, CheckCircle } from "lucide-react";
import { use, useEffect, useState } from "react";
import { useUser } from "../../../UserContex";

const ListaFollowers = () => {
  const { userId } = useUser();
  const [user, setUser] = useState({});
  const [seguidores, setSeguidores] = useState([]);
  const [seguidos, setSeguidos] = useState([]);
  const [confirmUnfollow, setConfirmUnfollow] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3000/api/user/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Usuario recibido:", data);
        setUser(data.user);
      })
      .catch((err) => console.error("Error al traer usuario:", err));
  }, []);

  // Traigo los usuarios que me siguen
  useEffect(() => {
    const fetchData = () => {
      fetch(`http://localhost:3000/api/followers?user_id=${userId}`)
        .then((res) => res.json())
        .then((data) => setSeguidores(data.followers));
    };

    // Primera carga
    fetchData();

    // Escuchar cambios globales
    window.addEventListener("followersUpdated", fetchData);

    return () => {
      window.removeEventListener("followersUpdated", fetchData);
    };
  }, [userId]);

  // Traigo los usuarios que sigo
  useEffect(() => {
    fetch(`http://localhost:3000/api/followed?user_id=${userId}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Followers data:", data);
        // 👇 extraemos solo los _id en un array
        setSeguidos(data.followed.map((u) => u._id));
      });
  }, [userId]);

  // Función para seguir/dejar de seguir
  const toggleFollow = async (targetId) => {
    const isFollowing = seguidos.includes(targetId);

    const url = isFollowing
      ? "http://localhost:3000/api/unfollow"
      : "http://localhost:3000/api/follow";

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        follower_user_id: userId,
        followed_user_id: targetId,
      }),
    });

    if (res.ok) {
      if (isFollowing) {
        setSeguidos(seguidos.filter((id) => id !== targetId));
      } else {
        setSeguidos([...seguidos, targetId]);
      }
      window.dispatchEvent(new Event("followersUpdated"));
    } else {
      const error = await res.json();
      console.error("Error en toggleFollow:", error);
    }
  };

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
          ))}
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
