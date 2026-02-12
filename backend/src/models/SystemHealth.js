import mongoose from "mongoose";

/**
 * System Health Monitoring
 * Tracks API performance, errors, and system issues
 */
const systemHealthSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },

    // API Performance
    apiUptime: { type: Number, default: 100 }, // percentage
    avgResponseTime: { type: Number, default: 0 }, // milliseconds

    // Error tracking
    errorCount: { type: Number, default: 0 },
    errorType: {
      type: String,
      enum: ["database", "api", "auth", "validation", "external", "other"],
      default: "other",
    },
    errorMessage: { type: String },
    errorStack: { type: String },

    // System metrics
    activeConnections: { type: Number, default: 0 },
    memoryUsage: { type: Number }, // in MB
    cpuUsage: { type: Number }, // percentage

    // Sync status
    syncErrors: { type: Number, default: 0 },
    lastSyncTimestamp: { type: Date },

    // Fraud detection flags (app-level anomalies only)
    suspiciousActivityType: {
      type: String,
      enum: [
        "rapid_requests",
        "auth_failures",
        "invalid_tokens",
        "ddos_pattern",
        "none",
      ],
      default: "none",
    },
    flaggedIpAddresses: [{ type: String }],

    // Metadata
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    resolved: { type: Boolean, default: false },
    notes: { type: String },
  },
  { timestamps: true },
);

// Index for quick lookups
systemHealthSchema.index({ timestamp: -1 });
systemHealthSchema.index({ severity: 1, resolved: 1 });
systemHealthSchema.index({ suspiciousActivityType: 1 });

export const SystemHealth = mongoose.model("SystemHealth", systemHealthSchema);
