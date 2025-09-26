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

  // Función para probar la conexión a la API
  const testApiConnection = async () => {
    setStatus('loading');
    setError(null);
    
    try {
      // Intenta hacer una solicitud al endpoint /health o /api/health
      const data = await apiClient.get('/health');
      setResponse(data);
      setStatus('success');
    } catch (err) {
      console.error('Error al probar la API:', err);
      setError(err.message);
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
          <p>Asegúrate de que:</p>
          <ul>
            <li>El backend está corriendo en Elastic Beanstalk</li>
            <li>CORS está correctamente configurado para permitir tu dominio CloudFront</li>
            <li>La URL de la API es correcta: {API_URL}</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default ApiTest;