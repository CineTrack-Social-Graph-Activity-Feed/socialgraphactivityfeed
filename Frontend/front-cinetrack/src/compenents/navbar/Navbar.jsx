import { useEffect, useState, useRef } from "react";
import "./Navbar.css";
import { useUser } from "../../../UserContex";

function Navbar() {
  const { userId } = useUser();
  const [user, setUser] = useState({});
  const [seguidores, setSeguidores] = useState([]);
  const [confirmUnfollow, setConfirmUnfollow] = useState(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchRef = useRef(null);

  useEffect(() => {
    fetch(`/api/user/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Usuario recibido:", data);
        setUser(data.user);
      })
      .catch((err) => console.error("Error al traer usuario:", err));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(() => {
      setLoading(true);
  fetch(`/api/user/search?q=${query}&limit=5`)
        .then((res) => res.json())
        .then((data) => {
          if (data.users) {
            // 👇 Filtra al usuario actual para que no aparezca
            const filtered = data.users.filter((u) => u.id !== userId);
            setResults(filtered);
            setShowDropdown(filtered.length > 0);
          } else {
            setResults([]);
            setShowDropdown(false);
          }
          console.log("Followers data:", data.users);
        })

        .catch((err) => console.error("Error al buscar usuarios:", err))
        .finally(() => setLoading(false));
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // 👇 cerrar dropdown si clickeás afuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Traigo los usuarios que sigo
  useEffect(() => {
  fetch(`/api/followed?user_id=${userId}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Followers data:", data);
        // 👇 extraemos solo los _id en un array
        setSeguidores(data.followed.map((u) => u._id));
      });
  }, [userId]);

  // Función para seguir/dejar de seguir
  const toggleFollow = async (targetId) => {
    const isFollowing = seguidores.includes(targetId);

    const url = isFollowing ? "/api/unfollow" : "/api/follow";

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
        setSeguidores(seguidores.filter((id) => id !== targetId));
      } else {
        setSeguidores([...seguidores, targetId]);
      }
      window.dispatchEvent(new Event("followersUpdated"));
    } else {
      const error = await res.json();
      console.error("Error en toggleFollow:", error);
    }
  };

  return (
    <div className="navbar">
      <button className="logo">
        <div className="icon">
          <div className="triangle left"></div>
          <div className="triangle right"></div>
        </div>
        cineTrack
      </button>

      <div className="user-section">
        <img src={user.avatar_url} alt="Logo Usuario" className="user-logo" />
        <h4 className="username">{user.username}</h4>

        <form
          className="search-wrap"
          onSubmit={(e) => e.preventDefault()}
          ref={searchRef}
        >
          <input
            className="search-input"
            type="search"
            placeholder="Buscar amigos..."
            aria-label="Buscar"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
          />
          <button className="search-btn" aria-label="Buscar">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <ul className="search-dropdown">
              {loading && <li className="search-item">Buscando...</li>}
              {!loading && results.length === 0 && (
                <li className="search-item">No se encontraron usuarios</li>
              )}
              {results.map((u) => (
                <li key={u.id} className="search-item">
                  <img src={u.avatar_url} alt={u.username} className="avatar" />
                  <span className="username-dropdown">{u.username}</span>

                  <button
                    type="button"
                    className={`follow-btn ${
                      seguidores.includes(u.id) ? "following" : ""
                    }`}
                    onClick={() => {
                      if (seguidores.includes(u.id)) {
                        setConfirmUnfollow(u); // 👈 abre modal
                      } else {
                        toggleFollow(u.id); // seguir directamente
                        setQuery(""); // 👈 limpia input
                        setResults([]); // 👈 borra resultados
                        setShowDropdown(false); // 👈 cierra dropdown
                      }
                    }}
                  >
                    {seguidores.includes(u.id) ? "Siguiendo" : "Seguir"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>

        <button className="logout-btn" title="Logout">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-box-arrow-right"
            viewBox="0 0 16 16"
          >
            {" "}
            <path
              fillRule="evenodd"
              d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"
            />{" "}
            <path
              fillRule="evenodd"
              d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"
            />{" "}
          </svg>
        </button>
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
                  toggleFollow(confirmUnfollow.id);
                  setConfirmUnfollow(null);
                  setQuery(""); // 👈 limpia el input
                  setResults([]); // 👈 borra resultados del dropdown
                  setShowDropdown(false);
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

export default Navbar;
