import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import ApiError from '../utils/apiError.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';

/**
 * Authentication Service
 * Centralizes password encryption, JWT issuance, and secure reset token operations
 */

export const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainPassword, salt);
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

export const createAuthSession = async (user, res = null) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store hashed refresh token in database (ADR-004)
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  user.refreshToken = refreshTokenHash;
  await user.save({ validateBeforeSave: false });

  // Optional: set secure HTTP-only cookies if response object is passed
  if (res && typeof res.cookie === 'function') {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'gatherly_default_refresh_secret_key');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== tokenHash) {
      throw new ApiError(403, 'Invalid or expired refresh token');
    }

    return user;
  } catch (error) {
    throw new ApiError(403, error.message || 'Invalid refresh token');
  }
};

export const generateResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  return { resetToken, hashedToken, expiresAt };
};

export default {
  hashPassword,
  comparePassword,
  createAuthSession,
  verifyRefreshToken,
  generateResetToken,
};
