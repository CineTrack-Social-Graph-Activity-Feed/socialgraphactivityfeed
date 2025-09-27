import { useState } from 'react';
import { API_URL } from '../config/api';
import { useUser } from '../../UserContex';

function ApiDebugger() {
  const { userId } = useUser();
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [testType, setTestType] = useState('like');
  const [targetId, setTargetId] = useState('65f5e1d77c65c827d8536abc'); // ID de MongoDB de ejemplo
  
  const runTest = async () => {
    setLoading(true);
    setResult('Ejecutando prueba...');
    
    try {
      let response;
      let data;
      
      if (testType === 'like') {
        // Test para crear like
        response = await fetch(`${API_URL}/api/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            target_id: targetId,
            target_type: 'review'
          })
        });
        
        data = await response.json();
        
      } else if (testType === 'comment') {
        // Test para crear comentario
        response = await fetch(`${API_URL}/api/comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            target_id: targetId,
            target_type: 'review',
            comment: 'Esto es un comentario de prueba: ' + new Date().toISOString()
          })
        });
        
        data = await response.json();
        
      } else if (testType === 'get-likes') {
        // Test para obtener likes
        response = await fetch(`${API_URL}/api/like/publication/${targetId}`);
        data = await response.json();
        
      } else if (testType === 'get-comments') {
        // Test para obtener comentarios
        response = await fetch(`${API_URL}/api/comment/publication/${targetId}`);
        data = await response.json();
      }
      
      setResult(JSON.stringify({
        ok: response.ok,
        status: response.status,
        data: data
      }, null, 2));
      
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9' 
    }}>
      <h3>API Debugger</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <label>
          Test Type:
          <select 
            value={testType} 
            onChange={(e) => setTestType(e.target.value)}
            style={{ margin: '0 10px' }}
          >
            <option value="like">Create Like</option>
            <option value="comment">Create Comment</option>
            <option value="get-likes">Get Likes</option>
            <option value="get-comments">Get Comments</option>
          </select>
        </label>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <label>
          Target ID (MongoDB ObjectID):
          <input 
            type="text" 
            value={targetId} 
            onChange={(e) => setTargetId(e.target.value)} 
            style={{ 
              margin: '0 10px',
              width: '300px',
              padding: '4px'
            }}
          />
        </label>
      </div>
      
      <button 
        onClick={runTest} 
        disabled={loading}
        style={{
          padding: '8px 16px',
          backgroundColor: loading ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Ejecutando...' : 'Ejecutar Test'}
      </button>
      
      <div style={{ marginTop: '20px' }}>
        <h4>Resultado:</h4>
        <pre style={{
          backgroundColor: '#f5f5f5',
          padding: '10px',
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '300px'
        }}>
          {result}
        </pre>
      </div>
    </div>
  );
}

export default ApiDebugger;