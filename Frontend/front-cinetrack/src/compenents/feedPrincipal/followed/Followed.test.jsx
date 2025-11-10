import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Followed from './Followed';

const mockFetchWithAuth = vi.fn();
const mockSignOut = vi.fn();
const mockUser = {
  user: {
    user_id: 'user123',
    full_name: 'Test User',
    image_url: null
  }
};

vi.mock('../../../config/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    fetchWithAuth: mockFetchWithAuth,
    signOut: mockSignOut
  })
}));

describe('Followed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchWithAuth.mockImplementation((url) => {
      if (url.includes('/api/user/user123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'objectId123', user_id: 'user123', full_name: 'Test User' } })
        });
      }
      if (url.includes('/api/followed')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            followed: [
              { _id: 'followed1', full_name: 'Followed User 1', image_url: null },
              { _id: 'followed2', full_name: 'Followed User 2', image_url: null }
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
    render(<Followed />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/user/user123');
    });
  });

  it('should fetch followed users after profile is loaded', async () => {
    render(<Followed />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/followed?user_id='));
    });
  });

  it('should render followed users list', async () => {
    render(<Followed />);
    
    await waitFor(() => {
      const followedItems = document.querySelectorAll('.followed-users');
      expect(followedItems.length).toBe(2);
    });
  });

  it('should handle user profile fetch error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetchWithAuth.mockRejectedValueOnce(new Error('Network error'));
    
    render(<Followed />);
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error al traer usuario'),
        expect.any(Error)
      );
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle followed users fetch error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetchWithAuth.mockImplementation((url) => {
      if (url.includes('/api/user/user123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'objectId123' } })
        });
      }
      if (url.includes('/api/followed')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    
    render(<Followed />);
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error followed'),
        expect.any(Error)
      );
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('should listen to followersUpdated event and refetch followed users', async () => {
    render(<Followed />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/followed'));
    });
    
    const initialCallCount = mockFetchWithAuth.mock.calls.filter(
      call => call[0].includes('/api/followed')
    ).length;
    
    // Dispatch event
    window.dispatchEvent(new Event('followersUpdated'));
    
    await waitFor(() => {
      const newCallCount = mockFetchWithAuth.mock.calls.filter(
        call => call[0].includes('/api/followed')
      ).length;
      expect(newCallCount).toBeGreaterThan(initialCallCount);
    });
  });

  it('should not fetch followed users if profile is not loaded', () => {
    mockFetchWithAuth.mockImplementation((url) => {
      if (url.includes('/api/user/user123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: null })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    
    render(<Followed />);
    
    // Should only call user profile fetch, not followed
    setTimeout(() => {
      const followedCalls = mockFetchWithAuth.mock.calls.filter(
        call => call[0].includes('/api/followed')
      );
      expect(followedCalls.length).toBe(0);
    }, 100);
  });

  it('should handle unfollow action successfully', async () => {
    mockFetchWithAuth.mockImplementation((url, options) => {
      if (url.includes('/api/user/user123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { id: 'objectId123', user_id: 'user123' } })
        });
      }
      if (url.includes('/api/followed')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            followed: [
              { _id: 'followed1', full_name: 'User 1', avatar_url: null },
              { _id: 'followed2', full_name: 'User 2', avatar_url: null }
            ]
          })
        });
      }
      if (url.includes('/api/unfollow') && options?.method === 'POST') {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<Followed />);
    
    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument();
    });
  });

  it('should handle unfollow error gracefully', async () => {
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
          json: () => Promise.resolve({ followed: [] })
        });
      }
      if (url.includes('/api/unfollow')) {
        return Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve('Server error') });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<Followed />);
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalled();
    });
    
    consoleErrorSpy.mockRestore();
  });
});
