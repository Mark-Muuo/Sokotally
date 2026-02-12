import mongoose from "mongoose";

/**
 * Feature Toggle System
 * Allows admin to enable/disable features system-wide
 */
const featureToggleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    key: { type: String, required: true, unique: true },
    description: { type: String },
    enabled: { type: Boolean, default: true },
    category: {
      type: String,
      enum: ["feature", "experimental", "maintenance", "security"],
      default: "feature",
    },
    affectedUsers: {
      type: String,
      enum: ["all", "admin", "beta", "specific"],
      default: "all",
    },
    enabledForUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    metadata: { type: Object, default: {} },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastModifiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

featureToggleSchema.index({ enabled: 1 });

export const FeatureToggle = mongoose.model(
  "FeatureToggle",
  featureToggleSchema,
);
