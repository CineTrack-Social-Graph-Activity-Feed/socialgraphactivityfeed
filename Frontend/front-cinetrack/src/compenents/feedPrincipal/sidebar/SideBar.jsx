import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "./SideBar.css";
import { useUser } from "../../../../UserContex";

function SideBar() {
  const { userId } = useUser();

  const [user, setUser] = useState({});

  useEffect(() => {
<<<<<<< HEAD
    fetch(`http://localhost:3000/api/user/${userId}`)
=======
    fetch(`/api/user/${userId}`)
>>>>>>> c027e27338d9d05ca2456cbd5219ffc4b9312a89
      .then((res) => res.json())
      .then((data) => {
        console.log("Usuario recibido:", data);
        setUser(data.user);
      })
      .catch((err) => console.error("Error al traer usuario:", err));
  }, []);

  return (
    <aside className="sidebar">
      {/* Perfil */}
      <div className="profile">
        <img className="avatar" src={user.avatar_url} alt="Avatar user" />
        <div className="username-sidebar">{user.username}</div>
      </div>

      {/* Explore */}
      <div className="section">
        <h4 className="section-title">Panel</h4>

        <nav className="menu">
          <NavLink className="menu-item active" to="/">
            <span className="icon-pill">
              {/* icono perfil */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="8" r="4" strokeWidth="2" />
                <path d="M4 20c2-4 14-4 16 0" strokeWidth="2" />
              </svg>
            </span>
            <span>Actividad Amigos</span>
          </NavLink>
          {/*
          <NavLink className="menu-item active" to="/mi-actividad">
            <span className="icon-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="8" r="4" strokeWidth="2" />
                <path d="M4 20c2-4 14-4 16 0" strokeWidth="2" />
              </svg>
            </span>
            <span>Mi Actividad</span>
          </NavLink> */}

          <NavLink className="menu-item active" to="/follows">
            <span className="icon-pill">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-people"
                viewBox="0 0 16 16"
              >
                <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4" />
              </svg>
            </span>
            <span>Network</span>
          </NavLink>
          {/*   
          <NavLink className="menu-item" to="/buscar-amigos">
            <span className="icon-pill">
              
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-people"
                viewBox="0 0 16 16"
              >
                <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4" />
              </svg>
            </span>
            <span>Buscar Amigos</span>
          </NavLink> 
          */}
        </nav>
      </div>

      {/* Settings */}
      <div className="section">
        <nav className="menu">
          <button className="menu-item danger" type="button">
            <span className="icon-pill danger-pill">
              {/* icono logout */}
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
            </span>
            <span>Cerrar sesión</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}

export default SideBar;
