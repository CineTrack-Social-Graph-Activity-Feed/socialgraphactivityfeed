import { useState, useEffect } from 'react';
import { apiClient, API_URL } from '../config/api';
import './ApiTest.css';

/**
 * Componente para probar la conexión con la API
 * Este componente se puede usar temporalmente para verificar
 * que la conexión frontend-backend funciona correctamente
 */
function ApiTest() {
  const [status, setStatus] = useState('idle');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  // Función para detectar problemas de mixed content
  const isMixedContentIssue = () => {
    return window.location.protocol === 'https:' && API_URL.startsWith('http:');
  };

  // Función para probar la conexión directamente con fetch para obtener más detalles
  const testDirectFetch = async () => {
    try {
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        mode: 'cors'
      });
      
      // Obtener encabezados CORS
      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        'access-control-allow-headers': response.headers.get('access-control-allow-headers')
      };
      
      console.log('Respuesta directa de fetch:', response);
      console.log('Encabezados CORS:', corsHeaders);
      
      return { 
        ok: response.ok, 
        status: response.status, 
        corsHeaders 
      };
    } catch (error) {
      console.error('Error en fetch directo:', error);
      return { error: error.message };
    }
  };

  // Función para probar la conexión a la API
  const testApiConnection = async () => {
    setStatus('loading');
    setError(null);
    
    // Comprobar si hay problema de mixed content
    const hasMixedContent = isMixedContentIssue();
    
    try {
      // Primero hacemos una prueba directa para recopilar más información
      const directResult = await testDirectFetch();
      console.log('Resultado de fetch directo:', directResult);
      
      // Intenta hacer una solicitud al endpoint /health
      const data = await apiClient.get('/health');
      setResponse(data);
      setStatus('success');
    } catch (err) {
      console.error('Error al probar la API:', err);
      
      // Añadir información adicional al error
      let errorMsg = err.message;
      if (hasMixedContent) {
        errorMsg = `Error de contenido mixto: Este sitio está cargado como HTTPS pero intenta acceder a una API HTTP. ${errorMsg}`;
      }
      
      setError(errorMsg);
      setStatus('error');
      
      // Intenta con una ruta alternativa si falla
      try {
        const data = await apiClient.get('/api/health');
        setResponse(data);
        setStatus('success');
      } catch (secondErr) {
        console.error('Error en segundo intento:', secondErr);
      }
    }
  };

  return (
    <div className="api-test-container">
      <h2>Test de Conexión API</h2>
      <div className="api-info">
        <p><strong>URL de la API:</strong> {API_URL}</p>
      </div>
      
      <button 
        onClick={testApiConnection} 
        disabled={status === 'loading'}
        className={`test-button ${status === 'loading' ? 'loading' : ''}`}
      >
        {status === 'loading' ? 'Probando...' : 'Probar Conexión'}
      </button>
      
      {status === 'success' && (
        <div className="result success">
          <h3>Conexión exitosa</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
      
      {status === 'error' && (
        <div className="result error">
          <h3>Error de conexión</h3>
          <p>{error}</p>
          
          {isMixedContentIssue() && (
            <div className="mixed-content-warning">
              <h4>⚠️ Detectado problema de contenido mixto</h4>
              <p>Tu frontend está cargado sobre HTTPS, pero estás intentando acceder a una API en HTTP:</p>
              <ul>
                <li>Frontend: <strong>{window.location.origin}</strong> ({window.location.protocol})</li>
                <li>API: <strong>{API_URL}</strong> (http:)</li>
              </ul>
              <p>Opciones para resolver este problema:</p>
              <ol>
                <li>Configurar HTTPS para tu backend en Elastic Beanstalk (recomendado)</li>
                <li>Crear una distribución CloudFront para tu API en Elastic Beanstalk</li>
                <li>Usar una proxy inverso con HTTPS que se comunique con tu backend</li>
              </ol>
            </div>
          )}
          
          <p>Asegúrate de que:</p>
          <ul>
            <li>El backend está corriendo en Elastic Beanstalk</li>
            <li>CORS está correctamente configurado para permitir tu dominio CloudFront: <strong>{window.location.origin}</strong></li>
            <li>La URL de la API es correcta: <strong>{API_URL}</strong></li>
          </ul>
          
          <div className="debug-info">
            <h4>Información para depuración:</h4>
            <p>Protocolo frontend: <strong>{window.location.protocol}</strong></p>
            <p>Origen frontend: <strong>{window.location.origin}</strong></p>
            <p>Protocolo API: <strong>{API_URL.split('://')[0]}</strong></p>
            <button 
              onClick={() => console.log('Debugging info:', { 
                frontend: window.location.origin, 
                api: API_URL, 
                error 
              })}
              className="debug-button"
            >
              Ver más info en consola
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiTest;