const mongoose = require('mongoose');
const Publication = require('../../models/Publication');

describe('Publication Model', () => {
  describe('Schema validation', () => {
    it('should create a publication with valid data', () => {
      const validPublication = {
        type: 'review',
        user_id: 'user123',
        movie_id: 123,
        title: 'Test Movie',
        rating: 4.5,
        review_text: 'Great movie!'
      };

      const publication = new Publication(validPublication);
      const validationError = publication.validateSync();

      expect(validationError).toBeUndefined();
      expect(publication.type).toBe('review');
      expect(publication.rating).toBe(4.5);
    });

    it('should accept valid publication types', () => {
      const types = ['review', 'activity', 'recommendation'];
      
      types.forEach(type => {
        const pub = new Publication({ type, user_id: 'test' });
        expect(pub.type).toBe(type);
      });
    });

    it('should have default timestamps', () => {
      const publication = new Publication({
        type: 'review',
        user_id: 'test123'
      });

      expect(publication.createdAt).toBeUndefined(); // Not set until saved
      expect(publication.updatedAt).toBeUndefined(); // Not set until saved
    });
  });

  describe('Instance methods', () => {
    it('should create publication object', () => {
      const publication = new Publication({
        type: 'review',
        user_id: 'user123',
        movie_id: 456,
        rating: 5
      });

      expect(publication).toBeInstanceOf(Publication);
      expect(publication.user_id).toBe('user123');
      expect(publication.movie_id).toBe(456);
    });
  });

  describe('Virtual properties', () => {
    it('should return userId from user_id field', () => {
      const publication = new Publication({
        type: 'review',
        user_id: 'user123',
        movie_id: 456
      });

      expect(publication.userId).toBe('user123');
    });

    it('should return userId from author_id field when user_id is not set', () => {
      const objectId = new mongoose.Types.ObjectId();
      const publication = new Publication({
        type: 'review',
        author_id: objectId,
        movie_id: 456
      });

      expect(publication.userId).toEqual(objectId);
    });

    it('should return movieId from movie_id field', () => {
      const publication = new Publication({
        type: 'review',
        user_id: 'user123',
        movie_id: 789
      });

      expect(publication.movieId).toBe(789);
    });

    it('should return movieId from target_id field when movie_id is not set', () => {
      const publication = new Publication({
        type: 'review',
        user_id: 'user123',
        target_id: '999'
      });

      expect(publication.movieId).toBe('999');
    });

    it('should return text from body field', () => {
      const publication = new Publication({
        type: 'review',
        user_id: 'user123',
        body: 'This is the body text'
      });

      expect(publication.text).toBe('This is the body text');
    });

    it('should return text from content field when body is not set', () => {
      const publication = new Publication({
        type: 'review',
        user_id: 'user123',
        content: 'This is the content text'
      });

      expect(publication.text).toBe('This is the content text');
    });
  });
});
