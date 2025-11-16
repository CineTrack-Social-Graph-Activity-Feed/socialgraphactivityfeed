const { normalizeProfile, serializeUser } = require('../../controllers/authController');

describe('authController helpers', () => {
  describe('normalizeProfile', () => {
    it('should normalize a full profile', () => {
      const input = {
        user_id: '123',
        sub: 'testuser',
        email: 'TEST@EXAMPLE.COM',
        image_url: 'http://img.com/avatar.png'
      };
      const result = normalizeProfile(input);
      expect(result).toEqual({
        user_id: 123,
        username: 'testuser',
        email: 'test@example.com',
        avatar_url: 'http://img.com/avatar.png'
      });
    });
    it('should fallback username to email prefix', () => {
      const input = { user_id: '1', email: 'foo@bar.com' };
      const result = normalizeProfile(input);
      expect(result.username).toBe('foo');
    });
    it('should handle missing fields', () => {
      const input = {};
      const result = normalizeProfile(input);
      expect(result).toEqual({
        user_id: undefined,
        username: undefined,
        email: '',
        avatar_url: null
      });
    });
  });

  describe('serializeUser', () => {
    it('should serialize a user object', () => {
      const user = {
        _id: 'abc',
        user_id: 1,
        username: 'foo',
        email: 'foo@bar.com',
        avatar_url: 'img',
        created_at: '2025-11-15T00:00:00Z'
      };
      expect(serializeUser(user)).toEqual({
        id: 'abc',
        user_id: 1,
        username: 'foo',
        email: 'foo@bar.com',
        avatar_url: 'img',
        created_at: '2025-11-15T00:00:00Z'
      });
    });
  });
});
