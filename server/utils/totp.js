import { generateSecret, generateSync, verifySync, generateURI } from 'otplib';
import QRCode from 'qrcode';

const TOTP_OPTIONS = {
  window: 1,
  step: 30,
  digits: 6,
};

export function createSecret() {
  return generateSecret(32);
}

export function createKeyUri(secret, username, issuer = 'Pizza Admin') {
  return generateURI({
    issuer,
    label: username,
    secret,
    digits: 6,
    period: 30,
  });
}

export async function createQRCodeDataURI(keyUri) {
  return QRCode.toDataURL(keyUri);
}

export function verifyTOTP(token, secret) {
  const result = verifySync({ token, secret, ...TOTP_OPTIONS });
  return result.valid;
}

export function generateCurrentToken(secret) {
  return generateSync({ secret, ...TOTP_OPTIONS });
}
