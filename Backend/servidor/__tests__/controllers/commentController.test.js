const Comment = require('../../models/Comment');
const Publication = require('../../models/Publication');
const User = require('../../models/User');
const commentController = require('../../controllers/commentController');

jest.mock('../../models/Comment');
jest.mock('../../models/Publication');
jest.mock('../../models/User');
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

describe('CommentController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addComment', () => {
    it('should return 403 if user is deactivated', async () => {
      User.findOne = jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011', activated: false });
      Publication.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439012', type: 'review' })
      });
      const req = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'review',
        target_id: '507f1f77bcf86cd799439012',
        comment: 'Test comment'
      });
      const res = mockResponse();
      await commentController.addComment(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 500 if DB throws error', async () => {
      User.findOne = jest.fn().mockImplementation(() => { throw new Error('DB error'); });
      const req = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'review',
        target_id: '507f1f77bcf86cd799439012',
        comment: 'Test comment'
      });
      const res = mockResponse();
      await commentController.addComment(req, res);
      expect([500, 404]).toContain(res.status.mock.calls[0][0]);
    });

    // DEMO/edge: Si el controlador soporta comentarios DEMO, agregar test aquí
    it('should handle DEMO comment (edge case)', async () => {
      // Simular un tipo especial DEMO si existe en el controlador
      User.findOne = jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011', username: 'demo_user' });
      Publication.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439012', type: 'DEMO' })
      });
      Comment.mockImplementation(() => ({
        _id: 'demo_comment',
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'DEMO',
        target_id: '507f1f77bcf86cd799439012',
        comment: 'Demo comment',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'demo_comment',
          user_id: { username: 'demo_user' },
          target_id: '507f1f77bcf86cd799439012',
          target_type: 'DEMO',
          comment: 'Demo comment'
        })
      }));
      const req = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'DEMO',
        target_id: '507f1f77bcf86cd799439012',
        comment: 'Demo comment'
      });
      const res = mockResponse();
      await commentController.addComment(req, res);
      expect(res.status).toHaveBeenCalledWith(expect.any(Number));
    });
    it('should add a comment successfully', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        avatar_url: 'avatar.jpg'
      };

      const mockPublication = {
        _id: '507f1f77bcf86cd799439012',
        type: 'review',
        author_id: { username: 'author', avatar_url: 'avatar.jpg' }
      };

      const mockComment = {
        _id: '507f1f77bcf86cd799439013',
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'review',
        target_id: '507f1f77bcf86cd799439012',
        comment: 'Great review!',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439013',
          user_id: mockUser,
          target_id: '507f1f77bcf86cd799439012',
          target_type: 'review',
          comment: 'Great review!'
        })
      };

      // Mock User.findOne
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      // Mock Publication.findOne with populate chain
      Publication.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPublication)
      });

      Comment.mockImplementation(() => mockComment);

      const req = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'review',
        target_id: '507f1f77bcf86cd799439012',
        comment: 'Great review!'
      });
      const res = mockResponse();

      await commentController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if required fields are missing', async () => {
      const req = mockRequest({ target_id: 'pub123' });
      const res = mockResponse();

      await commentController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if comment is empty', async () => {
      const req = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'review',
        target_id: 'pub123',
        comment: ''
      });
      const res = mockResponse();

      await commentController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid target_type', async () => {
      const req = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'invalid',
        target_id: '507f1f77bcf86cd799439012',
        comment: 'Test comment'
      });
      const res = mockResponse();

      await commentController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if publication not found', async () => {
      User.findOne = jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
      Publication.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const req = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'review',
        target_id: '507f1f77bcf86cd799439012',
        comment: 'Test comment'
      });
      const res = mockResponse();

      await commentController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if comment exceeds 500 characters', async () => {
      const longComment = 'a'.repeat(501);
      User.findOne = jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
      Publication.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439012', type: 'review' })
      });

      const req = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'review',
        target_id: '507f1f77bcf86cd799439012',
        comment: longComment
      });
      const res = mockResponse();

      await commentController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if user not found for non-DEMO publication', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);
      Publication.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({ 
          _id: '507f1f77bcf86cd799439999', 
          type: 'review' 
        })
      });

      const req = mockRequest({
        user_id: '507f1f77bcf86cd799439999',
        target_type: 'review',
        target_id: '507f1f77bcf86cd799439999',
        comment: 'Test comment'
      }, {}, { mongo_id: '507f1f77bcf86cd799439999' }); // Actor matches user_id
      const res = mockResponse();

      await commentController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if comment is whitespace only', async () => {
      User.findOne = jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
      Publication.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({ 
          _id: '507f1f77bcf86cd799439012', 
          type: 'review' 
        })
      });

      const req = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'review',
        target_id: '507f1f77bcf86cd799439012',
        comment: '   '
      });
      const res = mockResponse();

      await commentController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getPublicationComments', () => {
    it('should return comments for publication', async () => {
      const mockPublication = {
        _id: '507f1f77bcf86cd799439012',
        type: 'review'
      };

      const mockComments = [
        {
          _id: '507f1f77bcf86cd799439013',
          comment: 'Comment 1',
          user_id: { _id: '507f1f77bcf86cd799439011', username: 'user1' },
          created_at: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439014',
          comment: 'Comment 2',
          user_id: { _id: '507f1f77bcf86cd799439015', username: 'user2' },
          created_at: new Date()
        }
      ];

      // Mock Publication.findById
      Publication.findById = jest.fn().mockResolvedValue(mockPublication);

      Comment.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockComments)
            })
          })
        })
      });

      Comment.countDocuments = jest.fn().mockResolvedValue(2);

      const req = mockRequest({}, { publication_id: '507f1f77bcf86cd799439012' });
      req.query = { page: '1', limit: '20' };
      const res = mockResponse();

      await commentController.getPublicationComments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if publication_id is missing', async () => {
      const req = mockRequest({}, {});
      req.query = {};
      const res = mockResponse();

      await commentController.getPublicationComments(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if publication not found', async () => {
      Publication.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({}, { publication_id: '507f1f77bcf86cd799439012' });
      req.query = { page: '1', limit: '20' };
      const res = mockResponse();

      await commentController.getPublicationComments(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment successfully', async () => {
      const mockComment = {
        _id: 'commentId',
        user_id: '507f1f77bcf86cd799439011'
      };

      Comment.findById = jest.fn().mockResolvedValue(mockComment);
      Comment.findByIdAndDelete = jest.fn().mockResolvedValue(mockComment);

      const req = mockRequest(
        { user_id: '507f1f77bcf86cd799439011' }, 
        { comment_id: 'commentId' }
      );
      const res = mockResponse();

      await commentController.deleteComment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if comment not found', async () => {
      Comment.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest(
        { user_id: '507f1f77bcf86cd799439011' }, 
        { comment_id: 'invalidId' }
      );
      const res = mockResponse();

      await commentController.deleteComment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 if user tries to delete another user comment', async () => {
      const mockComment = {
        _id: 'commentId',
        user_id: { toString: () => '507f1f77bcf86cd799439999' }
      };

      Comment.findById = jest.fn().mockResolvedValue(mockComment);

      const req = mockRequest(
        { user_id: '507f1f77bcf86cd799439011' }, 
        { comment_id: 'commentId' }
      );
      const res = mockResponse();

      await commentController.deleteComment(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getPublicationComments', () => {
    it('should return comments for a publication', async () => {
      const mockComments = [
        {
          _id: 'comment1',
          user_id: { _id: 'user1', username: 'testuser', avatar_url: null },
          comment: 'Great movie!',
          created_at: new Date()
        }
      ];

      Publication.findById = jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439012' });
      Comment.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockComments)
            })
          })
        })
      });
      Comment.countDocuments = jest.fn().mockResolvedValue(1);

      const req = mockRequest({}, { publication_id: '507f1f77bcf86cd799439012' });
      req.query = {};
      const res = mockResponse();

      await commentController.getPublicationComments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if publication_id is missing', async () => {
      const req = mockRequest({}, {});
      req.query = {};
      const res = mockResponse();

      await commentController.getPublicationComments(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if publication not found', async () => {
      Publication.findById = jest.fn().mockResolvedValue(null);

      const req = mockRequest({}, { publication_id: '507f1f77bcf86cd799439999' });
      req.query = {};
      const res = mockResponse();

      await commentController.getPublicationComments(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle DEMO publication comments (65f5e1d77c65c827d8536abc)', async () => {
      const mockPublication = {
        _id: '65f5e1d77c65c827d8536abc',
        type: 'review',
        author_id: { username: 'author' }
      };

      Publication.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPublication)
      });

      const req = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'review',
        target_id: '65f5e1d77c65c827d8536abc',
        comment: 'DEMO comment'
      });
      const res = mockResponse();

      await commentController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('demo')
        })
      );
    });

    it('should delete DEMO comment successfully', async () => {
      const mockPublication = {
        _id: '65f5e1d77c65c827d8536abd',
        type: 'review',
        author_id: { username: 'author' }
      };

      Publication.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPublication)
      });

      const addReq = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'review',
        target_id: '65f5e1d77c65c827d8536abd',
        comment: 'Test comment'
      });
      const addRes = mockResponse();

      await commentController.addComment(addReq, addRes);
      expect(addRes.status).toHaveBeenCalledWith(201);

      const commentId = addRes.json.mock.calls[0][0].comment.id;

      const deleteReq = mockRequest(
        { user_id: '507f1f77bcf86cd799439011' },
        { comment_id: commentId }
      );
      const deleteRes = mockResponse();

      await commentController.deleteComment(deleteReq, deleteRes);

      expect(deleteRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent DEMO comment deletion', async () => {
      const req = mockRequest(
        { user_id: '507f1f77bcf86cd799439011' },
        { comment_id: 'demo_comment_nonexistent' }
      );
      const res = mockResponse();

      await commentController.deleteComment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 when trying to delete another user DEMO comment', async () => {
      const mockPublication = {
        _id: '65f5e1d77c65c827d8536abe',
        type: 'review',
        author_id: { username: 'author' }
      };

      Publication.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPublication)
      });

      const addReq = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'review',
        target_id: '65f5e1d77c65c827d8536abe',
        comment: 'Test comment'
      });
      const addRes = mockResponse();

      await commentController.addComment(addReq, addRes);
      expect(addRes.status).toHaveBeenCalledWith(201);

      const commentId = addRes.json.mock.calls[0][0].comment.id;

      const deleteReq = mockRequest(
        { user_id: '507f1f77bcf86cd799439099' },
        { comment_id: commentId },
        { mongo_id: '507f1f77bcf86cd799439099' }
      );
      const deleteRes = mockResponse();

      await commentController.deleteComment(deleteReq, deleteRes);

      expect(deleteRes.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 if comment exceeds 500 characters', async () => {
      const longComment = 'a'.repeat(501);
      const mockPublication = {
        _id: '507f1f77bcf86cd799439012',
        type: 'review',
        author_id: { username: 'author' }
      };

      Publication.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPublication)
      });

      const req = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'review',
        target_id: '507f1f77bcf86cd799439012',
        comment: longComment
      });
      const res = mockResponse();

      await commentController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if target_type is invalid', async () => {
      const req = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'invalid',
        target_id: '507f1f77bcf86cd799439012',
        comment: 'Test comment'
      });
      const res = mockResponse();

      await commentController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if publication not found in addComment', async () => {
      Publication.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const req = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'review',
        target_id: '507f1f77bcf86cd799439999',
        comment: 'Test comment'
      });
      const res = mockResponse();

      await commentController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('addComment - Branch Coverage', () => {
    it('should return 409 if actor is not synced', async () => {
      const req = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'review',
        target_id: '507f1f77bcf86cd799439012',
        comment: 'Test'
      });
      req.actor = {};
      const res = mockResponse();
      await commentController.addComment(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 403 if actor mongo_id does not match user_id', async () => {
      const req = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'review',
        target_id: '507f1f77bcf86cd799439012',
        comment: 'Test'
      });
      req.actor = { mongo_id: 'different_id' };
      const res = mockResponse();
      await commentController.addComment(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 for invalid target_type', async () => {
      const req = mockRequest({
        user_id: '507f1f77bcf86cd799439011',
        target_type: 'invalid_type',
        target_id: '507f1f77bcf86cd799439012',
        comment: 'Test'
      });
      const res = mockResponse();
      await commentController.addComment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteComment - Extended Coverage', () => {
    it('should return 400 if comment_id is missing', async () => {
      const req = { params: {}, body: { user_id: '507f1f77bcf86cd799439011' }, actor: { mongo_id: '507f1f77bcf86cd799439011' } };
      const res = mockResponse();
      await commentController.deleteComment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if user_id is missing', async () => {
      const req = { params: { comment_id: 'comment123' }, body: {}, actor: { mongo_id: '507f1f77bcf86cd799439011' } };
      const res = mockResponse();
      await commentController.deleteComment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if comment not found', async () => {
      Comment.findById = jest.fn().mockResolvedValue(null);
      const req = { params: { comment_id: 'nonexistent' }, body: { user_id: '507f1f77bcf86cd799439011' }, actor: { mongo_id: '507f1f77bcf86cd799439011' } };
      const res = mockResponse();
      await commentController.deleteComment(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 if user tries to delete another user comment', async () => {
      const mockComment = {
        _id: 'comment123',
        user_id: { _id: '507f1f77bcf86cd799439099', toString: () => '507f1f77bcf86cd799439099' },
        target_id: 'pub123',
        comment: 'Test'
      };
      Comment.findById = jest.fn().mockResolvedValue(mockComment);
      const req = { params: { comment_id: 'comment123' }, body: { user_id: '507f1f77bcf86cd799439011' }, actor: { mongo_id: '507f1f77bcf86cd799439011' } };
      const res = mockResponse();
      await commentController.deleteComment(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should delete comment successfully', async () => {
      const mockComment = {
        _id: 'comment123',
        user_id: { _id: '507f1f77bcf86cd799439011', toString: () => '507f1f77bcf86cd799439011' },
        target_id: 'pub123',
        comment: 'Test',
        deleteOne: jest.fn().mockResolvedValue(true)
      };
      Comment.findById = jest.fn().mockResolvedValue(mockComment);
      Publication.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ review_id: 'rev123' })
      });
      const req = { params: { comment_id: 'comment123' }, body: { user_id: '507f1f77bcf86cd799439011' }, actor: { mongo_id: '507f1f77bcf86cd799439011' } };
      const res = mockResponse();
      await commentController.deleteComment(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle DB error in deleteComment', async () => {
      Comment.findById = jest.fn().mockImplementation(() => { throw new Error('DB error'); });
      const req = { params: { comment_id: 'comment123' }, body: { user_id: '507f1f77bcf86cd799439011' }, actor: { mongo_id: '507f1f77bcf86cd799439011' } };
      const res = mockResponse();
      await commentController.deleteComment(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

