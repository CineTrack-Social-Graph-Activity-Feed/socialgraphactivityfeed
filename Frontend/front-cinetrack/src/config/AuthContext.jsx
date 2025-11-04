// AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as apiLogin, refreshToken, getMe } from "./authApi";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [access, setAccess] = useState(
    () => localStorage.getItem("access_token") || ""
  );
  const [refresh, setRefresh] = useState(
    () => localStorage.getItem("refresh_token") || ""
  );
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(!!access);

  useEffect(() => {
    if (!access) return;
    (async () => {
      try {
        const me = await getMe(access);
        setUser(me);
      } catch {
        // si el access expiró, intentamos refrescar
        if (refresh) {
          try {
            const { access_token } = await refreshToken(refresh);
            setAccess(access_token);
            localStorage.setItem("access_token", access_token);
            const me = await getMe(access_token);
            setUser(me);
          } catch {
            signOut();
          }
        } else {
          signOut();
        }
      } finally {
        setLoadingUser(false);
      }
    })();
  }, []); // solo al montar

  const signIn = async ({ username, password }) => {
    const { access_token, refresh_token } = await apiLogin({
      username,
      password,
    });
    setAccess(access_token);
    setRefresh(refresh_token);
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    const me = await getMe(access_token);
    setUser(me);
    return me;
  };

  const signOut = () => {
    setAccess("");
    setRefresh("");
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  };

  // fetch con auto-refresh
  let refreshingPromise = null;
  const fetchWithAuth = async (input, init = {}) => {
    const doFetch = async (token) =>
      fetch(input, {
        ...init,
        headers: {
          ...(init.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });

    // 1er intento
    let res = await doFetch(access);
    if (res.status !== 401) return res;

    // si 401, intentamos refrescar (evitar carrera con una única promesa compartida)
    if (!refresh) return res; // no hay refresh; devolver 401

    if (!refreshingPromise) {
      refreshingPromise = (async () => {
        const { access_token } = await refreshToken(refresh);
        setAccess(access_token);
        localStorage.setItem("access_token", access_token);
        return access_token;
      })().finally(() => {
        refreshingPromise = null;
      });
    }

    const newAccess = await refreshingPromise;
    // reintento
    return doFetch(newAccess);
  };

  const value = useMemo(
    () => ({
      user,
      access,
      refresh,
      loadingUser,
      signIn,
      signOut,
      fetchWithAuth,
    }),
    [user, access, refresh, loadingUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
