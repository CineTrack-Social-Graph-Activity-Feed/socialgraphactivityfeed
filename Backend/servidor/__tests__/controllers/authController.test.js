const authController = require('../../controllers/authController');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const { getPublicKey } = require('../../middlewares/auth');

jest.mock('../../models/User');
jest.mock('jsonwebtoken');
jest.mock('../../middlewares/auth');

// Mock node-fetch
const mockFetch = jest.fn();
jest.mock('node-fetch', () => mockFetch);

// Also mock global.fetch
global.fetch = mockFetch;

const request = require('supertest');
const express = require('express');

describe('Auth Controller', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock middleware for /me endpoint
    app.use((req, res, next) => {
      if (req.path === '/api/auth/me') {
        req.user = { sub: 'testuser', email: 'test@example.com', user_id: 123 };
      }
      next();
    });
    
    app.post('/api/auth/login', authController.login);
    app.post('/api/auth/refresh', authController.refresh);
    app.get('/api/auth/me', authController.me);
    
    mockFetch.mockClear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if username is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'test123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('username');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('password');
    });

    it('should return 400 if both username and password are missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should login successfully and sync user', async () => {
      const mockTokenData = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        token_type: 'bearer'
      };

      const mockProfile = {
        sub: 'testuser',
        email: 'test@example.com',
        user_id: 123
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        user_id: 123,
        username: 'testuser',
        email: 'test@example.com'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockTokenData
      });

      getPublicKey.mockReturnValue('mock_public_key');
      jwt.verify.mockReturnValue(mockProfile);
      User.findOneAndUpdate = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
    });

    it('should handle authentication error from external service', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' })
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'wronguser',
          password: 'wrongpass'
        });

      expect(response.status).toBe(401);
    });

    it('should handle server error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 400 if refresh_token is missing', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('refresh_token');
    });

    it('should refresh token successfully', async () => {
      const mockTokenData = {
        access_token: 'new_access_token',
        token_type: 'bearer'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockTokenData
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refresh_token: 'old_refresh_token'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
    });

    it('should handle refresh error from external service', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid refresh token' })
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refresh_token: 'invalid_token'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user from token', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('sub', 'testuser');
    });
  });
});
