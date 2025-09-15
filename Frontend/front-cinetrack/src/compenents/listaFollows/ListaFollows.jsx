import "./ListaFollows.css";
import { Eye, List, Heart, CheckCircle } from "lucide-react";
import { use, useEffect, useState } from "react";
import { useUser } from "../../../UserContex";

const ListaFollows = () => {
  const { userId } = useUser();
  const [seguidores, setSeguidores] = useState([]);
  const [confirmUnfollow, setConfirmUnfollow] = useState(null);

  const unfollowUser = async (targetId) => {
    try {
<<<<<<< HEAD
      const res = await fetch("http://localhost:3000/api/unfollow", {
=======
  const res = await fetch("/api/unfollow", {
>>>>>>> c027e27338d9d05ca2456cbd5219ffc4b9312a89
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          follower_user_id: userId,
          followed_user_id: targetId,
        }),
      });

      if (res.ok) {
        // ✅ Se actualiza inmediatamente la lista
        setSeguidores((prev) => prev.filter((u) => u._id !== targetId));
      } else {
        const error = await res.json();
        console.error("Error al dejar de seguir:", error);
      }
    } catch (err) {
      console.error("Error en unfollowUser:", err);
    }
  };

  useEffect(() => {
    const fetchData = () => {
<<<<<<< HEAD
      fetch(`http://localhost:3000/api/followed?user_id=${userId}`)
=======
  fetch(`/api/followed?user_id=${userId}`)
>>>>>>> c027e27338d9d05ca2456cbd5219ffc4b9312a89
        .then((res) => res.json())
        .then((data) => setSeguidores(data.followed));
    };

    // Primera carga
    fetchData();

    // Escuchar cambios globales
    window.addEventListener("followersUpdated", fetchData);

    return () => {
      window.removeEventListener("followersUpdated", fetchData);
    };
  }, [userId]);

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
