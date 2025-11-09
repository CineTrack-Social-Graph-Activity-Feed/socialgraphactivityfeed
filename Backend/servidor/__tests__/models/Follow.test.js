const mongoose = require('mongoose');
const Follow = require('../../models/Follow');

describe('Follow Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid follow relationship', () => {
      const followData = {
        follower_user_id: new mongoose.Types.ObjectId(),
        followed_user_id: new mongoose.Types.ObjectId()
      };

      const follow = new Follow(followData);
      const validationError = follow.validateSync();

      expect(validationError).toBeUndefined();
      expect(follow.follower_user_id).toEqual(followData.follower_user_id);
      expect(follow.followed_user_id).toEqual(followData.followed_user_id);
    });

    it('should fail without follower_user_id', () => {
      const follow = new Follow({
        followed_user_id: new mongoose.Types.ObjectId()
      });

      const validationError = follow.validateSync();
      expect(validationError.errors.follower_user_id).toBeDefined();
    });

    it('should fail without followed_user_id', () => {
      const follow = new Follow({
        follower_user_id: new mongoose.Types.ObjectId()
      });

      const validationError = follow.validateSync();
      expect(validationError.errors.followed_user_id).toBeDefined();
    });

    it('should set created_at automatically', () => {
      const follow = new Follow({
        follower_user_id: new mongoose.Types.ObjectId(),
        followed_user_id: new mongoose.Types.ObjectId()
      });

      expect(follow.created_at).toBeDefined();
      expect(follow.created_at).toBeInstanceOf(Date);
    });

    it('should reference User model for follower_user_id', () => {
      const schema = Follow.schema;
      const followerField = schema.path('follower_user_id');

      expect(followerField.options.ref).toBe('User');
    });

    it('should reference User model for followed_user_id', () => {
      const schema = Follow.schema;
      const followedField = schema.path('followed_user_id');

      expect(followedField.options.ref).toBe('User');
    });
  });
});
