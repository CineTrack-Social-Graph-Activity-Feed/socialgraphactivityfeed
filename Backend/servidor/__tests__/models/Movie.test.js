const mongoose = require('mongoose');
const Movie = require('../../models/Movie');

describe('Movie Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid movie', () => {
      const movieData = {
        movie_id: 12345,
        poster: '/path/to/poster.jpg',
        titulo: 'Test Movie'
      };

      const movie = new Movie(movieData);
      const validationError = movie.validateSync();

      expect(validationError).toBeUndefined();
      expect(movie.movie_id).toBe(12345);
      expect(movie.poster).toBe('/path/to/poster.jpg');
      expect(movie.titulo).toBe('Test Movie');
    });

    it('should fail without movie_id', () => {
      const movie = new Movie({
        poster: '/path/to/poster.jpg',
        titulo: 'Test Movie'
      });

      const validationError = movie.validateSync();
      expect(validationError.errors.movie_id).toBeDefined();
    });

    it('should fail without poster', () => {
      const movie = new Movie({
        movie_id: 12345,
        titulo: 'Test Movie'
      });

      const validationError = movie.validateSync();
      expect(validationError.errors.poster).toBeDefined();
    });

    it('should fail without titulo', () => {
      const movie = new Movie({
        movie_id: 12345,
        poster: '/path/to/poster.jpg'
      });

      const validationError = movie.validateSync();
      expect(validationError.errors.titulo).toBeDefined();
    });

    it('should trim poster string', () => {
      const movie = new Movie({
        movie_id: 12345,
        poster: '   /path/to/poster.jpg   ',
        titulo: 'Test Movie'
      });

      expect(movie.poster).toBe('/path/to/poster.jpg');
    });

    it('should trim titulo string', () => {
      const movie = new Movie({
        movie_id: 12345,
        poster: '/path/to/poster.jpg',
        titulo: '   Test Movie   '
      });

      expect(movie.titulo).toBe('Test Movie');
    });

    it('should fail if titulo exceeds max length', () => {
      const longTitle = 'a'.repeat(501);
      const movie = new Movie({
        movie_id: 12345,
        poster: '/path/to/poster.jpg',
        titulo: longTitle
      });

      const validationError = movie.validateSync();
      expect(validationError.errors.titulo).toBeDefined();
    });

    it('should set timestamps automatically', () => {
      const movie = new Movie({
        movie_id: 12345,
        poster: '/path/to/poster.jpg',
        titulo: 'Test Movie'
      });

      expect(movie.created_at).toBeDefined();
      expect(movie.updated_at).toBeDefined();
      expect(movie.syncedAt).toBeDefined();
    });
  });

  describe('Static Methods', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
    });

    describe('upsertFromMovieData', () => {
      it('should create a new movie from movie data', async () => {
        const movieData = {
          id: 12345,
          poster: '/poster.jpg',
          titulo: 'New Movie'
        };

        Movie.findOneAndUpdate = jest.fn().mockResolvedValue({
          movie_id: 12345,
          poster: '/poster.jpg',
          titulo: 'New Movie'
        });

        const result = await Movie.upsertFromMovieData(movieData);

        expect(Movie.findOneAndUpdate).toHaveBeenCalled();
        expect(result.movie_id).toBe(12345);
      });

      it('should throw error if required data is missing', async () => {
        const invalidData = {
          id: 12345,
          // missing poster and titulo
        };

        await expect(Movie.upsertFromMovieData(invalidData))
          .rejects
          .toThrow('Faltan datos requeridos');
      });
    });

    describe('getByMovieId', () => {
      it('should return movie by movie_id', async () => {
        Movie.findOne = jest.fn().mockResolvedValue({
          movie_id: 12345,
          titulo: 'Test Movie'
        });

        const result = await Movie.getByMovieId(12345);

        expect(Movie.findOne).toHaveBeenCalledWith({ movie_id: 12345 });
        expect(result.movie_id).toBe(12345);
      });
    });

    describe('getByMovieIds', () => {
      it('should return multiple movies by IDs', async () => {
        const movieIds = [123, 456, 789];
        const mockMovies = [
          { movie_id: 123, titulo: 'Movie 1' },
          { movie_id: 456, titulo: 'Movie 2' },
          { movie_id: 789, titulo: 'Movie 3' }
        ];

        Movie.find = jest.fn().mockResolvedValue(mockMovies);

        const result = await Movie.getByMovieIds(movieIds);

        expect(Movie.find).toHaveBeenCalledWith({ movie_id: { $in: movieIds } });
        expect(result).toHaveLength(3);
      });
    });
  });
});
