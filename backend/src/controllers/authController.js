import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../models/User.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/generateToken.js';

// Password reset token in-memory / cache store (or simple hashed simulation)
const resetTokenStore = new Map();

/**
 * Register User (Workflow 2)
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, interests } = req.body;

  // 1. Check duplicate email
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, 'Email is already registered. Please log in.');
  }

  // 2. Hash password with bcrypt
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // 3. Save user in MongoDB
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: role || 'attendee',
    interests: interests || [],
    accountStatus: 'active',
  });

  // 4. Generate JWT tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Set HTTP-only cookie for refresh token
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,
        },
        accessToken,
      },
      'Registration successful'
    )
  );
});

/**
 * Login User (Workflow 2)
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Check credentials
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // 2. Check if account is suspended
  if (user.accountStatus === 'suspended') {
    throw new ApiError(403, 'Your account has been suspended. Please contact platform support.');
  }

  // 3. Generate and issue JWT
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,
        },
        accessToken,
        // Guide client for role-based dashboard redirection
        redirectDashboard: `/${user.role}/dashboard`,
      },
      'Login successful'
    )
  );
});

/**
 * Logout User
 */
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken');
  return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

/**
 * Refresh Access Token
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    throw new ApiError(401, 'Refresh token missing. Please log in again.');
  }

  try {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);

    if (!user || user.accountStatus === 'suspended') {
      throw new ApiError(403, 'User account invalid or suspended.');
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    return res.status(200).json(
      new ApiResponse(200, { accessToken: newAccessToken }, 'Token refreshed successfully')
    );
  } catch (error) {
    throw new ApiError(403, 'Invalid or expired refresh token');
  }
});

/**
 * Forgot Password - Send Reset Token (Workflow 2)
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Return standard success to prevent user enumeration
    return res.status(200).json(
      new ApiResponse(200, null, 'If this email is registered, a password reset link has been dispatched.')
    );
  }

  // Generate secure random reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Store token with 15-minute expiration
  resetTokenStore.set(tokenHash, {
    userId: user._id,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        message: 'Password reset token generated (simulated email dispatch)',
        resetToken, // Returned in dev response for testing
      },
      'Password reset instructions sent to email.'
    )
  );
});

/**
 * Reset Password (Workflow 2)
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const tokenData = resetTokenStore.get(tokenHash);

  if (!tokenData || tokenData.expiresAt < Date.now()) {
    throw new ApiError(400, 'Expired or invalid password reset link.');
  }

  const user = await User.findById(tokenData.userId);
  if (!user) {
    throw new ApiError(404, 'User account not found.');
  }

  const salt = await bcrypt.genSalt(12);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  await user.save();

  // Invalidate token
  resetTokenStore.delete(tokenHash);

  return res.status(200).json(
    new ApiResponse(200, null, 'Password reset successful. You may now log in with your new credentials.')
  );
});

/**
 * Get Current Profile (/api/v1/auth/me)
 */
export const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, { user: req.user }, 'Current user profile fetched')
  );
});

export default {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
};
