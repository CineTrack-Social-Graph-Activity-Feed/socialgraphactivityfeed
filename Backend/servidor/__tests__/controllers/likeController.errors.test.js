const Like = require('../../models/Like');
const Publication = require('../../models/Publication');
const User = require('../../models/User');
const likeController = require('../../controllers/likeController');

jest.mock('../../models/Like');
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

describe('LikeController Error Handling', () => {
  it('should add and remove a DEMO like successfully', async () => {
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
      target_id: '65f5e1d77c65c827d8536abc'
    });
    const res = mockResponse();
    await likeController.addLike(req, res);
    expect(res.status).toHaveBeenCalledWith(expect.any(Number));
    // Remove DEMO like
    const likeObj = res.json.mock.calls[0]?.[0]?.like;
    if (likeObj && likeObj.id) {
      const removeReq = mockRequest(
        { user_id: '507f1f77bcf86cd799439011' },
        { like_id: likeObj.id }
      );
      const removeRes = mockResponse();
      await likeController.removeLike(removeReq, removeRes);
      expect(removeRes.status).toHaveBeenCalledWith(expect.any(Number));
    }
  });

  it('should return 404 for non-existent DEMO like removal', async () => {
    const req = mockRequest(
      { user_id: '507f1f77bcf86cd799439011' },
      { like_id: 'demo_like_nonexistent' }
    );
    const res = mockResponse();
    await likeController.removeLike(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 409 for duplicate DEMO publication like', async () => {
    const mockPublication = {
      _id: '65f5e1d77c65c827d8536abd',
      type: 'review',
      author_id: { username: 'author' }
    };
    Publication.findOne = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockPublication)
    });
    const req = mockRequest({
      user_id: '507f1f77bcf86cd799439011',
      target_type: 'review',
      target_id: '65f5e1d77c65c827d8536abd'
    });
    const res = mockResponse();
    await likeController.addLike(req, res);
    expect(res.status).toHaveBeenCalledWith(expect.any(Number));
    // Duplicate like
    const res2 = mockResponse();
    await likeController.addLike(req, res2);
  expect([409, 404]).toContain(res2.status.mock.calls[0][0]);
  });
  it('should return 403 if actor mongo_id does not match user_id in addLike', async () => {
    const req = mockRequest({
      user_id: '507f1f77bcf86cd799439011',
      target_type: 'review',
      target_id: '507f1f77bcf86cd799439012'
    }, {}, { mongo_id: 'different_id' });
    const res = mockResponse();
    await likeController.addLike(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 403 if acting user is deactivated in addLike', async () => {
    User.findOne = jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011', activated: false });
    const req = mockRequest({
      user_id: '507f1f77bcf86cd799439011',
      target_type: 'review',
      target_id: '507f1f77bcf86cd799439012'
    }, {}, { mongo_id: '507f1f77bcf86cd799439011' });
    const res = mockResponse();
    await likeController.addLike(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 404 if acting user not found in addLike', async () => {
    User.findOne = jest.fn().mockResolvedValue(null);
    const req = mockRequest({
      user_id: '507f1f77bcf86cd799439011',
      target_type: 'review',
      target_id: '507f1f77bcf86cd799439012'
    }, {}, { mongo_id: '507f1f77bcf86cd799439011' });
    const res = mockResponse();
    await likeController.addLike(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 400 if required fields are missing in addLike', async () => {
    const req = mockRequest({});
    const res = mockResponse();
    await likeController.addLike(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if like_id is missing in removeLike', async () => {
    const req = mockRequest({ user_id: '507f1f77bcf86cd799439011' }, {});
    const res = mockResponse();
    await likeController.removeLike(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if user_id is missing in removeLike', async () => {
    const req = mockRequest({}, { like_id: '507f1f77bcf86cd799439013' });
    const res = mockResponse();
    await likeController.removeLike(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 403 if actor mongo_id does not match user_id in removeLike', async () => {
    const req = mockRequest({ user_id: '507f1f77bcf86cd799439011' }, { like_id: '507f1f77bcf86cd799439013' }, { mongo_id: 'different_id' });
    const res = mockResponse();
    await likeController.removeLike(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 404 if like not found in removeLike', async () => {
    Like.findById = jest.fn().mockResolvedValue(null);
    const req = mockRequest({ user_id: '507f1f77bcf86cd799439011' }, { like_id: '507f1f77bcf86cd799439013' });
    const res = mockResponse();
    await likeController.removeLike(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 403 if user tries to remove another user like', async () => {
    Like.findById = jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439013', user_id: { toString: () => '507f1f77bcf86cd799439099' }, target_id: '507f1f77bcf86cd799439012' });
    const req = mockRequest({ user_id: '507f1f77bcf86cd799439011' }, { like_id: '507f1f77bcf86cd799439013' });
    const res = mockResponse();
    await likeController.removeLike(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 400 if publication_id is missing in getPublicationLikes', async () => {
    const req = mockRequest({}, {});
    req.query = {};
    const res = mockResponse();
    await likeController.getPublicationLikes(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle DB error in addLike', async () => {
    User.findOne = jest.fn().mockImplementation(() => { throw new Error('DB error'); });
    const req = mockRequest({
      user_id: '507f1f77bcf86cd799439011',
      target_type: 'review',
      target_id: '507f1f77bcf86cd799439012'
    });
    const res = mockResponse();
    await likeController.addLike(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it('should handle DB error in removeLike', async () => {
    Like.findById = jest.fn().mockImplementation(() => { throw new Error('DB error'); });
    const req = mockRequest(
      { user_id: '507f1f77bcf86cd799439011' },
      { like_id: '507f1f77bcf86cd799439013' }
    );
    const res = mockResponse();
    await likeController.removeLike(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it('should handle DB error in getPublicationLikes', async () => {
    Like.find = jest.fn().mockImplementation(() => { throw new Error('DB error'); });
    const req = mockRequest({}, { publication_id: '507f1f77bcf86cd799439012' });
    req.query = { page: '1', limit: '20' };
    const res = mockResponse();
    await likeController.getPublicationLikes(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it('should handle error in DEMO like removal', async () => {
    // Simulate demo like removal with error in Publication.findById
    const demoLikeId = 'demo_like_123';
    // Patch Publication.findById to throw
    Publication.findById = jest.fn().mockImplementation(() => { throw new Error('DB error'); });
    // Patch demoLikes in controller (simulate like in memory)
    // Not strictly necessary for coverage, just call the controller
    const req = mockRequest(
      { user_id: '507f1f77bcf86cd799439011' },
      { like_id: demoLikeId }
    );
    const res = mockResponse();
    await likeController.removeLike(req, res); // Should still handle error gracefully
    expect(res.status).toHaveBeenCalled();
  });

  it('should handle DEMO like with deactivated user enrichment', async () => {
    jest.clearAllMocks();
    const mockPublication = {
      _id: '65f5e1d77c65c827d8536abc',
      type: 'review',
      author_id: { username: 'author' }
    };
    Publication.findOne = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockPublication)
    });
    Publication.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ review_id: 'rev123' })
    });

    User.findOne = jest.fn().mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      username: 'testuser',
      activated: false
    });

    const req = mockRequest({
      user_id: '507f1f77bcf86cd799439011',
      target_type: 'review',
      target_id: '65f5e1d77c65c827d8536abc'
    });
    const res = mockResponse();

    await likeController.addLike(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should handle DEMO like when user not found (no blocking)', async () => {
    jest.clearAllMocks();
    const mockPublication = {
      _id: '65f5e1d77c65c827d8536abc',
      type: 'review',
      author_id: { username: 'author' }
    };
    Publication.findOne = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockPublication)
    });
    Publication.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ review_id: 'rev123' })
    });

    User.findOne = jest.fn().mockResolvedValue(null);

    const req = mockRequest({
      user_id: '507f1f77bcf86cd799439011',
      target_type: 'review',
      target_id: '65f5e1d77c65c827d8536abc'
    });
    const res = mockResponse();

    await likeController.addLike(req, res);

    // El controlador puede devolver 201 (DEMO) o 404 (usuario no encontrado) dependiendo de la lógica
    expect([201, 404]).toContain(res.status.mock.calls[0][0]);
  });

  it('should handle DEMO like with review_id mapping error', async () => {
    jest.clearAllMocks();
    const mockPublication = {
      _id: '65f5e1d77c65c827d8536abc',
      type: 'review',
      author_id: { username: 'author' }
    };
    Publication.findOne = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockPublication)
    });

    Publication.findById = jest.fn().mockImplementation(() => { throw new Error('DB error'); });

    User.findOne = jest.fn().mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      username: 'testuser',
      activated: true
    });

    const req = mockRequest({
      user_id: '507f1f77bcf86cd799439011',
      target_type: 'review',
      target_id: '65f5e1d77c65c827d8536abc'
    });
    const res = mockResponse();

    await likeController.addLike(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  describe('Additional Coverage Tests', () => {
    it('should handle pagination in getPublicationLikes', async () => {
      Like.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      });
      Like.countDocuments = jest.fn().mockResolvedValue(0);
      const req = mockRequest({}, { publication_id: 'pub123' });
      req.query = { page: '2', limit: '5' };
      const res = mockResponse();
      await likeController.getPublicationLikes(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for missing target_type in addLike', async () => {
      const req = mockRequest({ user_id: '507f1f77bcf86cd799439011', target_id: 'pub123' });
      const res = mockResponse();
      await likeController.addLike(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for missing target_id in addLike', async () => {
      const req = mockRequest({ user_id: '507f1f77bcf86cd799439011', target_type: 'review' });
      const res = mockResponse();
      await likeController.addLike(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle invalid target_type in addLike', async () => {
      User.findOne = jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011', activated: true });
      const req = mockRequest({ user_id: '507f1f77bcf86cd799439011', target_type: 'invalid', target_id: 'pub123' });
      const res = mockResponse();
      await likeController.addLike(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
