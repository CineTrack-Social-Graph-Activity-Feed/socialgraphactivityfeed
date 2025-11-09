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
});
