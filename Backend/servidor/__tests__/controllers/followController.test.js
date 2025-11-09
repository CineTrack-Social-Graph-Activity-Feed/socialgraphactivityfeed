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

      expect(res.status).toHaveBeenCalledWith(201);
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

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 400 if follower_user_id is missing', async () => {
      const req = mockRequest({
        followed_user_id: '507f1f77bcf86cd799439012'
      });
      const res = mockResponse();

      await followController.followUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if followed_user_id is missing', async () => {
      const req = mockRequest({
        follower_user_id: '507f1f77bcf86cd799439011'
      });
      const res = mockResponse();

      await followController.followUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('unfollowUser', () => {
    it('should unfollow a user successfully', async () => {
      const mockFollow = {
        _id: 'followId',
        follower_user_id: '507f1f77bcf86cd799439011',
        followed_user_id: '507f1f77bcf86cd799439012'
      };

      Follow.findOne = jest.fn().mockResolvedValue(mockFollow);
      Follow.findOneAndDelete = jest.fn().mockResolvedValue(mockFollow);
      
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

      expect(res.status).toHaveBeenCalledWith(200);
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
            current_page: 2,
            total_pages: 2
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
            current_page: 2,
            total_pages: 5
          })
        })
      );
    });
  });

  describe('getFeed', () => {
    it('should return user feed successfully', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser'
      };

      const mockFollows = [
        { followed_user_id: '507f1f77bcf86cd799439012' }
      ];

      const mockUsers = [
        { _id: '507f1f77bcf86cd799439012', user_id: 2 }
      ];

      const mockAuthors = [
        { _id: '507f1f77bcf86cd799439012', user_id: 2, username: 'author', avatar_url: null }
      ];

      const mockPublications = [
        { 
          _id: 'pub1', 
          user_id: 2, 
          type: 'review',
          created_at: new Date()
        }
      ];

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      Follow.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockFollows)
      });

      User.find = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(mockUsers)
        })
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(mockAuthors)
        });

      Publication.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockPublications)
            })
          })
        })
      });

      Publication.countDocuments = jest.fn().mockResolvedValue(1);

      const req = { query: { user_id: '507f1f77bcf86cd799439011', page: '1', limit: '20' } };
      const res = mockResponse();

      await followController.getFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          feed: expect.any(Array),
          pagination: expect.any(Object)
        })
      );
    });

    it('should return 400 if user_id is missing', async () => {
      const req = { query: {} };
      const res = mockResponse();

      await followController.getFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle empty feed', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser'
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      Follow.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      });

      User.find = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue([])
        })
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue([])
        });

      Publication.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });

      Publication.countDocuments = jest.fn().mockResolvedValue(0);

      const req = { query: { user_id: '507f1f77bcf86cd799439011' } };
      const res = mockResponse();

      await followController.getFeed(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          feed: expect.any(Array),
          pagination: expect.objectContaining({
            total_items: 0
          })
        })
      );
    });
  });
});
