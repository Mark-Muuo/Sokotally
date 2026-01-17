import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
};

cloudinary.config(cloudinaryConfig);

// Avatar storage configuration
export const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      resource_type: "image",
      folder: "sokotally/avatars",
      format: "png", // Convert all to png
      transformation: [{ width: 500, height: 500, crop: "limit" }],
      public_id: `avatar-${req.userId || "user"}-${Date.now()}`,
    };
  },
});

// Voice recording storage configuration
export const voiceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req, file) => {
    const fileExtension = file.originalname?.split(".").pop()?.toLowerCase();
    return {
      folder: "sokotally/voice",
      allowed_formats: ["webm", "mp3", "wav", "ogg", "m4a"],
      resource_type: "video", // Cloudinary uses 'video' for audio files
      public_id: `voice-${Date.now()}`,
      format: fileExtension || undefined,
    };
  },
});

export default cloudinary;
