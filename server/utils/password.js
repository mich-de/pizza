import { hash, verify } from '@node-rs/argon2';

const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plain) {
  return hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(plain, hashed) {
  return verify(hashed, plain);
}
