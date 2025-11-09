import "./Footer.css";

function Footer() {
  const handleLinkClick = (e) => {
    e.preventDefault();
    // Por ahora no hacen nada, se pueden implementar modales o páginas después
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-links">
          <a href="#" onClick={handleLinkClick}>Sobre Nosotros</a>
          <a href="#" onClick={handleLinkClick}>Terminos y Condiciones</a>
          <a href="#" onClick={handleLinkClick}>Ayuda</a>
        </div>
        <p className="footer-text">
          &copy; cineTrack - Todos los derechos reservados.
        </p>
      </div>
      <button className="logo" onClick={handleLinkClick}>
        <div className="icon">
          <div className="triangle left"></div>
          <div className="triangle right"></div>
        </div>
        <p>cineTrack</p>
      </button>
    </footer>
  );
}
export default Footer;
