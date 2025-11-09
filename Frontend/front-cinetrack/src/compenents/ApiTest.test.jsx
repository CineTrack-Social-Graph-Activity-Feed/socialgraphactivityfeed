import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApiTest from './ApiTest';
import { apiClient, API_URL } from '../config/api';

vi.mock('../config/api', () => ({
  apiClient: {
    get: vi.fn()
  },
  API_URL: 'http://localhost:3000'
}));

global.fetch = vi.fn();

describe('ApiTest Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
    delete window.location;
    window.location = { protocol: 'http:', origin: 'http://localhost:5173' };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe renderizar el componente correctamente', () => {
    render(<ApiTest />);
    
    expect(screen.getByText('Test de Conexión API')).toBeInTheDocument();
    expect(screen.getByText(/URL de la API:/)).toBeInTheDocument();
    expect(screen.getByText('Probar Conexión')).toBeInTheDocument();
  });

  it('debe mostrar la URL de la API', () => {
    render(<ApiTest />);
    
    expect(screen.getByText(API_URL)).toBeInTheDocument();
  });

  it('debe cambiar a estado loading al hacer click', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: () => null
      }
    });

    apiClient.get.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ status: 'ok' }), 100))
    );

    render(<ApiTest />);
    
    const button = screen.getByText('Probar Conexión');
    await userEvent.click(button);

    expect(screen.getByText('Probando...')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('debe hacer test de conexión exitoso', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: (header) => {
          const headers = {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET, POST',
            'access-control-allow-headers': 'Content-Type'
          };
          return headers[header];
        }
      }
    });

    apiClient.get.mockResolvedValueOnce({ status: 'healthy', message: 'API is running' });

    render(<ApiTest />);
    
    const button = screen.getByText('Probar Conexión');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Conexión exitosa')).toBeInTheDocument();
    });

    expect(apiClient.get).toHaveBeenCalledWith('/health');
    expect(screen.getByText(/"status": "healthy"/)).toBeInTheDocument();
  });

  it('debe manejar error de conexión', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    // Ambos intentos deben fallar
    apiClient.get.mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockRejectedValueOnce(new Error('Second attempt failed'));

    render(<ApiTest />);
    
    const button = screen.getByText('Probar Conexión');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Error de conexión')).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();
  });

  it('debe intentar ruta alternativa /api/health si falla la primera', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Primera llamada falla
    apiClient.get.mockRejectedValueOnce(new Error('Failed'))
      // Segunda llamada exitosa
      .mockResolvedValueOnce({ status: 'ok' });

    render(<ApiTest />);
    
    const button = screen.getByText('Probar Conexión');
    await userEvent.click(button);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/health');
      expect(apiClient.get).toHaveBeenCalledWith('/api/health');
    });

    await waitFor(() => {
      expect(screen.getByText('Conexión exitosa')).toBeInTheDocument();
    });
  });

  it('debe detectar problema de mixed content', async () => {
    window.location = { 
      protocol: 'https:', 
      origin: 'https://myapp.com' 
    };

    global.fetch.mockRejectedValueOnce(new Error('Mixed content'));
    // Ambos intentos deben fallar
    apiClient.get.mockRejectedValueOnce(new Error('Mixed content blocked'))
      .mockRejectedValueOnce(new Error('Second attempt failed'));

    render(<ApiTest />);
    
    const button = screen.getByText('Probar Conexión');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Error de conexión')).toBeInTheDocument();
    });

    expect(screen.getByText(/Detectado problema de contenido mixto/)).toBeInTheDocument();
    expect(screen.getByText(/Tu frontend está cargado sobre HTTPS/)).toBeInTheDocument();
  });

  it('debe mostrar información de depuración en caso de error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Error'));
    // Ambos intentos deben fallar
    apiClient.get.mockRejectedValueOnce(new Error('Connection failed'))
      .mockRejectedValueOnce(new Error('Second attempt failed'));

    render(<ApiTest />);
    
    const button = screen.getByText('Probar Conexión');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Error de conexión')).toBeInTheDocument();
    });

    expect(screen.getByText(/Información para depuración:/)).toBeInTheDocument();
    expect(screen.getByText(/Protocolo frontend:/)).toBeInTheDocument();
    expect(screen.getByText(/Origen frontend:/)).toBeInTheDocument();
    expect(screen.getByText(/Protocolo API:/)).toBeInTheDocument();
  });

  it('debe mostrar recomendaciones de CORS en caso de error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('CORS error'));
    // Ambos intentos deben fallar
    apiClient.get.mockRejectedValueOnce(new Error('CORS error'))
      .mockRejectedValueOnce(new Error('Second attempt failed'));

    render(<ApiTest />);
    
    const button = screen.getByText('Probar Conexión');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Error de conexión')).toBeInTheDocument();
    });

    expect(screen.getByText(/CORS está correctamente configurado/)).toBeInTheDocument();
  });

  it('debe tener botón de debug que loguea info', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    global.fetch.mockRejectedValueOnce(new Error('Error'));
    // Ambos intentos deben fallar
    apiClient.get.mockRejectedValueOnce(new Error('Error'))
      .mockRejectedValueOnce(new Error('Second attempt failed'));

    render(<ApiTest />);
    
    const testButton = screen.getByText('Probar Conexión');
    await userEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText('Error de conexión')).toBeInTheDocument();
    });

    const debugButton = screen.getByText('Ver más info en consola');
    await userEvent.click(debugButton);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Debugging info:',
      expect.objectContaining({
        frontend: expect.any(String),
        api: API_URL,
        error: expect.any(String)
      })
    );

    consoleSpy.mockRestore();
  });

  it('debe hacer petición directa con fetch para obtener headers CORS', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: (header) => {
          if (header === 'access-control-allow-origin') return '*';
          if (header === 'access-control-allow-methods') return 'GET, POST';
          if (header === 'access-control-allow-headers') return 'Content-Type';
          return null;
        }
      }
    });

    apiClient.get.mockResolvedValueOnce({ status: 'ok' });

    render(<ApiTest />);
    
    const button = screen.getByText('Probar Conexión');
    await userEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/health`,
        expect.objectContaining({
          method: 'GET',
          mode: 'cors'
        })
      );
    });
  });

  it('debe formatear JSON de respuesta correctamente', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => null }
    });

    const mockResponse = {
      status: 'healthy',
      timestamp: '2024-01-01',
      details: { database: 'connected', cache: 'active' }
    };

    apiClient.get.mockResolvedValueOnce(mockResponse);

    render(<ApiTest />);
    
    const button = screen.getByText('Probar Conexión');
    await userEvent.click(button);

    await waitFor(() => {
      const pre = screen.getByText(/"status": "healthy"/).closest('pre');
      expect(pre).toHaveTextContent('"timestamp"');
      expect(pre).toHaveTextContent('"details"');
      expect(pre).toHaveTextContent('"database": "connected"');
    });
  });

  it('debe mostrar sugerencias para resolver mixed content', async () => {
    window.location = { 
      protocol: 'https:', 
      origin: 'https://myapp.com' 
    };

    global.fetch.mockRejectedValueOnce(new Error('Mixed content'));
    // Ambos intentos deben fallar
    apiClient.get.mockRejectedValueOnce(new Error('Mixed content'))
      .mockRejectedValueOnce(new Error('Second attempt failed'));

    render(<ApiTest />);
    
    const button = screen.getByText('Probar Conexión');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Error de conexión')).toBeInTheDocument();
    });

    expect(screen.getByText(/Configurar HTTPS para tu backend/)).toBeInTheDocument();
    expect(screen.getByText(/Crear una distribución CloudFront/)).toBeInTheDocument();
    expect(screen.getByText(/Usar una proxy inverso/)).toBeInTheDocument();
  });

  it('debe deshabilitar botón durante la carga', async () => {
    global.fetch.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        status: 200,
        headers: { get: () => null }
      }), 100))
    );

    apiClient.get.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ status: 'ok' }), 100))
    );

    render(<ApiTest />);
    
    const button = screen.getByText('Probar Conexión');
    expect(button).not.toBeDisabled();
    
    await userEvent.click(button);
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    }, { timeout: 2000 });
  });

  it('debe loguear información de headers CORS en consola', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: (header) => {
          if (header === 'access-control-allow-origin') return '*';
          return null;
        }
      }
    });

    apiClient.get.mockResolvedValueOnce({ status: 'ok' });

    render(<ApiTest />);
    
    const button = screen.getByText('Probar Conexión');
    await userEvent.click(button);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Encabezados CORS:',
        expect.objectContaining({
          'access-control-allow-origin': '*'
        })
      );
    });

    consoleSpy.mockRestore();
  });

  it('debe loguear errores en consola', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    apiClient.get.mockRejectedValueOnce(new Error('API error'));

    render(<ApiTest />);
    
    const button = screen.getByText('Probar Conexión');
    await userEvent.click(button);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error en fetch directo:',
        expect.any(Error)
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al probar la API:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
