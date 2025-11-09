const mongoose = require('mongoose');
const Comment = require('../../models/Comment');

describe('Comment Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid comment', () => {
      const commentData = {
        user_id: new mongoose.Types.ObjectId(),
        target_type: 'review',
        target_id: 'movie123',
        comment: 'This is a great review!'
      };

      const comment = new Comment(commentData);
      const validationError = comment.validateSync();

      expect(validationError).toBeUndefined();
      expect(comment.user_id).toEqual(commentData.user_id);
      expect(comment.target_type).toBe('review');
      expect(comment.comment).toBe('This is a great review!');
    });

    it('should fail without user_id', () => {
      const comment = new Comment({
        target_type: 'review',
        target_id: 'movie123',
        comment: 'Test comment'
      });

      const validationError = comment.validateSync();
      expect(validationError.errors.user_id).toBeDefined();
    });

    it('should fail without target_type', () => {
      const comment = new Comment({
        user_id: new mongoose.Types.ObjectId(),
        target_id: 'movie123',
        comment: 'Test comment'
      });

      const validationError = comment.validateSync();
      expect(validationError.errors.target_type).toBeDefined();
    });

    it('should fail without target_id', () => {
      const comment = new Comment({
        user_id: new mongoose.Types.ObjectId(),
        target_type: 'review',
        comment: 'Test comment'
      });

      const validationError = comment.validateSync();
      expect(validationError.errors.target_id).toBeDefined();
    });

    it('should fail without comment text', () => {
      const comment = new Comment({
        user_id: new mongoose.Types.ObjectId(),
        target_type: 'review',
        target_id: 'movie123'
      });

      const validationError = comment.validateSync();
      expect(validationError.errors.comment).toBeDefined();
    });

    it('should validate target_type enum values', () => {
      const validTypes = ['review', 'rating', 'list'];

      validTypes.forEach(type => {
        const comment = new Comment({
          user_id: new mongoose.Types.ObjectId(),
          target_type: type,
          target_id: 'movie123',
          comment: 'Test comment'
        });

        const validationError = comment.validateSync();
        expect(validationError).toBeUndefined();
      });
    });

    it('should fail with invalid target_type', () => {
      const comment = new Comment({
        user_id: new mongoose.Types.ObjectId(),
        target_type: 'invalid_type',
        target_id: 'movie123',
        comment: 'Test comment'
      });

      const validationError = comment.validateSync();
      expect(validationError.errors.target_type).toBeDefined();
    });

    it('should trim comment text', () => {
      const comment = new Comment({
        user_id: new mongoose.Types.ObjectId(),
        target_type: 'review',
        target_id: 'movie123',
        comment: '   Trimmed comment   '
      });

      expect(comment.comment).toBe('Trimmed comment');
    });

    it('should fail if comment exceeds max length', () => {
      const longComment = 'a'.repeat(501);
      const comment = new Comment({
        user_id: new mongoose.Types.ObjectId(),
        target_type: 'review',
        target_id: 'movie123',
        comment: longComment
      });

      const validationError = comment.validateSync();
      expect(validationError.errors.comment).toBeDefined();
    });

    it('should set created_at automatically', () => {
      const comment = new Comment({
        user_id: new mongoose.Types.ObjectId(),
        target_type: 'review',
        target_id: 'movie123',
        comment: 'Test comment'
      });

      expect(comment.created_at).toBeDefined();
      expect(comment.created_at).toBeInstanceOf(Date);
    });

    it('should convert target_type to lowercase', () => {
      const comment = new Comment({
        user_id: new mongoose.Types.ObjectId(),
        target_type: 'REVIEW',
        target_id: 'movie123',
        comment: 'Test comment'
      });

      expect(comment.target_type).toBe('review');
    });
  });
});
