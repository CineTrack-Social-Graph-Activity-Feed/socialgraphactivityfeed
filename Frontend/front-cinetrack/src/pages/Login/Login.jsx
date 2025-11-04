import React from "react";
import Footer from "../../compenents/footer/Footer";
import "./Login.css";

import { useState } from "react";
import { useAuth } from "../../config/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const username = fd.get("username");
    const password = fd.get("password");
    try {
      await signIn({ username, password });
      navigate("/feed");
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-login bkg-especial">
      <main className="login-user-main">
        <div className="login-container">
          <div className="form-container">
            <div className="logo-login">
              <div className="icono-login">
                <div className="triangle left"></div>
                <div className="triangle right"></div>
              </div>
              <p>cineTrack</p>
            </div>
            <p>
              Entrá a tu feed y descubrí las reseñas que tus amigos estuvieron
              escribiendo!
            </p>
            <h2>Iniciá Sesión</h2>
            <form className="form-login" onSubmit={onSubmit}>
              <div className="form-group">
                <label htmlFor="username">Usuario</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  className="form-input"
                  placeholder="cinetrack123"
                  autoComplete="username"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  className="form-input"
                  placeholder="contraseña1234"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="form-error">Contraseña o usuario incorrecto</p>
              )}

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? "Ingresando..." : "Iniciar Sesión"}
              </button>
            </form>

            <div className="forgot-password">
              <button type="button" className="btn-forgot-password">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>
        </div>
      </main>
      <div className="footer-container">
        <Footer />
      </div>
    </div>
  );
}

export default Login;
