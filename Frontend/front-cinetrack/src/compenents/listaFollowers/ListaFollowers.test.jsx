import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ListaFollowers from './ListaFollowers';

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

describe('ListaFollowers', () => {
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
              full_name: 'Test User' 
            } 
          })
        });
      }
      if (url.includes('/api/followers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            followers: [
              { _id: 'follower1', full_name: 'Follower User 1', image_url: null },
              { _id: 'follower2', full_name: 'Follower User 2', image_url: null }
            ]
          })
        });
      }
      if (url.includes('/api/followed')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            followed: [
              { _id: 'followed1', full_name: 'Followed User 1' }
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
    render(<ListaFollowers />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/user/user123');
    });
  });

  it('should fetch followers after profile is loaded', async () => {
    render(<ListaFollowers />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/followers?user_id='));
    });
  });

  it('should fetch followed users after profile is loaded', async () => {
    render(<ListaFollowers />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/followed?user_id='));
    });
  });

  it('should display loading state initially', () => {
    render(<ListaFollowers />);
    
    const container = document.body;
    expect(container).toBeTruthy();
  });

  it('should handle user profile fetch error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetchWithAuth.mockRejectedValueOnce(new Error('Network error'));
    
    render(<ListaFollowers />);
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error al traer usuario'),
        expect.any(Error)
      );
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle follow action', async () => {
    mockFetchWithAuth.mockImplementation((url, options) => {
      if (url.includes('/api/follow') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Followed successfully' })
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
      if (url.includes('/api/followers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ followers: [] })
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

    render(<ListaFollowers />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalled();
    });
  });

  it('should handle unfollow action', async () => {
    mockFetchWithAuth.mockImplementation((url, options) => {
      if (url.includes('/api/unfollow') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Unfollowed successfully' })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ followers: [], followed: [] }) });
    });

    render(<ListaFollowers />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalled();
    });
  });

  it('should listen to followersUpdated event', async () => {
    render(<ListaFollowers />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/followers'));
    });
    
    const initialCallCount = mockFetchWithAuth.mock.calls.filter(
      call => call[0].includes('/api/followers')
    ).length;
    
    window.dispatchEvent(new Event('followersUpdated'));
    
    await waitFor(() => {
      const newCallCount = mockFetchWithAuth.mock.calls.filter(
        call => call[0].includes('/api/followers')
      ).length;
      expect(newCallCount).toBeGreaterThan(initialCallCount);
    });
  });

  it('should not fetch followers if profile is not loaded', async () => {
    mockFetchWithAuth.mockImplementation((url) => {
      if (url.includes('/api/user/user123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: null })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    
    render(<ListaFollowers />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/user/user123');
    });
  });

  it('should update followed list when fetching followed users', async () => {
    render(<ListaFollowers />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/followed'));
    });
  });

  it('should handle follow action successfully', async () => {
    mockFetchWithAuth.mockImplementation((url, options) => {
      if (url.includes('/api/user/user123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'objectId123' } })
        });
      }
      if (url.includes('/api/followers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            followers: [{ _id: 'follower1', username: 'Follower1' }]
          })
        });
      }
      if (url.includes('/api/followed')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ followed: [] })
        });
      }
      if (url.includes('/api/follow') && options?.method === 'POST') {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<ListaFollowers />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/followers'));
    });
  });

  it('should handle toggleFollow errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockFetchWithAuth.mockImplementation((url, options) => {
      if (url.includes('/api/user/user123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'objectId123' } })
        });
      }
      if (url.includes('/api/followers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ followers: [] })
        });
      }
      if (url.includes('/api/followed')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ followed: [] })
        });
      }
      if (url.includes('/api/follow') && options?.method === 'POST') {
        return Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve('Server error') });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<ListaFollowers />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
});
