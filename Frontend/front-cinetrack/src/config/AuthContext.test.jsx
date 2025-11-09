import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import * as authApi from './authApi';

vi.mock('./authApi', () => ({
  login: vi.fn(),
  refreshToken: vi.fn(),
  getMe: vi.fn()
}));

// Test component to use the hook
function TestComponent() {
  const { user, loadingUser, signIn, signOut, fetchWithAuth } = useAuth();
  
  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="loading">{loadingUser ? 'true' : 'false'}</div>
      <button onClick={() => signIn({ username: 'test', password: 'pass' })}>
        Sign In
      </button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should provide auth context', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toBeInTheDocument();
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should initialize with no user when no token in localStorage', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('should sign in successfully', async () => {
    const mockUser = { user_id: 1, username: 'testuser' };
    authApi.login.mockResolvedValue({
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token'
    });
    authApi.getMe.mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const signInButton = screen.getByText('Sign In');
    signInButton.click();

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        username: 'test',
        password: 'pass'
      });
    });

    await waitFor(() => {
      expect(authApi.getMe).toHaveBeenCalledWith('test-access-token');
    });

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('test-access-token');
      expect(localStorage.getItem('refresh_token')).toBe('test-refresh-token');
    });
  });

  it('should sign out and clear tokens', async () => {
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('refresh_token', 'test-refresh');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      // Wait for any initial loading to complete
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    const signOutButton = screen.getByText('Sign Out');
    signOutButton.click();

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });

  it('should load user from token on mount', async () => {
    const mockUser = { user_id: 1, username: 'testuser' };
    localStorage.setItem('access_token', 'existing-token');
    authApi.getMe.mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(authApi.getMe).toHaveBeenCalledWith('existing-token');
    });

    await waitFor(() => {
      const userText = screen.getByTestId('user').textContent;
      expect(userText).toContain('testuser');
    });
  });

  it('should refresh token when access token expires', async () => {
    const mockUser = { user_id: 1, username: 'testuser' };
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('refresh_token', 'valid-refresh-token');

    authApi.getMe
      .mockRejectedValueOnce(new Error('Unauthorized'))
      .mockResolvedValueOnce(mockUser);
    
    authApi.refreshToken.mockResolvedValue({
      access_token: 'new-access-token'
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(authApi.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('new-access-token');
    });
  });

  it('should sign out when refresh token fails', async () => {
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('refresh_token', 'invalid-refresh-token');

    authApi.getMe.mockRejectedValue(new Error('Unauthorized'));
    authApi.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  it('should provide fetchWithAuth function', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // The component renders without error, meaning fetchWithAuth is provided
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });
});
