import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApiDebugger from './ApiDebugger';
import { API_URL } from '../config/api';

const mockUserId = 'user123';

vi.mock('../../UserContex', () => ({
  useUser: () => ({
    userId: mockUserId
  })
}));

global.fetch = vi.fn();

describe('ApiDebugger Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe renderizar el componente correctamente', () => {
    render(<ApiDebugger />);
    
    expect(screen.getByText('API Debugger')).toBeInTheDocument();
    expect(screen.getByLabelText(/Test Type:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target ID/i)).toBeInTheDocument();
    expect(screen.getByText('Ejecutar Test')).toBeInTheDocument();
  });

  it('debe tener las opciones de test type correctas', () => {
    render(<ApiDebugger />);
    
    const select = screen.getByLabelText(/Test Type:/i);
    expect(select).toBeInTheDocument();
    
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('Create Like');
    expect(options[1]).toHaveTextContent('Create Comment');
    expect(options[2]).toHaveTextContent('Get Likes');
    expect(options[3]).toHaveTextContent('Get Comments');
  });

  it('debe cambiar el test type cuando se selecciona', async () => {
    render(<ApiDebugger />);
    
    const select = screen.getByLabelText(/Test Type:/i);
    expect(select.value).toBe('like');
    
    await userEvent.selectOptions(select, 'comment');
    expect(select.value).toBe('comment');
    
    await userEvent.selectOptions(select, 'get-likes');
    expect(select.value).toBe('get-likes');
  });

  it('debe permitir cambiar el target ID', async () => {
    render(<ApiDebugger />);
    
    const input = screen.getByLabelText(/Target ID/i);
    expect(input.value).toBeTruthy();
    
    await userEvent.clear(input);
    await userEvent.type(input, 'newTargetId123');
    
    expect(input.value).toBe('newTargetId123');
  });

  it('debe ejecutar test de crear like correctamente', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ like: { id: 'like1', user_id: mockUserId } })
    });

    render(<ApiDebugger />);
    
    const button = screen.getByText('Ejecutar Test');
    await userEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/like`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining(mockUserId)
        })
      );
    });

    await waitFor(() => {
      const resultText = screen.getByText(/"ok": true/);
      expect(resultText).toBeInTheDocument();
    });
  });

  it('debe ejecutar test de crear comentario correctamente', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ comment: { id: 'comment1', comment: 'Test comment' } })
    });

    render(<ApiDebugger />);
    
    const select = screen.getByLabelText(/Test Type:/i);
    await userEvent.selectOptions(select, 'comment');
    
    const button = screen.getByText('Ejecutar Test');
    await userEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/comment`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('comentario de prueba')
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/"ok": true/)).toBeInTheDocument();
    });
  });

  it('debe ejecutar test de obtener likes correctamente', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ likes: [], total_likes: 0 })
    });

    render(<ApiDebugger />);
    
    const select = screen.getByLabelText(/Test Type:/i);
    await userEvent.selectOptions(select, 'get-likes');
    
    const targetInput = screen.getByLabelText(/Target ID/i);
    const targetId = targetInput.value;
    
    const button = screen.getByText('Ejecutar Test');
    await userEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/like/publication/${targetId}`
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/"ok": true/)).toBeInTheDocument();
    });
  });

  it('debe ejecutar test de obtener comentarios correctamente', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ comments: [], total_comments: 0 })
    });

    render(<ApiDebugger />);
    
    const select = screen.getByLabelText(/Test Type:/i);
    await userEvent.selectOptions(select, 'get-comments');
    
    const targetInput = screen.getByLabelText(/Target ID/i);
    const targetId = targetInput.value;
    
    const button = screen.getByText('Ejecutar Test');
    await userEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/api/comment/publication/${targetId}`
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/"ok": true/)).toBeInTheDocument();
    });
  });

  it('debe mostrar "Ejecutando..." mientras carga', async () => {
    global.fetch.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        status: 200,
        json: async () => ({})
      }), 100))
    );

    render(<ApiDebugger />);
    
    const button = screen.getByText('Ejecutar Test');
    await userEvent.click(button);

    expect(screen.getByText('Ejecutando...')).toBeInTheDocument();
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Ejecutar Test')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('debe manejar errores de red', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ApiDebugger />);
    
    const button = screen.getByText('Ejecutar Test');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Error: Network error/)).toBeInTheDocument();
    });
  });

  it('debe mostrar respuesta de error del servidor', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' })
    });

    render(<ApiDebugger />);
    
    const button = screen.getByText('Ejecutar Test');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/"ok": false/)).toBeInTheDocument();
      expect(screen.getByText(/404/)).toBeInTheDocument();
    });
  });

  it('debe formatear el JSON correctamente en el resultado', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ test: 'data', nested: { value: 123 } })
    });

    render(<ApiDebugger />);
    
    const button = screen.getByText('Ejecutar Test');
    await userEvent.click(button);

    await waitFor(() => {
      const pre = screen.getByText(/"test": "data"/).closest('pre');
      expect(pre).toHaveTextContent('"nested"');
      expect(pre).toHaveTextContent('"value": 123');
    });
  });

  it('debe limpiar el estado al hacer un nuevo test', async () => {
    // Primer test
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ result: 'first' })
    });

    render(<ApiDebugger />);
    
    const button = screen.getByText('Ejecutar Test');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/"result": "first"/)).toBeInTheDocument();
    });

    // Segundo test
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ result: 'second' })
    });

    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/"result": "second"/)).toBeInTheDocument();
      expect(screen.queryByText(/"result": "first"/)).not.toBeInTheDocument();
    });
  });

  it('debe incluir user_id en las peticiones POST', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({})
    });

    render(<ApiDebugger />);
    
    const button = screen.getByText('Ejecutar Test');
    await userEvent.click(button);

    await waitFor(() => {
      const call = global.fetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.user_id).toBe(mockUserId);
    });
  });

  it('debe incluir timestamp en comentarios', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({})
    });

    render(<ApiDebugger />);
    
    const select = screen.getByLabelText(/Test Type:/i);
    await userEvent.selectOptions(select, 'comment');
    
    const button = screen.getByText('Ejecutar Test');
    await userEvent.click(button);

    await waitFor(() => {
      const call = global.fetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.comment).toContain('comentario de prueba');
      expect(body.comment).toMatch(/\d{4}-\d{2}-\d{2}/); // ISO date format
    });
  });
});
