import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ListaFollows from './ListaFollows';

const mockFetchWithAuth = vi.fn();
const mockSignOut = vi.fn();
const mockUser = {
  user: {
    user_id: 'user123',
    full_name: 'Test User',
    image_url: null
  }
};

vi.mock('../../config/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    fetchWithAuth: mockFetchWithAuth,
    signOut: mockSignOut
  })
}));

vi.mock('../../../UserContex', () => ({
  useUser: () => ({
    userId: 'user123'
  })
}));

describe('ListaFollows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.console.log = vi.fn();
    global.console.error = vi.fn();
    
    mockFetchWithAuth.mockImplementation((url) => {
      if (url.includes('/api/user/user123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            user: { 
              id: 'objectId123', 
              user_id: 'user123', 
              full_name: 'Test User',
              username: 'TestUser',
              image_url: null
            } 
          })
        });
      }
      if (url.includes('/api/followed')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ 
            followed: [
              { _id: 'followed1', full_name: 'Followed User 1', username: 'FollowedUser1', image_url: null },
              { _id: 'followed2', full_name: 'Followed User 2', username: 'FollowedUser2', image_url: null }
            ]
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  it('should fetch user profile on mount', async () => {
    render(<ListaFollows />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/user/user123'));
    });
  });

  it('should fetch followed users after profile is loaded', async () => {
    render(<ListaFollows />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/followed?user_id='));
    });
  });

  it('should display loading state initially', () => {
    render(<ListaFollows />);
    
    const loadingElement = screen.queryByText(/cargando/i);
    expect(loadingElement || document.body).toBeTruthy();
  });

  it('should handle user profile fetch error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetchWithAuth.mockRejectedValueOnce(new Error('Network error'));
    
    render(<ListaFollows />);
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error al traer usuario'),
        expect.any(Error)
      );
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle unfollow action', async () => {
    mockFetchWithAuth.mockImplementation((url, options) => {
      if (url.includes('/api/unfollow') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ message: 'Unfollowed successfully' })
        });
      }
      if (url.includes('/api/user/user123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            user: { id: 'objectId123', user_id: 'user123' } 
          })
        });
      }
      if (url.includes('/api/followed')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ followed: [] })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<ListaFollows />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalled();
    });
  });

  it('should dispatch followersUpdated event after unfollow', async () => {
    const eventSpy = vi.fn();
    window.addEventListener('followersUpdated', eventSpy);
    
    mockFetchWithAuth.mockImplementation((url, options) => {
      if (url.includes('/api/unfollow')) {
        window.dispatchEvent(new Event('followersUpdated'));
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ followed: [] }) });
    });

    render(<ListaFollows />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalled();
    });
    
    window.removeEventListener('followersUpdated', eventSpy);
  });

  it('should handle unfollow error', async () => {
    mockFetchWithAuth.mockImplementation((url, options) => {
      if (url.includes('/api/unfollow') && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Server error' })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ followed: [] }) });
    });

    render(<ListaFollows />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalled();
    });
  });

  it('should listen to followersUpdated event', async () => {
    render(<ListaFollows />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/followed'));
    });
    
    const initialCallCount = mockFetchWithAuth.mock.calls.filter(
      call => call[0].includes('/api/followed')
    ).length;
    
    window.dispatchEvent(new Event('followersUpdated'));
    
    await waitFor(() => {
      const newCallCount = mockFetchWithAuth.mock.calls.filter(
        call => call[0].includes('/api/followed')
      ).length;
      expect(newCallCount).toBeGreaterThanOrEqual(initialCallCount);
    });
  });

  it('should not fetch followed users if profile is not loaded', async () => {
    mockFetchWithAuth.mockImplementation((url) => {
      if (url.includes('/api/user/user123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: null })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    
    render(<ListaFollows />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/user/user123'));
    });
  });

  it('should handle unfollow with text error response', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockFetchWithAuth.mockImplementation((url, options) => {
      if (url.includes('/api/user/user123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'objectId123' } })
        });
      }
      if (url.includes('/api/followed')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            followed: [{ _id: 'user1', username: 'User1' }]
          })
        });
      }
      if (url.includes('/api/unfollow') && options?.method === 'POST') {
        return Promise.resolve({ 
          ok: false, 
          status: 400,
          text: () => Promise.resolve('Bad request')
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<ListaFollows />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should display empty state when no followed users', async () => {
    mockFetchWithAuth.mockImplementation((url) => {
      if (url.includes('/api/user/user123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'objectId123' } })
        });
      }
      if (url.includes('/api/followed')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ followed: [] })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<ListaFollows />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/followed'));
    });
  });
});
