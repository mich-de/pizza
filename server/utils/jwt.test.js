import { describe, it, expect, beforeAll } from 'vitest';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from './jwt.js';

describe('JWT Utility', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  it('should generate and verify an access token', () => {
    const payload = { userId: 1, role: 'admin' };
    const token = generateAccessToken(payload);
    
    expect(token).toBeDefined();
    
    const decoded = verifyAccessToken(token);
    expect(decoded).toMatchObject(payload);
  });

  it('should generate and verify a refresh token', () => {
    const payload = { userId: 1 };
    const token = generateRefreshToken(payload);
    
    expect(token).toBeDefined();
    
    const decoded = verifyRefreshToken(token);
    expect(decoded).toMatchObject(payload);
  });

  it('should throw error for invalid access token', () => {
    expect(() => verifyAccessToken('invalid-token')).toThrow();
  });
});
