const Movie = require('../../models/Movie');
const movieController = require('../../controllers/movieController');

jest.mock('../../models/Movie');

const mockRequest = (body = {}, params = {}, query = {}) => ({
  body,
  params,
  query
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('MovieController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertMovie', () => {
    it('should create or update a movie successfully', async () => {
      const mockMovie = {
        movie_id: 12345,
        poster: '/poster.jpg',
        titulo: 'Test Movie',
        created_at: new Date(),
        updated_at: new Date()
      };

      Movie.upsertFromMovieData = jest.fn().mockResolvedValue(mockMovie);

      const req = mockRequest({
        id: 12345,
        poster: '/poster.jpg',
        titulo: 'Test Movie'
      });
      const res = mockResponse();

      await movieController.upsertMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(Movie.upsertFromMovieData).toHaveBeenCalledWith({
        id: 12345,
        poster: '/poster.jpg',
        titulo: 'Test Movie'
      });
    });

    it('should return 400 if required fields are missing', async () => {
      const req = mockRequest({ id: 12345 });
      const res = mockResponse();

      await movieController.upsertMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if id is not a number', async () => {
      const req = mockRequest({
        id: 'not-a-number',
        poster: '/poster.jpg',
        titulo: 'Test Movie'
      });
      const res = mockResponse();

      await movieController.upsertMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle errors', async () => {
      Movie.upsertFromMovieData = jest.fn().mockRejectedValue(new Error('Database error'));

      const req = mockRequest({
        id: 12345,
        poster: '/poster.jpg',
        titulo: 'Test Movie'
      });
      const res = mockResponse();

      await movieController.upsertMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getMovie', () => {
    it('should return movie by id', async () => {
      const mockMovie = {
        movie_id: 12345,
        poster: '/poster.jpg',
        titulo: 'Test Movie',
        created_at: new Date(),
        updated_at: new Date()
      };

      Movie.getByMovieId = jest.fn().mockResolvedValue(mockMovie);

      const req = mockRequest({}, { movie_id: '12345' });
      const res = mockResponse();

      await movieController.getMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(Movie.getByMovieId).toHaveBeenCalledWith(12345);
    });

    it('should return 404 if movie not found', async () => {
      Movie.getByMovieId = jest.fn().mockResolvedValue(null);

      const req = mockRequest({}, { movie_id: '99999' });
      const res = mockResponse();

      await movieController.getMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if movie_id is not a number', async () => {
      const req = mockRequest({}, { movie_id: 'invalid' });
      const res = mockResponse();

      await movieController.getMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getMovies', () => {
    it('should return multiple movies', async () => {
      const mockMovies = [
        { movie_id: 123, poster: '/1.jpg', titulo: 'Movie 1', created_at: new Date(), updated_at: new Date() },
        { movie_id: 456, poster: '/2.jpg', titulo: 'Movie 2', created_at: new Date(), updated_at: new Date() }
      ];

      Movie.getByMovieIds = jest.fn().mockResolvedValue(mockMovies);

      const req = mockRequest({}, {}, { ids: '123,456' });
      const res = mockResponse();

      await movieController.getMovies(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(Movie.getByMovieIds).toHaveBeenCalledWith([123, 456]);
    });

    it('should return 400 if ids parameter is missing', async () => {
      const req = mockRequest({}, {}, {});
      const res = mockResponse();

      await movieController.getMovies(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if no valid IDs provided', async () => {
      const req = mockRequest({}, {}, { ids: 'invalid,not-a-number' });
      const res = mockResponse();

      await movieController.getMovies(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should filter out invalid IDs', async () => {
      const mockMovies = [
        { movie_id: 123, poster: '/1.jpg', titulo: 'Movie 1', created_at: new Date(), updated_at: new Date() }
      ];

      Movie.getByMovieIds = jest.fn().mockResolvedValue(mockMovies);

      const req = mockRequest({}, {}, { ids: '123,invalid,456' });
      const res = mockResponse();

      await movieController.getMovies(req, res);

      expect(Movie.getByMovieIds).toHaveBeenCalledWith([123, 456]);
    });
  });

  describe('deleteMovie', () => {
    it('should delete movie successfully', async () => {
      Movie.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });

      const req = mockRequest({}, { movie_id: '12345' });
      const res = mockResponse();

      await movieController.deleteMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(Movie.deleteOne).toHaveBeenCalledWith({ movie_id: 12345 });
    });

    it('should return 404 if movie not found', async () => {
      Movie.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 0 });

      const req = mockRequest({}, { movie_id: '99999' });
      const res = mockResponse();

      await movieController.deleteMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if movie_id is not a number', async () => {
      const req = mockRequest({}, { movie_id: 'invalid' });
      const res = mockResponse();

      await movieController.deleteMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle errors', async () => {
      Movie.deleteOne = jest.fn().mockRejectedValue(new Error('Database error'));

      const req = mockRequest({}, { movie_id: '12345' });
      const res = mockResponse();

      await movieController.deleteMovie(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
