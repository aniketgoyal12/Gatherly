import { verifyAccessToken } from '../utils/generateToken.js';
import ApiError from '../utils/apiError.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new ApiError(401, 'Authentication token missing. Please log in.'));
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return next(new ApiError(401, 'User account no longer exists.'));
    }

    if (user.accountStatus === 'suspended') {
      return next(new ApiError(403, 'Your account has been suspended. Please contact support.'));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired token. Please log in again.'));
  }
};

export default protect;
