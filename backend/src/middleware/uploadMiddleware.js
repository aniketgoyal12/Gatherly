import multer from 'multer';
import ApiError from '../utils/apiError.js';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new ApiError(
        400,
        'Unsupported file format. Only JPEG, PNG, WEBP, and GIF images are allowed.'
      )
    );
  }
  return cb(null, true);
};

const uploader = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
});

/**
 * Middleware factory for single image upload with clean ApiError handling.
 * Example: router.patch('/:id/banner', protect, uploadSingleImage('banner'), uploadEventBanner);
 */
export const uploadSingleImage = (fieldName = 'banner') => {
  return (req, res, next) => {
    uploader.single(fieldName)(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ApiError(400, 'File too large. Maximum allowed image size is 5MB.')
          );
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(
            new ApiError(400, `Unexpected file field. Please upload using field name '${fieldName}'.`)
          );
        }
        return next(new ApiError(400, `Upload error: ${err.message}`));
      }

      return next(err);
    });
  };
};

export default {
  uploadSingleImage,
};
