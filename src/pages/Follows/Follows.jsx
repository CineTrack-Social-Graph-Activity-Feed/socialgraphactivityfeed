import Navbar from "../../compenents/Navbar/Navbar";
import SideBar from "../../compenents/feedPrincipal/sidebar/SideBar";
import Footer from "../../compenents/Footer/Footer";

function Follows() {
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
          <h1>Seguidores/Seguidos</h1>
        </main>
      </div>
      <div className="footer-container">
        <Footer />
      </div>
    </div>
  );
}

export default Follows;
