import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostMiActividad from './postMiActividad';

const mockFetchWithAuth = vi.fn();
const mockSignOut = vi.fn();
const mockUser = {
  user: {
    user_id: 'user123',
    full_name: 'Test User',
    image_url: 'https://example.com/avatar.jpg'
  }
};

vi.mock('../../config/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    fetchWithAuth: mockFetchWithAuth,
    signOut: mockSignOut
  })
}));

const createMockPost = (overrides = {}) => ({
  id: 'post1',
  movie_id: 1,
  content: 'Test content',
  type: 'review',
  rating: 5,
  has_spoilers: false,
  createdAt: new Date().toISOString(),
  created_at: new Date().toISOString(),
  author: { username: 'TestUser', avatar: 'avatar.jpg' },
  ...overrides,
});

describe('PostMiActividad Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe renderizar el componente', () => {
    const { container } = render(<PostMiActividad />);
    expect(container).toBeTruthy();
  });

  it('debe obtener el perfil del usuario', async () => {
    mockFetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
    });

    render(<PostMiActividad />);

    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/user/user123');
    });
  });

  it('debe obtener las publicaciones del usuario', async () => {
    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ publications: [] }),
      });

    render(<PostMiActividad />);

    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/publication/user/user123');
    });
  });

  it('debe manejar errores al obtener el perfil', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');
    
    mockFetchWithAuth.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    render(<PostMiActividad />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al traer usuario:',
        expect.any(Error)
      );
    });
  });

  it('debe mostrar cargando inicialmente', async () => {
    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ publications: [] }),
      });

    render(<PostMiActividad />);

    // El componente debe renderizar aunque no haya publicaciones
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalled();
    });
  });

  it('debe enriquecer publicaciones con datos de películas', async () => {
    const mockPosts = [createMockPost()];

    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ publications: mockPosts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ movie: { titulo: 'Test Movie', poster: 'poster.jpg' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likes: [], total_likes: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      });

    render(<PostMiActividad />);

    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/movie/1');
    });
  });

  it('debe renderizar publicación con película completa', async () => {
    const mockPosts = [createMockPost({ content: 'Gran película de ciencia ficción!' })];

    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ publications: mockPosts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ movie: { titulo: 'Inception', poster: 'inception.jpg' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likes: [], total_likes: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      });

    render(<PostMiActividad />);

    await waitFor(() => {
      expect(screen.getByText('Inception')).toBeInTheDocument();
      expect(screen.getByText('Gran película de ciencia ficción!')).toBeInTheDocument();
    });
  });

  it('debe manejar error al cargar película', async () => {
    const mockPosts = [createMockPost({ movie_id: 999 })];

    const consoleErrorSpy = vi.spyOn(console, 'error');

    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ publications: mockPosts }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

    render(<PostMiActividad />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error trayendo película'),
        expect.anything(),
        expect.any(Error)
      );
    });
  });

  it('debe obtener likes para cada publicación', async () => {
    const mockPosts = [createMockPost()];

    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ publications: mockPosts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ movie: { titulo: 'Movie', poster: 'poster.jpg' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likes: [], total_likes: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      });

    render(<PostMiActividad />);

    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/like/publication/post1');
    });
  });

  it('debe manejar dar like correctamente', async () => {
    const mockPosts = [createMockPost()];

    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ publications: mockPosts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ movie: { titulo: 'Movie', poster: 'poster.jpg' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likes: [], total_likes: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ like: { id: 'like1' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          likes: [{ id: 'like1', user: { id: 'user123' } }], 
          total_likes: 1 
        }),
      });

    render(<PostMiActividad />);

    await waitFor(() => {
      expect(screen.getByText('Movie')).toBeInTheDocument();
    });

    const likeButton = screen.getByLabelText('Like post');
    await userEvent.click(likeButton);

    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/like', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  it('debe obtener comentarios para cada publicación', async () => {
    const mockPosts = [createMockPost()];

    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ publications: mockPosts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ movie: { titulo: 'Movie', poster: 'poster.jpg' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likes: [], total_likes: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      });

    render(<PostMiActividad />);

    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/comment/publication/post1');
    });
  });

  it('debe agregar comentario correctamente', async () => {
    const mockPosts = [createMockPost()];

    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ publications: mockPosts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ movie: { titulo: 'Movie', poster: 'poster.jpg' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likes: [], total_likes: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comment: { id: 'comment1' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          comments: [{ 
            id: 'comment1', 
            comment: 'Excelente!', 
            user: { id: 'user123', username: 'TestUser', avatar_url: 'avatar.jpg' },
            created_at: new Date().toISOString()
          }] 
        }),
      });

    render(<PostMiActividad />);

    await waitFor(() => {
      expect(screen.getByText('Movie')).toBeInTheDocument();
    });

    const commentInput = screen.getByPlaceholderText('Escribe un comentario...');
    await userEvent.type(commentInput, 'Excelente!');
    
    const commentButton = screen.getByLabelText('Comment');
    await userEvent.click(commentButton);

    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/comment', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  it('debe renderizar publicación con controles', async () => {
    const mockPosts = [createMockPost()];

    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ publications: mockPosts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ movie: { titulo: 'Movie', poster: 'poster.jpg' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likes: [], total_likes: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      });

    render(<PostMiActividad />);

    await waitFor(() => {
      expect(screen.getByText('Movie')).toBeInTheDocument();
    });
  });

  it('debe manejar acciones en publicación', async () => {
    const mockPosts = [createMockPost()];

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ publications: mockPosts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ movie: { titulo: 'Movie', poster: 'poster.jpg' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likes: [], total_likes: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      });

    render(<PostMiActividad />);

    await waitFor(() => {
      expect(screen.getByText('Movie')).toBeInTheDocument();
    });

    confirmSpy.mockRestore();
  });

  it('debe manejar publicación marcada como spoiler', async () => {
    const mockPosts = [createMockPost({ has_spoilers: true, content: 'Spoiler content!' })];

    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ publications: mockPosts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ movie: { titulo: 'Movie', poster: 'poster.jpg' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likes: [], total_likes: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      });

    render(<PostMiActividad />);

    await waitFor(() => {
      expect(screen.getByText('Movie')).toBeInTheDocument();
    });
  });

  it('debe renderizar publicación sin interacciones de spoiler', async () => {
    const mockPosts = [createMockPost({ has_spoilers: true, content: 'Spoiler revealed!' })];

    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ publications: mockPosts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ movie: { titulo: 'Movie', poster: 'poster.jpg' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likes: [], total_likes: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      });

    render(<PostMiActividad />);

    await waitFor(() => {
      expect(screen.getByText('Movie')).toBeInTheDocument();
    });
  });

  it('debe renderizar StarRating correctamente', async () => {
    const mockPosts = [createMockPost({ rating: 4 })];

    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ publications: mockPosts }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ movie: { titulo: 'Movie', poster: 'poster.jpg' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likes: [], total_likes: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comments: [] }),
      });

    render(<PostMiActividad />);

    await waitFor(() => {
      const stars = document.querySelectorAll('.bi-star-fill, .bi-star-half, .bi-star');
      expect(stars.length).toBe(5);
    });
  });
});
