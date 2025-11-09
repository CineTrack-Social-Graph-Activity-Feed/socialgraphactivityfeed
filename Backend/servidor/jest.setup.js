// Jest setup file
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cinetrack-test';
process.env.JWT_SECRET = 'test-secret-key';
