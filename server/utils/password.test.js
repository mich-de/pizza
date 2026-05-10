import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('Password Utility', () => {
  it('should hash and verify a password correctly', async () => {
    const password = 'StrongPassword123!';
    const hash = await hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should fail verification with wrong password', async () => {
    const password = 'StrongPassword123!';
    const hash = await hashPassword(password);
    
    const isValid = await verifyPassword('WrongPassword', hash);
    expect(isValid).toBe(false);
  });
});
