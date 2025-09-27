import { useEffect, useState } from "react";
import { API_URL } from "../../../config/api";
import "./Followed.css";
import { useUser } from "../../../../UserContex";

function Followed() {
  const { userId } = useUser();
  const [openMenu, setOpenMenu] = useState(null); // guarda el usuario con menú abierto
  const [seguidores, setSeguidores] = useState([]);

  const toggleMenu = (idUser) => {
    setOpenMenu(openMenu === idUser ? null : idUser);
  };

  const handleUnfollow = (idUser) => {
    setOpenMenu(null);
    // 👇 acá podrías llamar al backend para realmente dejar de seguir
    fetch(`${API_URL}/api/unfollow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        follower_user_id: userId,
        followed_user_id: idUser,
      }),
    });
    // Actualizar la lista de seguidores en el frontend
    setSeguidores(seguidores.filter((user) => user._id !== idUser));
  };

  useEffect(() => {
    const fetchData = () => {
      fetch(`${API_URL}/api/followed?user_id=${userId}`)
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
    <div className="followed-container">
      <h2 className="followed-title">Usuarios a los que sigues</h2>
      {seguidores.length === 0 ? (
        <p className="no-followed">Usted no sigue a nadie</p>
      ) : (
        seguidores.map((user) => (
          <div className="followed-users" key={user._id}>
            <div className="followed-user-item">
              <a href="#" className="followed-user">
                <img
                  src={user.avatar_url}
                  alt="avatar user"
                  className="avatar-user-followed"
                />
                <div>
                  <p className="followed-user-name">{user.username}</p>
                </div>
              </a>
            </div>
            <div className="followed-actions">
              <button
                className="unfollow-button"
                onClick={() => toggleMenu(user._id)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-person-check-fill"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill-rule="evenodd"
                    d="M15.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L12.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0"
                  />
                  <path d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
                </svg>
              </button>

              {/* Menú desplegable */}
              {openMenu === user._id && (
                <div className="unfollow-menu">
                  <button onClick={() => handleUnfollow(user._id)}>
                    Dejar de seguir
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      class="bi bi-person-fill-dash unfollow-svg"
                      viewBox="0 0 16 16"
                    >
                      <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M11 12h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1m0-7a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
                      <path d="M2 13c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.544-3.393Q8.844 9.002 8 9c-5 0-6 3-6 4" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
export default Followed;

