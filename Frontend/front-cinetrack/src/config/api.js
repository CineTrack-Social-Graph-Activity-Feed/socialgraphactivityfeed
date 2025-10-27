/**
 * Configuración centralizada para la API
 */

// Usar la URL de la API definida en las variables de entorno (inyectada por Vite durante la compilación)
// Si no está disponible, usar la nueva URL de CloudFront para la API (HTTPS)
export const API_URL =
  import.meta.env.VITE_API_URL || "https://dgwmrgtjt0otk.cloudfront.net";

// ✅ Ahora usando CloudFront con HTTPS para evitar problemas de mixed content
//console.log('✅ API URL configurada con CloudFront (HTTPS):', API_URL);

// Registro de la URL utilizada
//console.log('API URL configurada:', API_URL);

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
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // No es necesario establecer manualmente el Origin para CORS
          // El navegador lo gestiona automáticamente
          ...options.headers,
        },
        // Para CORS cross-origin debemos especificar el modo
        mode: "cors",
        // No incluir credenciales a menos que se necesiten específicamente
        credentials: "same-origin",
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
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // No es necesario establecer manualmente el Origin para CORS
          // El navegador lo gestiona automáticamente
          ...options.headers,
        },
        body: JSON.stringify(data),
        // Para CORS cross-origin debemos especificar el modo
        mode: "cors",
        // No incluir credenciales a menos que se necesiten específicamente
        credentials: "same-origin",
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
