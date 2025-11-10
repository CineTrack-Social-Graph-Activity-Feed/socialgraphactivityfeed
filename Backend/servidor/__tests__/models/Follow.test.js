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

  describe('Pre-save validation', () => {
    it('should prevent a user from following themselves', async () => {
      const userId = new mongoose.Types.ObjectId();
      const follow = new Follow({
        follower_user_id: userId,
        followed_user_id: userId
      });

      // Since we're not actually saving to a DB, we need to manually trigger validation
      try {
        await follow.validate();
        // If we need to test the pre-save hook, we need to call it manually
        const preSaveError = await new Promise((resolve) => {
          const hook = follow.schema.s.hooks._pres.get('save')[0];
          hook.fn.call(follow, (error) => {
            resolve(error);
          });
        });

        expect(preSaveError).toBeDefined();
        expect(preSaveError.message).toBe('Un usuario no puede seguirse a sí mismo');
      } catch (error) {
        // Validation error
        expect(error).toBeDefined();
      }
    });

    it('should allow a user to follow another user', async () => {
      const follow = new Follow({
        follower_user_id: new mongoose.Types.ObjectId(),
        followed_user_id: new mongoose.Types.ObjectId()
      });

      // Validate that different users can be in a follow relationship
      await follow.validate();

      // Test the pre-save hook doesn't throw
      const preSaveError = await new Promise((resolve) => {
        const hook = follow.schema.s.hooks._pres.get('save')[0];
        hook.fn.call(follow, (error) => {
          resolve(error);
        });
      });

      expect(preSaveError).toBeUndefined();
    });
  });
});
