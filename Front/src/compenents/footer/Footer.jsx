import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-links">
          <a href="/#">Sobre Nosotros</a>
          <a href="/#">Terminos y Condiciones</a>
          <a href="/#">Ayuda</a>
        </div>
        <p className="footer-text">
          &copy; cineTrack - Todos los derechos reservados.
        </p>
      </div>
      <button className="logo">
        <div className="icon">
          <div className="triangle left"></div>
          <div className="triangle right"></div>
        </div>
        cineTrack
      </button>
    </footer>
  );
}
export default Footer;
