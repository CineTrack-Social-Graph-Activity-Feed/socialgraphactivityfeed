import "./ListaFollows.css";
import { Eye, List, Heart, CheckCircle } from "lucide-react";
import { use, useEffect, useState } from "react";
import { useUser } from "../../../UserContex";

const ListaFollows = () => {
  const { userId } = useUser();
  const [openMenu, setOpenMenu] = useState(null); // guarda el usuario con menú abierto
  const [seguidores, setSeguidores] = useState([]);

  const toggleMenu = (idUser) => {
    setOpenMenu(openMenu === idUser ? null : idUser);
  };

  const handleUnfollow = (idUser) => {
    setOpenMenu(null);
    // 👇 acá podrías llamar al backend para realmente dejar de seguir
    fetch(`http://localhost:3000/api/unfollow`, {
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
      fetch(`http://localhost:3000/api/followed?user_id=${userId}`)
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
              <div >
          <a className="followed-user">
            <img
              src={user.avatar_url}
              alt="avatar user"
              className="avatar-post"
            />
              <div className="user-info">              
              <h2 className="username">{user.username}</h2>

            </div></a></div>

              <div className="col watched numeric">
                <div className="stat">

                </div>
              </div>

              <div className="col lists numeric">
                <div className="stat">

                </div>
              </div>

              <div className="col likes numeric">
            <div className="followed-actions">


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

            </div>
          ))}

        </div>
      </div>
    </div>
  )
}

export default ListaFollows