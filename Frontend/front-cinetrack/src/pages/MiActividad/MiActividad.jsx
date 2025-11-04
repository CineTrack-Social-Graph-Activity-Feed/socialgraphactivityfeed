import React, { useMemo } from "react";
import "./MiActividad.css";
import PostMiActividad from "../../compenents/miActividad/postMiActividad";
import Navbar from "../../compenents/navbar/Navbar";
import SideBar from "../../compenents/feedPrincipal/sidebar/SideBar";
import Followed from "../../compenents/feedPrincipal/followed/Followed";
import Footer from "../../compenents/footer/Footer";

function FeedPrincipal() {
  const items = useMemo(() => Array.from({ length: 1 }, (_, i) => i), []);

  return (
    <div className="layout-feed">
      <div className="navbar-container">
        <Navbar />
      </div>

      <div className="content-feed">
        <div className="sidebar-feed">
          <SideBar />
        </div>
        <main className="main bkg-especial">
          <div className="title-section">
            <h2>Tu actividad</h2>
          </div>
          <div className="feed-stack">
            {items.map((i) => (
              <PostMiActividad key={i} />
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
