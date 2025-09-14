import "./ListaFollowers.css";
import { Eye, List, Heart, CheckCircle } from "lucide-react";
import { use, useEffect, useState } from "react";
import { useUser } from "../../../UserContex";

const users = [
  {
    name: "CinemaJoe",
    followers: "114,182",
    following: "146",
    watched: 2069,
    lists: 22,
    likes: 2231,
  },
  {
    name: "timtamtitus",
    followers: "10,060",
    following: "37",
    watched: 1359,
    lists: 10,
    likes: 1250,
  },
  {
    name: "⭘",
    followers: "4,395",
    following: "3,575",
    watched: 117,
    lists: 0,
    likes: 36726,
  },
  {
    name: "matt lynch",
    followers: "86,853",
    following: "316",
    watched: 5825,
    lists: 26,
    likes: 7518,
  },
  {
    name: "zoë rose bryant",
    followers: "85,113",
    following: "672",
    watched: 5000,
    lists: 12,
    likes: 92408,
  },
  {
    name: "jer 🌿",
    followers: "5,441",
    following: "444",
    watched: 1053,
    lists: 8,
    likes: 115724,
  },
  {
    name: "Misael Santos",
    followers: "947",
    following: "202",
    watched: 2943,
    lists: 14,
    likes: 6573,
  },
];

import React from 'react'

const ListaFollowers = () => {
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

            </div>
          ))}

        </div>
      </div>
    </div>
  )
}

export default ListaFollowers