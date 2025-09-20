import Navbar from "../../compenents/navbar/Navbar";
import SideBar from "../../compenents/feedPrincipal/sidebar/SideBar";
import Footer from "../../compenents/footer/Footer";
import React, { useState } from "react";
import Tabs from "../../compenents/tabBar/TabBar";
import ListaFollows from "../../compenents/listaFollows/ListaFollows";
import ListaFollowers from "../../compenents/listaFollowers/ListaFollowers";

function Follows() {
  const [currentTab, setCurrentTab] = useState("SEGUIDOS");

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
          style={{ width: "100%", padding: "20px" }}
        >
          <div className="container">
            <Tabs onChange={setCurrentTab} />

            {currentTab === "SEGUIDOS" && <ListaFollows />}
            {currentTab === "SEGUIDORES" && <ListaFollowers />}
          </div>
        </main>
      </div>
      <div className="footer-container">
        <Footer />
      </div>
    </div>
  );
}

export default Follows;
