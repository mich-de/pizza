import jwt from 'jsonwebtoken';

const { sign, verify } = jwt;

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

export function generateAccessToken(payload) {
  return sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

export function generateRefreshToken(payload) {
  return sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

export function verifyAccessToken(token) {
  return verify(token, process.env.JWT_SECRET);
}

export function verifyRefreshToken(token) {
  return verify(token, process.env.JWT_REFRESH_SECRET);
}

export const ACCESS_EXPIRES_MS = 15 * 60 * 1000;
export const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;
