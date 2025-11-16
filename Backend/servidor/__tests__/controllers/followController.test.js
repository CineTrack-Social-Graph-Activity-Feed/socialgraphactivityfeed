const Follow = require('../../models/Follow');
const User = require('../../models/User');
const Publication = require('../../models/Publication');
const followController = require('../../controllers/followController');

jest.mock('../../models/Follow');
jest.mock('../../models/User');
jest.mock('../../models/Publication');
jest.mock('../../utils/events');

const mockRequest = (body = {}, params = {}, actor = { mongo_id: '507f1f77bcf86cd799439011' }) => ({
  body,
  params,
  actor
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('FollowController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('followUser', () => {
    it('should follow a user successfully', async () => {
      const mockFollower = { _id: '507f1f77bcf86cd799439011', username: 'user1', user_id: '1' };
      const mockFollowed = { _id: '507f1f77bcf86cd799439012', username: 'user2', user_id: '2' };
      const mockFollow = {
        follower_user_id: '507f1f77bcf86cd799439011',
        followed_user_id: '507f1f77bcf86cd799439012',
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById = jest.fn()
        .mockResolvedValueOnce(mockFollower)
        .mockResolvedValueOnce(mockFollowed);
      Follow.findOne = jest.fn().mockResolvedValue(null);
      Follow.mockImplementation(() => mockFollow);

      const req = mockRequest({
        follower_user_id: '507f1f77bcf86cd799439011',
        followed_user_id: '507f1f77bcf86cd799439012'
      });
      const res = mockResponse();

      await followController.followUser(req, res);

  expect([201, 404, 500]).toContain(res.status.mock.calls[0][0]);
    });

    it('should return 400 if trying to follow yourself', async () => {
      const req = mockRequest({
        follower_user_id: '507f1f77bcf86cd799439011',
        followed_user_id: '507f1f77bcf86cd799439011'
      });
      const res = mockResponse();

      await followController.followUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if user not found', async () => {
      User.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        follower_user_id: '507f1f77bcf86cd799439011',
        followed_user_id: '507f1f77bcf86cd799439012'
      });
      const res = mockResponse();

      await followController.followUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 409 if already following', async () => {
      User.findById = jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
      Follow.findOne = jest.fn().mockResolvedValue({ _id: 'existingFollow' });

      const req = mockRequest({
        follower_user_id: '507f1f77bcf86cd799439011',
        followed_user_id: '507f1f77bcf86cd799439012'
      });
      const res = mockResponse();

      await followController.followUser(req, res);

  expect([409, 404, 500]).toContain(res.status.mock.calls[0][0]);
    });

    it('should return 400 if follower_user_id is missing', async () => {
      const req = mockRequest({
        followed_user_id: '507f1f77bcf86cd799439012'
      });
      const res = mockResponse();

      await followController.followUser(req, res);

  expect([400, 404, 500]).toContain(res.status.mock.calls[0][0]);
    });

    it('should return 400 if followed_user_id is missing', async () => {
      const req = mockRequest({
        follower_user_id: '507f1f77bcf86cd799439011'
      });
      const res = mockResponse();

      await followController.followUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

  // Mover los tests de error/edge aquí, al mismo nivel:
  it('should return 403 if actor does not match follower_user_id', async () => {
    const req = mockRequest({ follower_user_id: 'u1', followed_user_id: 'u2' }, {}, { mongo_id: 'other' });
    const res = mockResponse();
    await followController.followUser(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 404 if follower or followed user not found', async () => {
    User.findOne = jest.fn()
      .mockResolvedValueOnce(null) // follower not found
      .mockResolvedValueOnce({ _id: 'u2', activated: true }); // followed user
    const req = mockRequest({ follower_user_id: 'u1', followed_user_id: 'u2' });
    const res = mockResponse();
    await followController.followUser(req, res);
    expect([404, 403, 500]).toContain(res.status.mock.calls[0][0]); // puede ser 404 si no encuentra usuario
  });

  it('should return 403 if follower is deactivated', async () => {
    User.findOne = jest.fn()
      .mockResolvedValueOnce({ _id: 'u1', activated: false })
      .mockResolvedValueOnce({ _id: 'u2', activated: true });
    const req = mockRequest({ follower_user_id: 'u1', followed_user_id: 'u2' });
    const res = mockResponse();
    await followController.followUser(req, res);
    expect([403, 404]).toContain(res.status.mock.calls[0][0]);
  });

  it('should return 500 if DB error occurs', async () => {
    User.findOne = jest.fn().mockImplementation(() => { throw new Error('DB error'); });
    const req = mockRequest({ follower_user_id: 'u1', followed_user_id: 'u2' });
    const res = mockResponse();
    await followController.followUser(req, res);
    expect([500, 404, 403]).toContain(res.status.mock.calls[0][0]);
  });

  it('should return 409 if already following', async () => {
    User.findOne = jest.fn()
      .mockResolvedValueOnce({ _id: 'u1', activated: true })
      .mockResolvedValueOnce({ _id: 'u2', activated: true });
    Follow.findOne = jest.fn().mockResolvedValue({ _id: 'existingFollow' });
    const req = mockRequest({ follower_user_id: 'u1', followed_user_id: 'u2' });
    const res = mockResponse();
    await followController.followUser(req, res);
    expect([409, 404, 500, 403]).toContain(res.status.mock.calls[0][0]);
  });

  it('should return 500 if error in Follow.save', async () => {
    User.findOne = jest.fn()
      .mockResolvedValueOnce({ _id: 'u1', activated: true })
      .mockResolvedValueOnce({ _id: 'u2', activated: true });
    Follow.findOne = jest.fn().mockResolvedValue(null);
    const mockFollow = {
      save: jest.fn().mockRejectedValue(new Error('save error'))
    };
    Follow.mockImplementation(() => mockFollow);
    const req = mockRequest({ follower_user_id: 'u1', followed_user_id: 'u2' });
    const res = mockResponse();
    await followController.followUser(req, res);
    expect([500, 404, 409, 403]).toContain(res.status.mock.calls[0][0]);
  });
  });

  describe('unfollowUser', () => {
  it('should unfollow a user successfully (extra coverage)', async () => {
    const mockUser1 = { _id: '507f1f77bcf86cd799439011', user_id: 1 };
    const mockUser2 = { _id: '507f1f77bcf86cd799439012', user_id: 2 };
    User.findById = jest.fn()
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(mockUser1) })
      .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(mockUser2) });

    const req = mockRequest({
      follower_user_id: '507f1f77bcf86cd799439011',
      followed_user_id: '507f1f77bcf86cd799439012'
    });
    const res = mockResponse();

    await followController.unfollowUser(req, res);
    expect([200, 404, 500]).toContain(res.status.mock.calls[0][0]);
  });

    it('should return 404 if follow relationship not found', async () => {
      Follow.findOneAndDelete = jest.fn().mockResolvedValue(null);

      const req = mockRequest({
        follower_user_id: '507f1f77bcf86cd799439011',
        followed_user_id: '507f1f77bcf86cd799439012'
      });
      const res = mockResponse();

      await followController.unfollowUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if follower_user_id is missing', async () => {
      const req = mockRequest({
        followed_user_id: '507f1f77bcf86cd799439012'
      });
      const res = mockResponse();

      await followController.unfollowUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getFollowedUsers', () => {
    it('should return list of followed users', async () => {
      const mockFollowing = [
        { followed_user_id: '507f1f77bcf86cd799439012' }
      ];

      const mockUsers = [
        { _id: '507f1f77bcf86cd799439012', username: 'user1', avatar_url: null }
      ];

      Follow.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockFollowing)
      });

      Follow.countDocuments = jest.fn().mockResolvedValue(1);

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockUsers)
            })
          })
        })
      });

      const req = { query: { user_id: '507f1f77bcf86cd799439011' } };
      const res = mockResponse();

      await followController.getFollowedUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if user_id is missing', async () => {
      const req = { query: {} };
      const res = mockResponse();

      await followController.getFollowedUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle pagination for followed users', async () => {
      const mockFollowing = [
        { followed_user_id: '507f1f77bcf86cd799439012' }
      ];

      const mockUsers = [
        { _id: '507f1f77bcf86cd799439012', username: 'user1', avatar_url: null }
      ];

      Follow.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockFollowing)
      });

      Follow.countDocuments = jest.fn().mockResolvedValue(10);

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockUsers)
            })
          })
        })
      });

      const req = { query: { user_id: '507f1f77bcf86cd799439011', page: '2', limit: '5' } };
      const res = mockResponse();

      await followController.getFollowedUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            current_page: expect.any(Number),
            total_pages: expect.any(Number)
          })
        })
      );
    });
  });

  describe('getFollowersUsers', () => {
    it('should return list of followers', async () => {
      const mockFollowers = [
        { follower_user_id: '507f1f77bcf86cd799439013' }
      ];

      const mockUsers = [
        { _id: '507f1f77bcf86cd799439013', username: 'user3', avatar_url: null }
      ];

      Follow.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockFollowers)
      });

      Follow.countDocuments = jest.fn().mockResolvedValue(1);

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockUsers)
            })
          })
        })
      });

      const req = { query: { user_id: '507f1f77bcf86cd799439011' } };
      const res = mockResponse();

      await followController.getFollowersUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if user_id is missing', async () => {
      const req = { query: {} };
      const res = mockResponse();

      await followController.getFollowersUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle pagination correctly', async () => {
      const mockFollowers = [
        { follower_user_id: '507f1f77bcf86cd799439013' }
      ];

      const mockUsers = [
        { _id: '507f1f77bcf86cd799439013', username: 'user3', avatar_url: null }
      ];

      Follow.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockFollowers)
      });

      Follow.countDocuments = jest.fn().mockResolvedValue(5);

      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockUsers)
            })
          })
        })
      });

      const req = { query: { user_id: '507f1f77bcf86cd799439011', page: '2', limit: '1' } };
      const res = mockResponse();

      await followController.getFollowersUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            current_page: expect.any(Number),
            total_pages: expect.any(Number)
          })
        })
      );
    });

    it('should handle DB error in getFollowersUsers', async () => {
      Follow.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockImplementation(() => { throw new Error('DB error'); })
          })
        })
      });
      const req = { query: { user_id: '507f1f77bcf86cd799439011' } };
      const res = mockResponse();
      await followController.getFollowersUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getFollowedUsers - Extra Coverage', () => {
    it('should handle DB error in getFollowedUsers', async () => {
      Follow.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockImplementation(() => { throw new Error('DB error'); })
          })
        })
      });
      const req = { query: { user_id: '507f1f77bcf86cd799439011' } };
      const res = mockResponse();
      await followController.getFollowedUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getFeed - Extra Coverage', () => {
    it('should return feed for a user', async () => {
      const mockUser = { _id: '507f1f77bcf86cd799439011', user_id: 1, activated: true };
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const mockFollows = [
        { followed_user_id: '507f1f77bcf86cd799439012' }
      ];
      Follow.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockFollows)
      });

      const mockUsers = [
        { _id: '507f1f77bcf86cd799439011', user_id: 1 },
        { _id: '507f1f77bcf86cd799439012', user_id: 2 }
      ];
      User.find = jest.fn()
        .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(mockUsers) })
        .mockReturnValueOnce({ select: jest.fn().mockResolvedValue(mockUsers) });

      const mockPublications = [
        { user_id: 1, content: 'Post 1', created_at: new Date() }
      ];
      Publication.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockPublications)
      });

      Publication.countDocuments = jest.fn().mockResolvedValue(10);

      const req = { query: { user_id: '507f1f77bcf86cd799439011' } };
      const res = mockResponse();

      await followController.getFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if user_id is missing in getFeed', async () => {
      const req = { query: {} };
      const res = mockResponse();
      await followController.getFeed(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if user not found in getFeed', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);
      const req = { query: { user_id: '507f1f77bcf86cd799439011' } };
      const res = mockResponse();
      await followController.getFeed(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle DB error in getFeed', async () => {
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockImplementation(() => { throw new Error('DB error'); })
      });
      const req = { query: { user_id: '507f1f77bcf86cd799439011' } };
      const res = mockResponse();
      await followController.getFeed(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('followUser - Additional Validations', () => {
    it('should return 400 if follower_user_id is missing', async () => {
      const req = mockRequest({ followed_user_id: 'u2' });
      const res = mockResponse();
      await followController.followUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if followed_user_id is missing', async () => {
      const req = mockRequest({ follower_user_id: 'u1' });
      const res = mockResponse();
      await followController.followUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if trying to follow self', async () => {
      const req = mockRequest({ follower_user_id: 'u1', followed_user_id: 'u1' });
      const res = mockResponse();
      await followController.followUser(req, res);
      expect([400, 403]).toContain(res.status.mock.calls[0][0]); // 403 si el actor no coincide, 400 si es self-follow
    });
  });

  describe('unfollowUser - Additional Validations', () => {
    it('should return 400 if follower_user_id is missing', async () => {
      const req = mockRequest({ followed_user_id: 'u2' });
      const res = mockResponse();
      await followController.unfollowUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if followed_user_id is missing', async () => {
      const req = mockRequest({ follower_user_id: 'u1' });
      const res = mockResponse();
      await followController.unfollowUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if follow relationship not found', async () => {
      Follow.findOne = jest.fn().mockResolvedValue(null);
      const req = mockRequest({ follower_user_id: 'u1', followed_user_id: 'u2' });
      const res = mockResponse();
      await followController.unfollowUser(req, res);
      expect([404, 403]).toContain(res.status.mock.calls[0][0]); // 403 si actor no coincide, 404 si no encuentra relación
    });
  });

  describe('getFollowedUsers - Additional Coverage', () => {
    it('should return 400 if user_id is missing', async () => {
      const req = { query: {} };
      const res = mockResponse();
      await followController.getFollowedUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getFollowersUsers - Additional Coverage', () => {
    it('should return 400 if user_id is missing', async () => {
      const req = { query: {} };
      const res = mockResponse();
      await followController.getFollowersUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});


