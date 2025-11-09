const mongoose = require('mongoose');
const Like = require('../../models/Like');

describe('Like Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid like', () => {
      const likeData = {
        user_id: new mongoose.Types.ObjectId(),
        target_type: 'review',
        target_id: 'pub123'
      };

      const like = new Like(likeData);
      const validationError = like.validateSync();

      expect(validationError).toBeUndefined();
      expect(like.user_id).toEqual(likeData.user_id);
      expect(like.target_type).toBe('review');
      expect(like.target_id).toBe('pub123');
    });

    it('should fail without user_id', () => {
      const like = new Like({
        target_type: 'review',
        target_id: 'pub123'
      });

      const validationError = like.validateSync();
      expect(validationError.errors.user_id).toBeDefined();
    });

    it('should fail without target_type', () => {
      const like = new Like({
        user_id: new mongoose.Types.ObjectId(),
        target_id: 'pub123'
      });

      const validationError = like.validateSync();
      expect(validationError.errors.target_type).toBeDefined();
    });

    it('should fail without target_id', () => {
      const like = new Like({
        user_id: new mongoose.Types.ObjectId(),
        target_type: 'review'
      });

      const validationError = like.validateSync();
      expect(validationError.errors.target_id).toBeDefined();
    });

    it('should validate target_type enum values', () => {
      const validTypes = ['review', 'rating', 'list'];

      validTypes.forEach(type => {
        const like = new Like({
          user_id: new mongoose.Types.ObjectId(),
          target_type: type,
          target_id: 'target123'
        });

        const validationError = like.validateSync();
        expect(validationError).toBeUndefined();
      });
    });

    it('should fail with invalid target_type', () => {
      const like = new Like({
        user_id: new mongoose.Types.ObjectId(),
        target_type: 'invalid_type',
        target_id: 'target123'
      });

      const validationError = like.validateSync();
      expect(validationError.errors.target_type).toBeDefined();
    });

    it('should set created_at automatically', () => {
      const like = new Like({
        user_id: new mongoose.Types.ObjectId(),
        target_type: 'review',
        target_id: 'target123'
      });

      expect(like.created_at).toBeDefined();
      expect(like.created_at).toBeInstanceOf(Date);
    });

    it('should reference User model', () => {
      const schema = Like.schema;
      const userField = schema.path('user_id');

      expect(userField.options.ref).toBe('User');
    });
  });
});
