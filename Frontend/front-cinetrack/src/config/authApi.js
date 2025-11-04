// authApi.js
const API = "http://localhost:3000";

export async function login({ username, password }) {
  const body = new URLSearchParams();
  body.append("grant_type", "password");
  body.append("username", username);
  body.append("password", password);

  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("Credenciales inválidas");
  return res.json(); // { access_token, refresh_token }
}

export async function refreshToken(refresh_token) {
  const res = await fetch(`${API}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) throw new Error("No se pudo refrescar el token");
  return res.json(); // { access_token }
}

export async function getMe(access_token) {
  const res = await fetch(`${API}/api/auth/me`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!res.ok) throw new Error("No autorizado");
  return res.json(); // perfil del usuario
}
