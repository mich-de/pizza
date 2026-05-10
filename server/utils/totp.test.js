import { describe, it, expect } from 'vitest';
import { createSecret, verifyTOTP, generateCurrentToken } from './totp.js';

describe('TOTP Utility', () => {
  it('should verify a valid TOTP token', () => {
    const secret = createSecret();
    const token = generateCurrentToken(secret);
    
    const isValid = verifyTOTP(token, secret);
    expect(isValid).toBe(true);
  });

  it('should fail verification for an invalid token', () => {
    const secret = createSecret();
    const isValid = verifyTOTP('000000', secret);
    expect(isValid).toBe(false);
  });
});
