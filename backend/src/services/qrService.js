import crypto from 'crypto';
import QRCode from 'qrcode';

/**
 * QR Code Service (ADR-007)
 * - Generates secure cryptographically random 32-byte hex tokens
 * - Generates HMAC-SHA256 hash for database storage (mitigates database leakage)
 * - Generates high-resolution QR Code Data URLs and PNG Buffers for email attachments
 * - Timing-safe verification of scanned QR tokens against stored hashes
 */

export const generateSecureQrToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashToken = (token) => {
  const secret = process.env.QR_HMAC_SECRET || 'gatherly_default_qr_hmac_secret_32';
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
};

export const verifyQrToken = (rawToken, storedHash) => {
  if (!rawToken || !storedHash) return false;
  const computedHash = hashToken(rawToken);
  
  // Timing safe comparison to mitigate timing attacks
  const bufA = Buffer.from(computedHash, 'utf8');
  const bufB = Buffer.from(storedHash, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Generate Base64 Data URL for QR Code (used in frontend and HTML emails)
 */
export const generateQrDataUrl = async (token, options = {}) => {
  try {
    const opts = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      scale: 8,
      color: {
        dark: '#0f172a',  // Primary Navy
        light: '#ffffff', // Background White
      },
      ...options,
    };
    return await QRCode.toDataURL(token, opts);
  } catch (error) {
    console.error('[QR Service] Failed to generate QR Data URL:', error.message);
    throw error;
  }
};

/**
 * Generate binary Buffer for QR Code (used for email image attachments)
 */
export const generateQrBuffer = async (token, options = {}) => {
  try {
    const opts = {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 2,
      scale: 8,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      ...options,
    };
    return await QRCode.toBuffer(token, opts);
  } catch (error) {
    console.error('[QR Service] Failed to generate QR Buffer:', error.message);
    throw error;
  }
};

export default {
  generateSecureQrToken,
  hashToken,
  verifyQrToken,
  generateQrDataUrl,
  generateQrBuffer,
};
