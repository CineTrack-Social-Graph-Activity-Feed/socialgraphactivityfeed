import Navbar from "../../compenents/navbar/Navbar";
import SideBar from "../../compenents/feedPrincipal/sidebar/SideBar";
import Footer from "../../compenents/footer/Footer";

function MiActividad() {
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
          <h1>Mi Actividad</h1>
        </main>
      </div>
      <div className="footer-container">
        <Footer />
      </div>
    </div>
  );
}

export default MiActividad;
