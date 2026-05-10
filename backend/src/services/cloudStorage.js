const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const logger = require('../utils/logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (file, type = 'auto') => {
  try {
    let result;
    const resourceType = type === 'image' ? 'image' : type === 'audio' ? 'video' : 'auto';

    if (typeof file === 'string' && file.startsWith('data:')) {
      // Base64 upload
      result = await cloudinary.uploader.upload(file, {
        resource_type: resourceType,
        folder: 'safeher/evidence',
        eager_async: true
      });
    } else if (typeof file === 'string' && fs.existsSync(file)) {
      // File path upload
      result = await cloudinary.uploader.upload(file, {
        resource_type: resourceType,
        folder: 'safeher/evidence',
        eager_async: true
      });
    } else {
      throw new Error('Invalid file input');
    }

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      duration: result.duration || 0
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw error;
  }
};

const deleteFromCloudinary = async (publicId, type = 'image') => {
  try {
    const resourceType = type === 'image' ? 'image' : 'video';
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return true;
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw error;
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
