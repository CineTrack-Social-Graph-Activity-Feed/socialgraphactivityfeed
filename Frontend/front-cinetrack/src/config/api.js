/**
 * Configuración centralizada para la API
 */

// Para proxy a través de CloudFront
export const API_URL = window.location.origin;

// Para conexión directa a Elastic Beanstalk (alternativa)
// export const API_URL = 'http://social-graph-app-env.eba-2hqyxuyh.us-east-2.elasticbeanstalk.com';

/**
 * Cliente API para realizar peticiones al backend
 */
export const apiClient = {
  /**
   * Realiza una solicitud GET a la API
   */
  async get(endpoint, options = {}) {
    const url = endpoint.startsWith('/') ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`;
    
    console.log(`Realizando GET a ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Importante: Necesario para CORS
          'Origin': window.location.origin,
          ...options.headers
        },
        // No incluir credenciales a menos que se necesiten específicamente
        // credentials: 'include',
        ...options
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
    const url = endpoint.startsWith('/') ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`;
    
    console.log(`Realizando POST a ${url}`, data);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Importante: Necesario para CORS
          'Origin': window.location.origin,
          ...options.headers
        },
        body: JSON.stringify(data),
        // No incluir credenciales a menos que se necesiten específicamente
        // credentials: 'include',
        ...options
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
  }
};
