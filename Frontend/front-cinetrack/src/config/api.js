/**
 * Configuración centralizada para la API
 */

// Usar la URL de la API definida en las variables de entorno (inyectada por Vite durante la compilación)
export const API_URL = import.meta.env.VITE_API_URL;

/**
 * Cliente API para realizar peticiones al backend
 */
export const apiClient = {
  /**
   * Realiza una solicitud GET a la API
   */
  async get(endpoint, options = {}) {
    const url = endpoint.startsWith("/")
      ? `${API_URL}${endpoint}`
      : `${API_URL}/${endpoint}`;

    console.log(`Realizando GET a ${url}`);

    try {
      // Obtener token de localStorage si existe
      const token = localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };
      
      // Agregar Authorization si hay token
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
        mode: "cors",
        credentials: "include", // Necesario para CORS con credenciales
        ...options,
      });

      console.log(`Respuesta de ${endpoint}:`, response.status);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en GET ${endpoint}:`, error);
      throw error;
    }
  },

  /**
   * Realiza una solicitud POST a la API
   */
  async post(endpoint, data, options = {}) {
    const url = endpoint.startsWith("/")
      ? `${API_URL}${endpoint}`
      : `${API_URL}/${endpoint}`;

    console.log(`Realizando POST a ${url}`, data);

    try {
      // Obtener token de localStorage si existe
      const token = localStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };
      
      // Agregar Authorization si hay token
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        mode: "cors",
        credentials: "include", // Necesario para CORS con credenciales
        ...options,
      });

      console.log(`Respuesta de ${endpoint}:`, response.status);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en POST ${endpoint}:`, error);
      throw error;
    }
  },
};
