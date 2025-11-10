const User = require('../../models/User');
const userController = require('../../controllers/userController');

// Mock del modelo User
jest.mock('../../models/User');

// Mock de req y res
const mockRequest = (body = {}, params = {}, query = {}) => ({
  body,
  params,
  query,
  actor: { mongo_id: '507f1f77bcf86cd799439011' }
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('UserController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        avatar_url: 'http://example.com/avatar.jpg',
        created_at: new Date(),
        save: jest.fn().mockResolvedValue(true)
      };

      User.mockImplementation(() => mockUser);

      const req = mockRequest({
        username: 'testuser',
        email: 'test@example.com',
        avatar_url: 'http://example.com/avatar.jpg'
      });
      const res = mockResponse();

      await userController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Usuario creado exitosamente'
        })
      );
    });

    it('should return 400 if username is missing', async () => {
      const req = mockRequest({ email: 'test@example.com' });
      const res = mockResponse();

      await userController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'username y email son requeridos'
        })
      );
    });

    it('should return 400 if email is missing', async () => {
      const req = mockRequest({ username: 'testuser' });
      const res = mockResponse();

      await userController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid email format', async () => {
      const req = mockRequest({
        username: 'testuser',
        email: 'invalid-email'
      });
      const res = mockResponse();

      await userController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Formato de email inválido'
        })
      );
    });

    it('should return 409 if email already exists', async () => {
      const mockUser = {
        save: jest.fn().mockRejectedValue({
          code: 11000,
          keyPattern: { email: 1 }
        })
      };

      User.mockImplementation(() => mockUser);

      const req = mockRequest({
        username: 'testuser',
        email: 'test@example.com'
      });
      const res = mockResponse();

      await userController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('ya está en uso')
        })
      );
    });
  });

  describe('getUser', () => {
    it('should return user by user_id', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        user_id: '12345',
        username: 'testuser',
        email: 'test@example.com'
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const req = mockRequest({}, { user_id: '12345' });
      const res = mockResponse();

      await userController.getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ username: 'testuser' })
        })
      );
    });

    it('should return 404 if user not found', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      const req = mockRequest({}, { user_id: '99999' });
      const res = mockResponse();

      await userController.getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { username: 'user1', email: 'user1@example.com' },
        { username: 'user2', email: 'user2@example.com' }
      ];

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockUsers)
        })
      });

      const req = mockRequest();
      const res = mockResponse();

      await userController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        user_id: '12345',
        username: 'testuser',
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const req = mockRequest({ username: 'updateduser' }, { user_id: '12345' });
      const res = mockResponse();

      await userController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if user not found', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      const req = mockRequest({ username: 'updateduser' }, { user_id: '99999' });
      const res = mockResponse();

      await userController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      User.findOneAndDelete = jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser'
      });

      const req = mockRequest({}, { user_id: '12345' });
      const res = mockResponse();

      await userController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if user not found', async () => {
      User.findOneAndDelete = jest.fn().mockResolvedValue(null);

      const req = mockRequest({}, { user_id: '99999' });
      const res = mockResponse();

      await userController.deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('checkUserExists', () => {
    it('should return true if user exists', async () => {
      User.findOne = jest.fn().mockResolvedValue({ username: 'testuser' });

      const req = mockRequest({}, { user_id: '12345' });
      const res = mockResponse();

      await userController.checkUserExists(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ exists: true })
      );
    });

    it('should return false if user does not exist', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      const req = mockRequest({}, { user_id: '99999' });
      const res = mockResponse();

      await userController.checkUserExists(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ exists: false })
      );
    });
  });

  describe('searchUsers', () => {
    it('should search users by username', async () => {
      const mockUsers = [
        { _id: '1', username: 'testuser1', email: 'user1@example.com' },
        { _id: '2', username: 'testuser2', email: 'user2@example.com' }
      ];

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockUsers)
            })
          })
        })
      });

      User.countDocuments = jest.fn().mockResolvedValue(2);

      const req = mockRequest({}, {}, { q: 'test' });
      const res = mockResponse();

      await userController.searchUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ users: expect.any(Array) })
      );
    });

    it('should return 400 if search query is missing', async () => {
      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await userController.searchUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle database errors in searchUsers', async () => {
      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockRejectedValue(new Error('Database error'))
            })
          })
        })
      });

      const req = mockRequest({}, {}, { q: 'test' });
      const res = mockResponse();

      await userController.searchUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Error interno del servidor' })
      );
    });
  });

  describe('updateUser - additional tests', () => {
    it('should return 400 for invalid email format in update', async () => {
      const req = mockRequest(
        { email: 'invalid-email' },
        { user_id: '507f1f77bcf86cd799439011' }
      );
      const res = mockResponse();

      await userController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Formato de email inválido' })
      );
    });

    it('should return 404 if user to update is not found', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);

      const req = mockRequest(
        { username: 'newname' },
        { user_id: '507f1f77bcf86cd799439011' }
      );
      const res = mockResponse();

      await userController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Usuario no encontrado' })
      );
    });

    it('should handle duplicate email error in update', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'old@example.com',
        save: jest.fn().mockRejectedValue({
          code: 11000,
          keyPattern: { email: 1 }
        })
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const req = mockRequest(
        { email: 'existing@example.com' },
        { user_id: '507f1f77bcf86cd799439011' }
      );
      const res = mockResponse();

      await userController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'El email ya está en uso' })
      );
    });

    it('should update user with avatar_url set to null', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com',
        avatar_url: 'http://old-avatar.com',
        created_at: new Date(),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const req = mockRequest(
        { avatar_url: null },
        { user_id: '507f1f77bcf86cd799439011' }
      );
      const res = mockResponse();

      await userController.updateUser(req, res);

      expect(mockUser.avatar_url).toBeNull();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if user_id is missing in update', async () => {
      const req = mockRequest({ username: 'newname' }, {});
      const res = mockResponse();

      await userController.updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'user_id es requerido' })
      );
    });
  });

  describe('getUser - additional tests', () => {
    it('should return 400 if user_id is missing', async () => {
      const req = mockRequest({}, {});
      const res = mockResponse();

      await userController.getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'user_id es requerido' })
      );
    });

    it('should handle database errors in getUser', async () => {
      User.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

      const req = mockRequest({}, { user_id: '507f1f77bcf86cd799439011' });
      const res = mockResponse();

      await userController.getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Error interno del servidor' })
      );
    });
  });

  describe('getAllUsers', () => {
    it('should get all users with pagination', async () => {
      const mockUsers = [
        { _id: '1', username: 'user1', email: 'user1@example.com' },
        { _id: '2', username: 'user2', email: 'user2@example.com' }
      ];

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers)
      });

      const req = mockRequest({}, {}, { page: '1', limit: '2' });
      const res = mockResponse();

      await userController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          users: expect.any(Array)
        })
      );
    });

    it('should handle database errors in getAllUsers', async () => {
      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await userController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Error interno del servidor' })
      );
    });
  });
});
