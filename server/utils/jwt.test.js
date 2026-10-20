import { describe, it, expect, beforeAll } from 'vitest';
import { generateAccessToken, verifyAccessToken } from './jwt.js';

describe('JWT Utility', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('should generate and verify an access token', () => {
    const payload = { userId: 1, role: 'admin' };
    const token = generateAccessToken(payload);

    expect(token).toBeDefined();

    const decoded = verifyAccessToken(token);
    expect(decoded).toMatchObject(payload);
  });

  it('should throw error for invalid access token', () => {
    expect(() => verifyAccessToken('invalid-token')).toThrow();
  });
});
