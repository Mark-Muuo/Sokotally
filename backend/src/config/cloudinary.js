import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Avatar storage configuration
export const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sokotally/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
    public_id: (req, file) => `avatar-${req.user.userId}-${Date.now()}`,
  },
});

// Voice recording storage configuration
export const voiceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sokotally/voice",
    allowed_formats: ["webm", "mp3", "wav", "ogg", "m4a"],
    resource_type: "video", // Cloudinary uses 'video' for audio files
    public_id: (req, file) => `voice-${Date.now()}`,
  },
});

export default cloudinary;
