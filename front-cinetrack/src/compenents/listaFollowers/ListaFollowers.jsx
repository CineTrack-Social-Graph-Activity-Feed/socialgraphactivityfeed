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
    alert(`Dejaste de seguir a ${idUser}`);
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
    fetch(`http://localhost:3000/api/followers?user_id=${userId}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Followers data:", data);
        setSeguidores(data.followers);
      });
  }, []);


  return (
        <div className="container">

      <div className="list-table">
        {/* Header */}
        <div className="table-header">
          <div className="col name">NAME</div>
          <div className="col watched numeric">WATCHED</div>
          <div className="col lists numeric">LISTS</div>
          <div className="col likes numeric">LIKES</div>
          <div className="col check" aria-hidden="true"></div>
        </div>

        {/* Rows */}
        <div className="user-list">
          {seguidores.map((user) => (
            <div key={user._id} className="user-row">
              <div >
          <a href="" className="followed-user">
            <img
              src={user.avatar_url}
              alt="avatar user"
              className="avatar-post"
            />
              <div className="user-info">              
              <h2 className="username">{user.username}</h2>
              <p className="followers">
                {/*user.followers*/} 10k followers, following 20k {/*user.following*/}
              </p>
            </div></a></div>

              <div className="col watched numeric">
                <div className="stat">
                  <Eye size={16} />
                  <span>{/*user.watched.toLocaleString()*/}2000</span>
                </div>
              </div>

              <div className="col lists numeric">
                <div className="stat">
                  <List size={16} />
                  <span>{/*user.lists*/}11</span>
                </div>
              </div>

              <div className="col likes numeric">
                <div className="stat">
                  <Heart size={16} />
                  <span>{/*user.likes.toLocaleString()*/}3000</span>
                </div>
              </div>

              {/*<div className="col check">                <CheckCircle size={18} />              </div>*/}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ListaFollowers