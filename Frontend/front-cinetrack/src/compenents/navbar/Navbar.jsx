import { useEffect, useState, useRef } from "react";
import "./Navbar.css";
import { useAuth } from "../../config/AuthContext";

function Navbar() {
  const { user, fetchWithAuth, signOut } = useAuth(); // <- user de /me
  const userId = user.user.user_id; // normalizamos ID

  const [perfil, setPerfil] = useState(null);
  const [seguidores, setSeguidores] = useState([]); // array de IDs seguidos
  const [confirmUnfollow, setConfirmUnfollow] = useState(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchRef = useRef(null);

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
    (async () => {
      try {
        const res = await fetchWithAuth(
          `http://localhost:3000/api/followed?user_id=${objectId}`
        );
        if (!res.ok) throw new Error("Error al traer followed");
        const data = await res.json();
        // normalizamos IDs a string
        const ids = (data.followed || []).map((u) => String(u._id || u.id));
        setSeguidores(ids);
      } catch (err) {
        console.error("Error followed:", err);
      }
    })();
  }, [perfil?.id, fetchWithAuth]);

  // 3) Búsqueda con debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetchWithAuth(
          `http://localhost:3000/api/user/search?q=${encodeURIComponent(
            query
          )}&limit=5`
        );
        if (!res.ok) throw new Error("Error al buscar");
        const data = await res.json();
        const arr = data.users || data || [];
        const filtered = arr
          .map((u) => ({
            ...u,
            _normId: String(u.id),
          }))
          .filter((u) => u._normId !== String(perfil?.id)); // filtro: no mostrarme a mí
        setResults(filtered);
        setShowDropdown(filtered.length > 0);
      } catch (err) {
        console.error("Error al buscar usuarios:", err);
        setResults([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [query, userId, fetchWithAuth]);

  // 4) cerrar dropdown si clickeás afuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 5) Seguir / Dejar de seguir (con auth)
  const toggleFollow = async (targetIdRaw) => {
    const targetId = String(targetIdRaw);
    const isFollowing = seguidores.includes(targetId);

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

      setSeguidores((prev) =>
        isFollowing ? prev.filter((id) => id !== targetId) : [...prev, targetId]
      );
      window.dispatchEvent(new Event("followersUpdated"));
    } catch (e) {
      console.error("Error en toggleFollow:", e);
    }
  };

  return (
    <div className="navbar" data-testid="navbar">
      <button className="logo">
        <div className="icon">
          <div className="triangle left"></div>
          <div className="triangle right"></div>
        </div>
        <p>cineTrack</p>
      </button>

      <div className="user-section">
        <img
          src={
            user.user.image_url
              ? user.user.image_url
              : "https://st3.depositphotos.com/4111759/13425/v/450/depositphotos_134255670-stock-illustration-avatar-people-male-profile-gray.jpg"
          }
          alt="Logo Usuario"
          className="user-logo"
        />
        <h4 className="username">{user.user.full_name}</h4>

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
          <button className="search-btn" aria-label="Buscar" type="button">
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

          {showDropdown && (
            <ul className="search-dropdown">
              {loading && <li className="search-item">Buscando...</li>}

              {!loading && results.length === 0 && (
                <li className="search-item">No se encontraron usuarios</li>
              )}

              {!loading &&
                results.map((u) => {
                  const normId = String(u.id);
                  const isFollowing = seguidores.includes(normId);

                  return (
                    <li key={normId} className="search-item">
                      <img
                        src={
                          u.avatar_url
                            ? u.avatar_url
                            : "https://st3.depositphotos.com/4111759/13425/v/450/depositphotos_134255670-stock-illustration-avatar-people-male-profile-gray.jpg"
                        }
                        alt={u.username}
                        className="avatar"
                      />
                      <span className="username-dropdown">{u.username}</span>

                      <button
                        type="button"
                        className={`follow-btn ${
                          isFollowing ? "following" : ""
                        }`}
                        onClick={() => {
                          if (isFollowing) {
                            setConfirmUnfollow({
                              id: normId,
                              username: u.username,
                            });
                          } else {
                            toggleFollow(normId);
                            setQuery("");
                            setResults([]);
                            setShowDropdown(false);
                          }
                        }}
                      >
                        {isFollowing ? "Siguiendo" : "Seguir"}
                      </button>
                    </li>
                  );
                })}
            </ul>
          )}
        </form>

        <button className="logout-btn" title="Logout" onClick={signOut}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-box-arrow-right"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"
            />
            <path
              fillRule="evenodd"
              d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"
            />
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
                  setQuery("");
                  setResults([]);
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
