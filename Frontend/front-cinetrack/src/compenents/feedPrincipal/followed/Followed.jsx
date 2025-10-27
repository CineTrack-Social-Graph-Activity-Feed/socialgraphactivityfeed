import { useEffect, useState } from "react";
import { API_URL } from "../../../config/api";
import "./Followed.css";
import { useAuth } from "../../../config/AuthContext";

function Followed() {
  const { user, fetchWithAuth, signOut } = useAuth(); // <- user de /me
  const userId = user.user.user_id; // normalizamos ID
  const [perfil, setPerfil] = useState(null);
  const [openMenu, setOpenMenu] = useState(null); // guarda el usuario con menú abierto
  const [seguidores, setSeguidores] = useState([]);

  const toggleMenu = (idUser) => {
    setOpenMenu(openMenu === idUser ? null : idUser);
  };
  // 1) Traer perfil completo del usuario para la navbar (si hace falta más que /me)
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

  // 2) Traer a quiénes sigo (lista de IDs)
  useEffect(() => {
    const objectId = perfil?.id;

    if (!objectId) return;
    const fetchFollowed = async () => {
      try {
        const res = await fetchWithAuth(
          `http://localhost:3000/api/followed?user_id=${objectId}`
        );
        if (!res.ok) throw new Error("Error al traer followed");
        const data = await res.json();
        setSeguidores(data.followed || []);
      } catch (err) {
        console.error("Error followed:", err);
      }
    };

    fetchFollowed();
    window.addEventListener("followersUpdated", fetchFollowed);

    return () => {
      window.removeEventListener("followersUpdated", fetchFollowed);
    };
  }, [perfil?.id, fetchWithAuth]);

  const handleUnfollow = async (idUser) => {
    const targetId = String(idUser);
    console.log("Dejar de seguir a ID:", targetId);
    setOpenMenu(null);
    try {
      const res = await fetchWithAuth("http://localhost:3000/api/unfollow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          follower_user_id: perfil.id,
          followed_user_id: targetId,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Unfollow falló (${res.status}) ${text}`);
      }

      setSeguidores((prev) => prev.filter((u) => u._id !== targetId));
    } catch (e) {
      console.error(e);
    }
  };

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
                  src={
                    user.avatar_url
                      ? user.avatar_url
                      : "https://st3.depositphotos.com/4111759/13425/v/450/depositphotos_134255670-stock-illustration-avatar-people-male-profile-gray.jpg"
                  }
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
