import { SystemHealth } from "../models/SystemHealth.js";
import os from "os";

/**
 * Health Monitoring Service
 * Automatically tracks system health and performance
 */

let healthCheckInterval = null;

/**
 * Start periodic health checks
 */
export function startHealthMonitoring(intervalMs = 60000) {
  // Default: 1 minute
  if (healthCheckInterval) {
    console.log("Health monitoring already running");
    return;
  }

  console.log(`Starting health monitoring (interval: ${intervalMs}ms)`);

  // Run initial check
  recordHealthMetrics();

  // Set up periodic checks
  healthCheckInterval = setInterval(() => {
    recordHealthMetrics();
  }, intervalMs);
}

/**
 * Stop health monitoring
 */
export function stopHealthMonitoring() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    console.log("Health monitoring stopped");
  }
}

/**
 * Record current system health metrics
 */
async function recordHealthMetrics() {
  try {
    const currentMemory = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const cpuUsage = os.loadavg()[0]; // 1 minute load average

    const healthRecord = new SystemHealth({
      timestamp: new Date(),
      apiUptime: 100, // Will be calculated based on error rate
      avgResponseTime: 0, // Set by middleware
      memoryUsage: Math.round(currentMemory.heapUsed / 1024 / 1024),
      cpuUsage: parseFloat(cpuUsage.toFixed(2)),
      activeConnections: 0, // Can be tracked via middleware
      severity: "low",
      resolved: true,
    });

    await healthRecord.save();
  } catch (error) {
    console.error("Failed to record health metrics:", error);
  }
}

/**
 * Log an error event
 */
export async function logError(
  errorType,
  errorMessage,
  severity = "medium",
  errorStack = "",
) {
  try {
    const healthRecord = new SystemHealth({
      timestamp: new Date(),
      errorCount: 1,
      errorType,
      errorMessage,
      errorStack,
      severity,
      resolved: false,
    });

    await healthRecord.save();

    // Auto-resolve low severity errors after creation
    if (severity === "low") {
      setTimeout(
        async () => {
          healthRecord.resolved = true;
          await healthRecord.save();
        },
        5 * 60 * 1000,
      ); // Auto-resolve after 5 minutes
    }

    return healthRecord;
  } catch (error) {
    console.error("Failed to log error:", error);
  }
}

/**
 * Log suspicious activity for fraud detection
 */
export async function logSuspiciousActivity(
  activityType,
  ipAddresses = [],
  notes = "",
) {
  try {
    const healthRecord = new SystemHealth({
      timestamp: new Date(),
      suspiciousActivityType: activityType,
      flaggedIpAddresses: ipAddresses,
      severity: activityType === "ddos_pattern" ? "critical" : "high",
      notes,
      resolved: false,
    });

    await healthRecord.save();
    return healthRecord;
  } catch (error) {
    console.error("Failed to log suspicious activity:", error);
  }
}

/**
 * Update response time metric
 */
export async function updateResponseTime(responseTimeMs) {
  try {
    // Find the most recent health record and update it
    const latestRecord = await SystemHealth.findOne()
      .sort({ timestamp: -1 })
      .limit(1);

    if (latestRecord && latestRecord.timestamp > new Date(Date.now() - 60000)) {
      // Only update if record is less than 1 minute old
      latestRecord.avgResponseTime = responseTimeMs;
      await latestRecord.save();
    }
  } catch (error) {
    console.error("Failed to update response time:", error);
  }
}

/**
 * Middleware to track API performance
 */
export function performanceTrackingMiddleware(req, res, next) {
  const startTime = Date.now();

  // Track failed auth attempts
  const originalJson = res.json.bind(res);
  res.json = function (data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Log slow requests
    if (responseTime > 2000) {
      logError(
        "api",
        `Slow request: ${req.method} ${req.path} (${responseTime}ms)`,
        "low",
      );
    }

    // Track auth failures for fraud detection
    if (res.statusCode === 401 || res.statusCode === 403) {
      const userIp = req.ip || req.connection.remoteAddress;
      trackAuthFailure(userIp);
    }

    return originalJson(data);
  };

  next();
}

// Track auth failures per IP
const authFailures = new Map();

function trackAuthFailure(ip) {
  const failures = authFailures.get(ip) || { count: 0, timestamp: Date.now() };
  failures.count += 1;

  // Reset count after 10 minutes
  if (Date.now() - failures.timestamp > 10 * 60 * 1000) {
    failures.count = 1;
    failures.timestamp = Date.now();
  }

  authFailures.set(ip, failures);

  // Flag suspicious activity if too many failures
  if (failures.count > 5) {
    logSuspiciousActivity(
      "auth_failures",
      [ip],
      `${failures.count} auth failures from ${ip}`,
    );
  }
}

export default {
  startHealthMonitoring,
  stopHealthMonitoring,
  logError,
  logSuspiciousActivity,
  updateResponseTime,
  performanceTrackingMiddleware,
};
