import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, refreshToken, getMe } from './authApi';

global.fetch = vi.fn();

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await login({ username: 'testuser', password: 'password123' });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error on invalid credentials', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(login({ username: 'wrong', password: 'wrong' }))
        .rejects
        .toThrow('Credenciales inválidas');
    });

    it('should send credentials as URLSearchParams', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      await login({ username: 'testuser', password: 'pass123' });

      const callArgs = fetch.mock.calls[0][1];
      expect(callArgs.body).toBeInstanceOf(URLSearchParams);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        access_token: 'new-access-token'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await refreshToken('old-refresh-token');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: 'old-refresh-token' })
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when refresh fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(refreshToken('invalid-token'))
        .rejects
        .toThrow('No se pudo refrescar el token');
    });
  });

  describe('getMe', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      const result = await getMe('valid-access-token');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer valid-access-token' }
        })
      );

      expect(result).toEqual(mockUser);
    });

    it('should throw error when unauthorized', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(getMe('invalid-token'))
        .rejects
        .toThrow('No autorizado');
    });

    it('should include Bearer token in Authorization header', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      await getMe('my-token');

      const callArgs = fetch.mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBe('Bearer my-token');
    });
  });
});
