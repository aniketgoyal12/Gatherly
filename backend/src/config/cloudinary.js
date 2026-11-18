import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const isPlaceholder = (val) =>
  !val || val.includes('your_') || val.includes('placeholder');

export const isCloudinaryConfigured = () => {
  return (
    !isPlaceholder(process.env.CLOUDINARY_CLOUD_NAME) &&
    !isPlaceholder(process.env.CLOUDINARY_API_KEY) &&
    !isPlaceholder(process.env.CLOUDINARY_API_SECRET)
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Upload an in-memory image buffer to Cloudinary.
 * Falls back cleanly to local disk (`backend/uploads/`) when Cloudinary keys
 * are not configured yet in local development.
 */
export const uploadBufferToCloudinary = async (
  buffer,
  { folder = 'gatherly/events', originalName = 'image.jpg' } = {}
) => {
  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) return reject(error);
          return resolve({
            url: result.secure_url,
            publicId: result.public_id,
            storage: 'cloudinary',
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  // Local development fallback (no Cloudinary keys needed to test uploads!)
  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  const relativeDir = path.join('uploads', folder);
  const absoluteDir = path.resolve(relativeDir);

  fs.mkdirSync(absoluteDir, { recursive: true });
  fs.writeFileSync(path.join(absoluteDir, safeName), buffer);

  const normalizedRel = `${folder}/${safeName}`.replace(/\\/g, '/');

  return {
    url: `/uploads/${normalizedRel}`,
    publicId: `local:${normalizedRel}`,
    storage: 'local',
  };
};

/**
 * Delete a previously uploaded asset from Cloudinary or local fallback storage.
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  if (publicId.startsWith('local:')) {
    const relPath = publicId.replace(/^local:/, '');
    const filePath = path.resolve('uploads', relPath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return;
  }

  if (isCloudinaryConfigured()) {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  }
};

export default {
  cloudinary,
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
};
