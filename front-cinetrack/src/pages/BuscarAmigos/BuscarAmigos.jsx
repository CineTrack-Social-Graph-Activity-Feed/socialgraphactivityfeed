import Navbar from "../../compenents/Navbar/Navbar";
import SideBar from "../../compenents/feedPrincipal/sidebar/SideBar";
import Footer from "../../compenents/Footer/Footer";
import React from "react";
import "./BuscarAmigos.css";
import { CheckCircle, Plus,Eye, List, Heart } from "lucide-react";
import ListaFollows from "../../compenents/listaFollows/ListaFollows"
import { use, useEffect, useState} from "react";
import { useUser } from "../../../UserContex";

const featured = [
  {
    name: "Maya Cade",
    stats: "407 films · 146 reviews",
    avatar: "https://i.pravatar.cc/60?img=15",
    films: ["https://i.pravatar.cc/60?img=15", "https://i.pravatar.cc/60?img=15"],
    isFollowing: false,
  },
  {
    name: "Paul Herron",
    stats: "1.2K films · 302 reviews",
    avatar: "https://i.pravatar.cc/60?img=15",
    films: ["https://i.pravatar.cc/60?img=15", "https://i.pravatar.cc/60?img=15"],
    isFollowing: false,
  },
  {
    name: "Dawn Fratini",
    stats: "4.2K films · 965 reviews",
    avatar: "https://i.pravatar.cc/60?img=15",
    films: ["https://i.pravatar.cc/60?img=15", "https://i.pravatar.cc/60?img=15"],
    isFollowing: false,
  },
  {
    name: "Tripp Burton",
    stats: "5.3K films · 2.5K reviews",
    avatar: "https://i.pravatar.cc/60?img=15",
    films: ["https://i.pravatar.cc/60?img=15", "https://i.pravatar.cc/60?img=15"],
    isFollowing: false,
  },
  {
    name: "Film Club @ GSU",
    stats: "102 films · 35 reviews",
    avatar: "https://i.pravatar.cc/60?img=15",
    films: ["https://i.pravatar.cc/60?img=15", "https://i.pravatar.cc/60?img=15"],
    isFollowing: false,
  },
  {
    name: "Film Club @ GSU",
    stats: "102 films · 35 reviews",
    avatar: "https://i.pravatar.cc/60?img=15",
    films: ["https://i.pravatar.cc/60?img=15", "https://i.pravatar.cc/60?img=15"],
    isFollowing: false,
  },
  {
    name: "Film Club @ GSU",
    stats: "102 films · 35 reviews",
    avatar: "https://i.pravatar.cc/60?img=15",
    films: ["https://i.pravatar.cc/60?img=15", "https://i.pravatar.cc/60?img=15"],
    isFollowing: false,
  },
  {
    name: "Film Club @ GSU",
    stats: "102 films · 35 reviews",
    avatar: "https://i.pravatar.cc/60?img=15",
    films: ["https://i.pravatar.cc/60?img=15", "https://i.pravatar.cc/60?img=15"],
    isFollowing: false,
  },
  {
    name: "Film Club @ GSU",
    stats: "102 films · 35 reviews",
    avatar: "https://i.pravatar.cc/60?img=15",
    films: ["https://i.pravatar.cc/60?img=15", "https://i.pravatar.cc/60?img=15"],
    isFollowing: false,
  },
  
];

const popular = [
  {
    name: "Karsten",
    stats: "2.3K films · 1.6K reviews",
    avatar: "https://i.pravatar.cc/60?img=15",
    films: ["https://i.pravatar.cc/60?img=15", "https://i.pravatar.cc/60?img=15"],
    isFollowing: false,
  },
  {
    name: "James (Schaffrillas)",
    stats: "1.3K films · 1.2K reviews",
    avatar: "https://i.pravatar.cc/60?img=15",
    films: ["https://i.pravatar.cc/60?img=15", "https://i.pravatar.cc/60?img=15"],
    isFollowing: false,
  },
  {
    name: "Jay",
    stats: "1.7K films · 1.6K reviews",
    avatar: "https://i.pravatar.cc/60?img=15",
    films: ["https://i.pravatar.cc/60?img=15", "https://i.pravatar.cc/60?img=15"],
    isFollowing: false,
  },
  {
    name: "zoë rose bryant",
    stats: "5K films · 2.4K reviews",
    avatar: "https://i.pravatar.cc/60?img=15",
    films: ["https://i.pravatar.cc/60?img=15", "https://i.pravatar.cc/60?img=15"],
    isFollowing: true,
  },
  {
    name: "CinemaJoe",
    stats: "2.1K films · 1.4K reviews",
    avatar: "https://i.pravatar.cc/60?img=15",
    films: ["https://i.pravatar.cc/60?img=15", "https://i.pravatar.cc/60?img=15"],
    isFollowing: true,
  },
];

function MemberCard({ member }) {
  return (
    <div className="member-card">
      <div className="avatar-wrapper">
        <img src={member.avatar} alt={member.name} className="avatar" />
        {member.isFollowing ? (
          <CheckCircle className="status-icon following" size={22} />
        ) : (
          <Plus className="status-icon add" size={22} />
        )}
      </div>
      <div className="member-info">
        <div className="member-name">{member.name}</div>
        <div className="member-stats">{member.stats}</div>
        <div className="films-row">
          {member.films.map((film, i) => (
            <img key={i} src={film} alt="film" className="film-thumb" />
          ))}
        </div>
      </div>
    </div>
  );
}

function BuscarAmigos() {

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
            fetch(`http://localhost:3000/api/users`)
              .then((response) => response.json())
              .then((data) => {
                console.log("Followers data:", data);
                setSeguidores(data);
              });
          }, []);
      
          const [search, setSearch] = useState("");
      
        // Filtrado dinámico
        const filteredUsers = seguidores.filter(user =>
          user.username.toLowerCase().includes(search.toLowerCase())
        );

  return (
    <div className="layout">
      <div className="navbar-container">
        <Navbar />
      </div>
      <div className="content">
        <div className="sidebar-feed">
          <SideBar />
        </div>
        <main
          className="bkg-especial"
          style={{ width: "100%", padding: "20px"}}
        >
              <div className="members-container">
      <h2 className="subtitle">
        Film lovers, critics and friends — find popular members.
      </h2>

      <section >
        <h3 className="section-title">Suscriptores con mas reviews</h3>
        <div className="members-row">
          {featured.map((m, i) => (
            <MemberCard key={i} member={m} />
          ))}
        </div>
      </section>

      <section className="setions">
        <h3 className="section-title">Ultimas reviews</h3>
        <div className="members-row">
          {popular.map((m, i) => (
            <MemberCard key={i} member={m} />
          ))}
        </div>
      </section>
      <section className="setions">
        <h3 className="section-title">Todos los suscriptores</h3>

      <div className="container">

      {/* Barra de búsqueda */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Busque un usuario..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="search-icon">🔍</span>
      </div>

      {/* Encabezados */}
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
          {filteredUsers.map((user) => (
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
      </section>
    </div>
        </main>
      </div>
      <div className="footer-container">
        <Footer />
      </div>
    </div>
  );
}

export default BuscarAmigos;
