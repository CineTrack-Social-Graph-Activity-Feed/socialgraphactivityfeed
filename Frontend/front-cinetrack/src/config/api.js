/**
 * Configuración centralizada para la API
 */

// URL base de la API desde las variables de entorno o fallback a Elastic Beanstalk
export const API_URL = import.meta.env.VITE_API_URL || 'https://social-graph-app-env.eba-2hqyxuyh.us-east-2.elasticbeanstalk.com';

// Log para depuración
console.log('API URL configurada:', API_URL);

/**
 * Función para construir una URL completa a la API
 */
export const apiUrl = (endpoint) => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_URL}${normalizedEndpoint}`;
};

/**
 * Cliente de API básico
 */
export const apiClient = {
  async get(endpoint, options = {}) {
    try {
      console.log(`Realizando petición GET a: ${apiUrl(endpoint)}`);
      const response = await fetch(apiUrl(endpoint), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      console.log(`Respuesta de ${endpoint}:`, response.status);
      
      if (!response.ok) {
        throw new Error(`Error en petición GET: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error en apiClient.get(${endpoint}):`, error);
      throw error;
    }
  },
  
  async post(endpoint, data, options = {}) {
    try {
      console.log(`Realizando petición POST a: ${apiUrl(endpoint)}`, data);
      const response = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      });
      
      console.log(`Respuesta de ${endpoint}:`, response.status);
      
      if (!response.ok) {
        throw new Error(`Error en petición POST: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error en apiClient.post(${endpoint}):`, error);
      throw error;
    }
  }
};
