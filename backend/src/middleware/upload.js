import multer from "multer";
import { avatarStorage, voiceStorage } from "../config/cloudinary.js";

// File filter to only allow images
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// File filter for voice recordings
const audioFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "audio/webm",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/m4a",
    "audio/mpeg",
  ];
  if (
    allowedMimeTypes.includes(file.mimetype) ||
    file.mimetype.startsWith("audio/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only audio files are allowed!"), false);
  }
};

// Configure multer for avatar uploads (using Cloudinary)
const upload = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Configure multer for voice uploads (using Cloudinary)
const voiceUpload = multer({
  storage: voiceStorage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for audio
  },
});

export { upload, voiceUpload };
