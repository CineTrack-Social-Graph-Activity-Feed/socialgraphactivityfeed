/**
 * Configuración centralizada para la API
 */

// URL base de la API desde las variables de entorno o fallback a Elastic Beanstalk
export const API_URL = import.meta.env.VITE_API_URL || 'http://social-graph-app-env.eba-2hqyxuyh.us-east-2.elasticbeanstalk.com';

/**
 * Función para construir una URL completa a la API
 * @param {string} endpoint - El endpoint de la API (ej: '/api/users')
 * @returns {string} URL completa
 */
export const apiUrl = (endpoint) => {
  // Asegurar que el endpoint comience con /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_URL}${normalizedEndpoint}`;
};

/**
 * Cliente de API básico con métodos comunes
 */
export const apiClient = {
  /**
   * Realizar petición GET
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} options - Opciones adicionales para fetch
   */
  async get(endpoint, options = {}) {
    const response = await fetch(apiUrl(endpoint), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`Error en petición GET a ${endpoint}: ${response.status}`);
    }
    
    return response.json();
  },
  
  /**
   * Realizar petición POST
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} data - Datos a enviar
   * @param {Object} options - Opciones adicionales para fetch
   */
  async post(endpoint, data, options = {}) {
    const response = await fetch(apiUrl(endpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`Error en petición POST a ${endpoint}: ${response.status}`);
    }
    
    return response.json();
  },
};
