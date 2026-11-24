import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token for QR generation
 */
export const generateSecureQrToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create a signed ticket token without exposing predictable booking IDs
 */
export const createSignedTicketToken = (ticketId, registrationId, userId) => {
  const secret = process.env.QR_HMAC_SECRET || 'gatherly_default_qr_hmac_secret_32';
  const payload = `${ticketId}:${registrationId}:${userId}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `GAT-${Buffer.from(payload).toString('base64url')}-${signature.slice(0, 16)}`;
};

/**
 * Hash QR token using HMAC SHA-256 (matches ADR-007 and Workflow 8 & 9)
 */
export const hashToken = (token) => {
  const salt = process.env.QR_HMAC_SECRET || 'gatherly_default_qr_hmac_secret_32';
  return crypto.createHmac('sha256', salt).update(token).digest('hex');
};

export default {
  generateSecureQrToken,
  createSignedTicketToken,
  hashToken,
};
