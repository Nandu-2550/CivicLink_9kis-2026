const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary with provided credentials
const cloudinaryConfig = {
  cloud_name: 'dd3etpbjs',
  api_key: '982567721524427',
  api_secret: '1HfwNkrSHCXzjGP0jCek_CwDwT4'
};
cloudinary.config(cloudinaryConfig);

// Create Cloudinary storage engine for multer
const createCloudinaryStorage = (folder) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder || "civiclink",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
      transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto" }]
    }
  });
};

module.exports = {
  cloudinary,
  createCloudinaryStorage
};