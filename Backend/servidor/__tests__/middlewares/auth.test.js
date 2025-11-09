const jwt = require('jsonwebtoken');
const { authenticateJWT, attachActorFromToken, getPublicKey } = require('../../middlewares/auth');
const User = require('../../models/User');

jest.mock('jsonwebtoken');
jest.mock('../../models/User');

const mockRequest = (headers = {}, user = null) => ({
  headers,
  user
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicKey', () => {
    it('should return a PEM formatted public key', () => {
      const key = getPublicKey();
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key).toContain('-----BEGIN PUBLIC KEY-----');
    });
  });

  describe('authenticateJWT', () => {
    it('should authenticate valid JWT token', async () => {
      const mockDecoded = {
        sub: 'testuser',
        email: 'test@example.com',
        user_id: 123
      };

      jwt.verify = jest.fn().mockReturnValue(mockDecoded);

      const req = mockRequest({ authorization: 'Bearer validtoken' });
      const res = mockResponse();

      await authenticateJWT(req, res, mockNext);

      expect(req.user).toEqual(mockDecoded);
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no token provided', async () => {
      const req = mockRequest({});
      const res = mockResponse();

      await authenticateJWT(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('faltante') })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const req = mockRequest({ authorization: 'Bearer invalidtoken' });
      const res = mockResponse();

      await authenticateJWT(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('inválido') })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle Bearer token with proper format', async () => {
      const mockDecoded = { sub: 'testuser' };
      jwt.verify = jest.fn().mockReturnValue(mockDecoded);

      const req = mockRequest({ authorization: 'Bearer token123' });
      const res = mockResponse();

      await authenticateJWT(req, res, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith(
        'token123',
        expect.any(String),
        expect.objectContaining({ algorithms: ['RS256'] })
      );
    });
  });

  describe('attachActorFromToken', () => {
    it('should attach actor from token with external user_id', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        user_id: 123
      };

      const req = mockRequest({}, {
        sub: 'testuser',
        email: 'test@example.com',
        user_id: 123,
        role: 'user',
        permissions: ['read']
      });
      const res = mockResponse();

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      await attachActorFromToken(req, res, mockNext);

      expect(req.actor).toBeDefined();
      expect(req.actor.mongo_id).toBe('507f1f77bcf86cd799439011');
      expect(req.actor.username).toBe('testuser');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 if no user in request', async () => {
      const req = mockRequest({}, null);
      const res = mockResponse();

      await attachActorFromToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('No autenticado') })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found in database', async () => {
      const req = mockRequest({}, {
        sub: 'testuser',
        email: 'test@example.com',
        user_id: 123
      });
      const res = mockResponse();

      User.findOne = jest.fn().mockResolvedValue(null);

      await attachActorFromToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('usuario local') })
      );
    });

    it('should find user by username if user_id not provided', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com'
      };

      const req = mockRequest({}, {
        sub: 'testuser',
        email: 'test@example.com',
        role: 'user'
      });
      const res = mockResponse();

      User.findOne = jest.fn()
        .mockResolvedValueOnce(null) // First call (by user_id) returns null
        .mockResolvedValueOnce(mockUser); // Second call (by username) returns user

      await attachActorFromToken(req, res, mockNext);

      expect(req.actor).toBeDefined();
      expect(req.actor.username).toBe('testuser');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should find user by email if username not found', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com'
      };

      const req = mockRequest({}, {
        sub: 'otheruser',
        email: 'test@example.com',
        role: 'user'
      });
      const res = mockResponse();

      let callCount = 0;
      User.findOne = jest.fn().mockImplementation((query) => {
        callCount++;
        if (callCount === 1) return Promise.resolve(null); // username
        if (callCount === 2) return Promise.resolve(mockUser); // email
        return Promise.resolve(null);
      });

      await attachActorFromToken(req, res, mockNext);

      expect(req.actor).toBeDefined();
      expect(req.actor.email).toBe('test@example.com');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const req = mockRequest({}, { sub: 'testuser' });
      const res = mockResponse();

      User.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

      await attachActorFromToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Error') })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
