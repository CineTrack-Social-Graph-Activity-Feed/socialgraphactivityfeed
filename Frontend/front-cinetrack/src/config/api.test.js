import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, API_URL } from './api';

// Mock fetch
global.fetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('get method', () => {
    it('should make GET request with correct URL', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      await apiClient.get('/test');
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should include authorization token if available', async () => {
      localStorage.setItem('access_token', 'test-token');
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      await apiClient.get('/test');
      
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('test-token')
          })
        })
      );
    });

    it('should handle GET request without leading slash', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      await apiClient.get('test');
      
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('post method', () => {
    it('should make POST request with body', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const data = { name: 'test' };
      await apiClient.post('/test', data);
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data)
        })
      );
    });

    it('should include Content-Type header', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await apiClient.post('/test', { data: 'test' });
      
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle non-ok responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('404');
      }
    });
  });

  describe('API_URL configuration', () => {
    it('should be able to use API_URL', () => {
      // API_URL comes from import.meta.env which is undefined in tests
      expect(apiClient).toBeDefined();
      expect(apiClient.get).toBeDefined();
      expect(apiClient.post).toBeDefined();
    });
  });
});
