import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token for QR generation
 */
export const generateSecureQrToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash QR token using SHA-256 (matches ADR-007 and Workflow 8 & 9)
 */
export const hashToken = (token) => {
  const salt = process.env.QR_HMAC_SECRET || 'gatherly_default_qr_hmac_secret_32';
  return crypto.createHmac('sha256', salt).update(token).digest('hex');
};

export default {
  generateSecureQrToken,
  hashToken,
};
