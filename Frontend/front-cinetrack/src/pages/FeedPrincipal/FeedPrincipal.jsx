import React, { useMemo } from "react";
import "./FeedPrincipal.css";
import Post from "../../compenents/feedPrincipal/post/Post";
import Navbar from "../../compenents/Navbar/Navbar";
import SideBar from "../../compenents/feedPrincipal/sidebar/SideBar";
import Followed from "../../compenents/feedPrincipal/followed/followed";
import PostCreate from "../../compenents/feedPrincipal/post/PostCreate";
import Footer from "../../compenents/Footer/Footer";

function FeedPrincipal() {
  const items = useMemo(() => Array.from({ length: 1 }, (_, i) => i), []);

  return (
    <div className="layout">
      <div className="navbar-container">
        <Navbar />
      </div>
      <div className="content">
        <div className="sidebar-feed">
          <SideBar />
        </div>
        <main className="main bkg-especial">
          <div className="title-section">
            <h2>
              ¡Bienvenido! Estos es lo que tus amigos han estado viendo...
            </h2>
          </div>
          <div className="feed-stack">
            {items.map((i) => (
              <Post key={i} />
            ))}
          </div>
        </main>
        <div className="followed bkg-especial">
          <Followed />
        </div>
      </div>
      <div className="footer-container">
        <Footer />
      </div>
    </div>
  );
}

export default FeedPrincipal;
