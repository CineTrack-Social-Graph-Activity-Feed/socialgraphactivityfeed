import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Post from './Post';

const mockFetchWithAuth = vi.fn();
const mockSignOut = vi.fn();
const mockUser = {
  user: {
    user_id: 'user123',
    full_name: 'Test User',
    image_url: 'https://example.com/avatar.jpg'
  }
};

vi.mock('../../../config/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    fetchWithAuth: mockFetchWithAuth,
    signOut: mockSignOut
  })
}));

describe('Post Component - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Renderizado básico y carga inicial', () => {
    it('debe renderizar el componente Post con loading', () => {
      const { container } = render(<Post />);
      expect(container).toBeTruthy();
      // Puede mostrar 'Cargando actividad...' o 'No hay actividad para mostrar por el momento!'
      const loading = screen.queryByText(/Cargando actividad.../i);
      const noActivity = screen.queryByText(/No hay actividad para mostrar por el momento!/i);
      expect(loading || noActivity).toBeTruthy();
    });

    it('debe obtener el perfil del usuario al montar', async () => {
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
      });

      render(<Post />);

      await waitFor(() => {
  expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/user/user123'));
      });
    });

    it('debe obtener el feed después de cargar el perfil', async () => {
      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'objectId123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: [] }),
        });

      render(<Post />);

      await waitFor(() => {
        expect(mockFetchWithAuth).toHaveBeenCalledWith(
          expect.stringContaining('/api/feed?user_id=')
        );
      });
    });

    it('debe manejar errores al obtener el perfil', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      render(<Post />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error al traer usuario:',
          expect.any(Error)
        );
      });
    });

    it('debe escuchar el evento followersUpdated', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      render(<Post />);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'followersUpdated',
        expect.any(Function)
      );
    });

    it('debe mostrar mensaje cuando no hay actividad', async () => {
      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: [] }),
        });

      render(<Post />);

      await waitFor(() => {
        expect(screen.getByText(/No hay actividad para mostrar/i)).toBeInTheDocument();
      });
    });
  });

  describe('Enriquecimiento de posts con películas', () => {
    it('debe enriquecer posts con datos de películas', async () => {
      const mockPosts = [
        {
          _doc: {
            _id: 'post1',
            movie_id: 1,
            content: 'Gran película!',
            type: 'review',
            rating: 5,
            has_spoilers: false,
            createdAt: new Date().toISOString(),
          },
          author: { username: 'User1', avatar_url: 'avatar1.jpg' },
        },
      ];

      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: mockPosts }),
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

      render(<Post />);

      await waitFor(() => {
  expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/movie/1'));
      });
    });

    it('debe renderizar post con película completa', async () => {
      const mockPosts = [
        {
          _doc: {
            _id: 'post1',
            movie_id: 1,
            content: 'Excelente película de ciencia ficción!',
            type: 'review',
            rating: 4.5,
            has_spoilers: false,
            createdAt: new Date().toISOString(),
          },
          author: { username: 'TestUser', avatar_url: 'avatar.jpg' },
        },
      ];

      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: mockPosts }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ movie: { titulo: 'The Matrix', poster: 'matrix.jpg' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ likes: [], total_likes: 0 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ comments: [] }),
        });

      render(<Post />);

      await waitFor(() => {
        expect(screen.getByText('The Matrix')).toBeInTheDocument();
        expect(screen.getByText('Excelente película de ciencia ficción!')).toBeInTheDocument();
        expect(screen.getByText('TestUser')).toBeInTheDocument();
      });
    });

    it('debe manejar error al cargar película', async () => {
      const mockPosts = [
        {
          _doc: {
            _id: 'post1',
            movie_id: 999,
            content: 'Test',
            type: 'review',
            rating: 5,
            has_spoilers: false,
            createdAt: new Date().toISOString(),
          },
          author: { username: 'User1', avatar_url: 'avatar.jpg' },
        },
      ];

      const consoleErrorSpy = vi.spyOn(console, 'error');

      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: mockPosts }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      render(<Post />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error trayendo película'),
          expect.anything(),
          expect.any(Error)
        );
      });
    });
  });

  describe('Funcionalidad de Likes', () => {
    it('debe obtener likes para cada post', async () => {
      const mockPosts = [
        {
          _doc: {
            _id: 'post1',
            movie_id: 1,
            content: 'Test',
            type: 'review',
            rating: 5,
            has_spoilers: false,
            createdAt: new Date().toISOString(),
          },
          author: { username: 'User1', avatar_url: 'avatar.jpg' },
        },
      ];

      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: mockPosts }),
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

      render(<Post />);

      await waitFor(() => {
  expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/like/publication/post1'));
      });
    });

    it('debe manejar dar like correctamente', async () => {
      const mockPosts = [
        {
          _doc: {
            _id: 'post1',
            movie_id: 1,
            content: 'Test',
            type: 'review',
            rating: 5,
            has_spoilers: false,
            createdAt: new Date().toISOString(),
          },
          author: { username: 'User1', avatar_url: 'avatar.jpg' },
        },
      ];

      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: mockPosts }),
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

      render(<Post />);

      await waitFor(() => {
        expect(screen.getByText('Movie')).toBeInTheDocument();
      });

      const likeButton = screen.getByLabelText('Like post');
      await userEvent.click(likeButton);

      await waitFor(() => {
        expect(mockFetchWithAuth).toHaveBeenCalledWith(
          expect.stringContaining('/api/like'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('debe manejar quitar like correctamente', async () => {
      const mockPosts = [
        {
          _doc: {
            _id: 'post1',
            movie_id: 1,
            content: 'Test',
            type: 'review',
            rating: 5,
            has_spoilers: false,
            createdAt: new Date().toISOString(),
          },
          author: { username: 'User1', avatar_url: 'avatar.jpg' },
        },
      ];

      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: mockPosts }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ movie: { titulo: 'Movie', poster: 'poster.jpg' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            likes: [{ id: 'like1', user: { id: 'user123' } }], 
            total_likes: 1 
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ comments: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ likes: [], total_likes: 0 }),
        });

      render(<Post />);

      await waitFor(() => {
        expect(screen.getByText('Movie')).toBeInTheDocument();
      });

      const likeButton = screen.getByLabelText('Like post');
      await userEvent.click(likeButton);

      await waitFor(() => {
        expect(mockFetchWithAuth).toHaveBeenCalledWith(
          expect.stringContaining('/api/like/like1'),
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });

    it('debe manejar error al dar like', async () => {
      const mockPosts = [
        {
          _doc: {
            _id: 'post1',
            movie_id: 1,
            content: 'Test',
            type: 'review',
            rating: 5,
            has_spoilers: false,
            createdAt: new Date().toISOString(),
          },
          author: { username: 'User1', avatar_url: 'avatar.jpg' },
        },
      ];

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: mockPosts }),
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
          ok: false,
          status: 500,
        });

      render(<Post />);

      await waitFor(() => {
        expect(screen.getByText('Movie')).toBeInTheDocument();
      });

      const likeButton = screen.getByLabelText('Like post');
      await userEvent.click(likeButton);

      // Con optimistic updates, el error se loguea pero no muestra alert
      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Funcionalidad de Comentarios', () => {
    it('debe obtener comentarios para cada post', async () => {
      const mockPosts = [
        {
          _doc: {
            _id: 'post1',
            movie_id: 1,
            content: 'Test',
            type: 'review',
            rating: 5,
            has_spoilers: false,
            createdAt: new Date().toISOString(),
          },
          author: { username: 'User1', avatar_url: 'avatar.jpg' },
        },
      ];

      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: mockPosts }),
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

      render(<Post />);

      await waitFor(() => {
  expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/comment/publication/post1'));
      });
    });

    it('debe agregar comentario correctamente', async () => {
      const mockPosts = [
        {
          _doc: {
            _id: 'post1',
            movie_id: 1,
            content: 'Test',
            type: 'review',
            rating: 5,
            has_spoilers: false,
            createdAt: new Date().toISOString(),
          },
          author: { username: 'User1', avatar_url: 'avatar.jpg' },
        },
      ];

      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: mockPosts }),
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
              comment: 'Gran reseña!', 
              user: { id: 'user123', username: 'TestUser', avatar_url: 'avatar.jpg' },
              created_at: new Date().toISOString()
            }] 
          }),
        });

      render(<Post />);

      await waitFor(() => {
        expect(screen.getByText('Movie')).toBeInTheDocument();
      });

      const commentInput = screen.getByPlaceholderText('Escribe un comentario...');
      await userEvent.type(commentInput, 'Gran reseña!');
      
      const commentButton = screen.getByLabelText('Comment');
      await userEvent.click(commentButton);

      await waitFor(() => {
        expect(mockFetchWithAuth).toHaveBeenCalledWith(
          expect.stringContaining('/api/comment'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('debe eliminar comentario correctamente', async () => {
      const mockPosts = [
        {
          _doc: {
            _id: 'post1',
            movie_id: 1,
            content: 'Test',
            type: 'review',
            rating: 5,
            has_spoilers: false,
            createdAt: new Date().toISOString(),
          },
          author: { username: 'User1', avatar_url: 'avatar.jpg' },
        },
      ];

      const mockComment = {
        id: 'comment1',
        comment: 'Mi comentario',
        user: { id: 'user123', username: 'TestUser', avatar_url: 'avatar.jpg' },
        created_at: new Date().toISOString(),
      };

      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: mockPosts }),
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
          json: async () => ({ comments: [mockComment] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ comments: [] }),
        });

      render(<Post />);

      await waitFor(() => {
        expect(screen.getByText('Mi comentario')).toBeInTheDocument();
      });

      const deleteButton = screen.getByLabelText('Delete comment');
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockFetchWithAuth).toHaveBeenCalledWith(
          expect.stringContaining('/api/comment/comment1'),
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });

    it('debe manejar error al agregar comentario', async () => {
      const mockPosts = [
        {
          _doc: {
            _id: 'post1',
            movie_id: 1,
            content: 'Test',
            type: 'review',
            rating: 5,
            has_spoilers: false,
            createdAt: new Date().toISOString(),
          },
          author: { username: 'User1', avatar_url: 'avatar.jpg' },
        },
      ];

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: mockPosts }),
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
          ok: false,
          status: 500,
        });

      render(<Post />);

      await waitFor(() => {
        expect(screen.getByText('Movie')).toBeInTheDocument();
      });

      const commentInput = screen.getByPlaceholderText('Escribe un comentario...');
      await userEvent.type(commentInput, 'Test comment');
      
      const commentButton = screen.getByLabelText('Comment');
      await userEvent.click(commentButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });

      alertSpy.mockRestore();
    });

    it('debe mostrar "Ver todos los comentarios" cuando hay más de 2', async () => {
      const mockPosts = [
        {
          _doc: {
            _id: 'post1',
            movie_id: 1,
            content: 'Test',
            type: 'review',
            rating: 5,
            has_spoilers: false,
            createdAt: new Date().toISOString(),
          },
          author: { username: 'User1', avatar_url: 'avatar.jpg' },
        },
      ];

      const mockComments = [
        { id: 'c1', comment: 'Comment 1', user: { id: 'u1', username: 'User1', avatar_url: 'a1.jpg' }, created_at: new Date().toISOString() },
        { id: 'c2', comment: 'Comment 2', user: { id: 'u2', username: 'User2', avatar_url: 'a2.jpg' }, created_at: new Date().toISOString() },
        { id: 'c3', comment: 'Comment 3', user: { id: 'u3', username: 'User3', avatar_url: 'a3.jpg' }, created_at: new Date().toISOString() },
      ];

      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: mockPosts }),
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
          json: async () => ({ comments: mockComments }),
        });

      render(<Post />);

      await waitFor(() => {
        expect(screen.getByText('Ver todos los comentarios')).toBeInTheDocument();
      });

      const viewAllButton = screen.getByText('Ver todos los comentarios');
      await userEvent.click(viewAllButton);

      await waitFor(() => {
        expect(screen.getByText('Ver menos comentarios')).toBeInTheDocument();
      });
    });
  });

  describe('Funcionalidad de Spoilers', () => {
    it('debe mostrar overlay de spoiler para posts marcados', async () => {
      const mockPosts = [
        {
          _doc: {
            _id: 'post1',
            movie_id: 1,
            content: 'Spoiler alert!',
            type: 'review',
            rating: 5,
            has_spoilers: true,
            createdAt: new Date().toISOString(),
          },
          author: { username: 'User1', avatar_url: 'avatar.jpg' },
        },
      ];

      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: mockPosts }),
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

      render(<Post />);

      await waitFor(() => {
        expect(screen.getByText(/Posible spoiler!/i)).toBeInTheDocument();
      });
    });

    it('debe revelar post con spoiler al hacer click', async () => {
      const mockPosts = [
        {
          _doc: {
            _id: 'post1',
            movie_id: 1,
            content: 'Spoiler alert content!',
            type: 'review',
            rating: 5,
            has_spoilers: true,
            createdAt: new Date().toISOString(),
          },
          author: { username: 'User1', avatar_url: 'avatar.jpg' },
        },
      ];

      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: mockPosts }),
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

      render(<Post />);

      await waitFor(() => {
        expect(screen.getByText(/Posible spoiler!/i)).toBeInTheDocument();
      });

      const spoilerButton = screen.getByText(/Posible spoiler!/i).closest('button');
      await userEvent.click(spoilerButton);

      await waitFor(() => {
        expect(screen.getByText('Spoiler alert content!')).toBeInTheDocument();
      });
    });
  });

  describe('Renderizado de estrellas', () => {
    it('debe renderizar StarRating con rating de 3.5', async () => {
      const mockPosts = [
        {
          _doc: {
            _id: 'post1',
            movie_id: 1,
            content: 'Test',
            type: 'review',
            rating: 3.5,
            has_spoilers: false,
            createdAt: new Date().toISOString(),
          },
          author: { username: 'User1', avatar_url: 'avatar.jpg' },
        },
      ];

      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: mockPosts }),
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

      render(<Post />);

      await waitFor(() => {
        const stars = document.querySelectorAll('.bi-star-fill, .bi-star-half, .bi-star');
        expect(stars.length).toBe(5);
      });
    });

    it('debe renderizar StarRating con rating de 5', async () => {
      const mockPosts = [
        {
          _doc: {
            _id: 'post1',
            movie_id: 1,
            content: 'Test',
            type: 'review',
            rating: 5,
            has_spoilers: false,
            createdAt: new Date().toISOString(),
          },
          author: { username: 'User1', avatar_url: 'avatar.jpg' },
        },
      ];

      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: mockPosts }),
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

      render(<Post />);

      await waitFor(() => {
        const fullStars = document.querySelectorAll('.bi-star-fill');
        expect(fullStars.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Manejo de eventos', () => {
    it('debe actualizar feed cuando se dispara followersUpdated', async () => {
      mockFetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: 'user123', username: 'TestUser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ feed: [] }),
        });

      render(<Post />);

      await waitFor(() => {
        expect(mockFetchWithAuth).toHaveBeenCalledWith(
          expect.stringContaining('/api/feed')
        );
      });

      window.dispatchEvent(new Event('followersUpdated'));

      await waitFor(() => {
        const feedCalls = mockFetchWithAuth.mock.calls.filter(
          call => call[0]?.includes('/api/feed')
        );
        expect(feedCalls.length).toBeGreaterThan(1);
      });
    });

    it('debe limpiar event listener al desmontar', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<Post />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'followersUpdated',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
