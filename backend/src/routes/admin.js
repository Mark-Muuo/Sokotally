import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { adminAuthMiddleware } from "../middleware/adminAuth.js";
import {
  getDashboardStats,
  getSystemHealth,
  getFraudFlags,
  getUserGrowthAnalytics,
  resolveIssue,
  logSystemEvent,
} from "../controllers/adminController.js";
import {
  getAllUsers,
  getUserDetails,
  promoteToAdmin,
  demoteFromAdmin,
  suspendUser,
  unsuspendUser,
  deleteUser,
} from "../controllers/userManagementController.js";
import {
  getAllFeatures,
  createFeature,
  toggleFeature,
  updateFeature,
  deleteFeature,
} from "../controllers/featureToggleController.js";
import {
  getAIUsageStats,
  getAIUsageByUser,
  getRecentAIInteractions,
} from "../controllers/aiMonitoringController.js";
import {
  getUsageAnalytics,
  getEngagementMetrics,
} from "../controllers/usageAnalyticsController.js";
import {
  getFinancialOverview,
  getTransactionTrends,
} from "../controllers/financialAnalyticsController.js";
const router = express.Router();

// All routes require authentication + admin role
router.use(authMiddleware);
router.use(adminAuthMiddleware);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get dashboard overview with redacted user stats
 * @access  Admin only
 */
router.get("/dashboard", getDashboardStats);

/**
 * @route   GET /api/admin/system-health
 * @desc    Get detailed system health metrics
 * @query   timeRange: 1h, 6h, 24h, 7d, 30d
 * @access  Admin only
 */
router.get("/system-health", getSystemHealth);

/**
 * @route   GET /api/admin/fraud-flags
 * @desc    Get fraud detection flags (app security issues)
 * @access  Admin only
 */
router.get("/fraud-flags", getFraudFlags);

/**
 * @route   GET /api/admin/analytics/growth
 * @desc    Get user growth analytics (aggregated, no PII)
 * @query   period: week, month, year
 * @access  Admin only
 */
router.get("/analytics/growth", getUserGrowthAnalytics);

/**
 * @route   PATCH /api/admin/issues/:issueId/resolve
 * @desc    Mark a system issue as resolved
 * @access  Admin only
 */
router.patch("/issues/:issueId/resolve", resolveIssue);

/**
 * @route   POST /api/admin/events
 * @desc    Log a system event (for monitoring)
 * @access  Admin only
 */
router.post("/events", logSystemEvent);
// ==================== USER MANAGEMENT ====================

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination and search
 * @query   page, limit, search, role, sortBy, order
 * @access  Admin only
 */
router.get("/users", getAllUsers);

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get user details
 * @access  Admin only
 */
router.get("/users/:userId", getUserDetails);

/**
 * @route   POST /api/admin/users/:userId/promote
 * @desc    Promote user to admin
 * @access  Admin only
 */
router.post("/users/:userId/promote", promoteToAdmin);

/**
 * @route   POST /api/admin/users/:userId/demote
 * @desc    Demote admin to user
 * @access  Admin only
 */
router.post("/users/:userId/demote", demoteFromAdmin);

/**
 * @route   POST /api/admin/users/:userId/suspend
 * @desc    Suspend user account
 * @access  Admin only
 */
router.post("/users/:userId/suspend", suspendUser);

/**
 * @route   POST /api/admin/users/:userId/unsuspend
 * @desc    Unsuspend user account
 * @access  Admin only
 */
router.post("/users/:userId/unsuspend", unsuspendUser);

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete user permanently
 * @access  Admin only
 */
router.delete("/users/:userId", deleteUser);

// ==================== FEATURE  TOGGLES ====================

/**
 * @route   GET /api/admin/features
 * @desc    Get all feature toggles
 * @access  Admin only
 */
router.get("/features", getAllFeatures);

/**
 * @route   POST /api/admin/features
 * @desc    Create new feature toggle
 * @access  Admin only
 */
router.post("/features", createFeature);

/**
 * @route   PATCH /api/admin/features/:featureId/toggle
 * @desc    Toggle feature on/off
 * @access  Admin only
 */
router.patch("/features/:featureId/toggle", toggleFeature);

/**
 * @route   PUT /api/admin/features/:featureId
 * @desc    Update feature settings
 * @access  Admin only
 */
router.put("/features/:featureId", updateFeature);

/**
 * @route   DELETE /api/admin/features/:featureId
 * @desc    Delete feature toggle
 * @access  Admin only
 */
router.delete("/features/:featureId", deleteFeature);

// ==================== AI MONITORING ====================

/**
 * @route   GET /api/admin/ai/stats
 * @desc    Get AI usage statistics
 * @query   timeRange: 1h, 6h, 24h, 7d, 30d
 * @access  Admin only
 */
router.get("/ai/stats", getAIUsageStats);

/**
 * @route   GET /api/admin/ai/by-user
 * @desc    Get AI usage by user
 * @query   timeRange, page, limit
 * @access  Admin only
 */
router.get("/ai/by-user", getAIUsageByUser);

/**
 * @route   GET /api/admin/ai/recent
 * @desc    Get recent AI interactions
 * @query   limit, messageType
 * @access  Admin only
 */
router.get("/ai/recent", getRecentAIInteractions);

// ==================== USAGE ANALYTICS ====================

/**
 * @route   GET /api/admin/usage/analytics
 * @desc    Get comprehensive usage analytics
 * @query   timeRange: 24h, 7d, 30d, 90d
 * @access  Admin only
 */
router.get("/usage/analytics", getUsageAnalytics);

/**
 * @route   GET /api/admin/usage/engagement
 * @desc    Get user engagement metrics
 * @query   timeRange
 * @access  Admin only
 */
router.get("/usage/engagement", getEngagementMetrics);

// ==================== FINANCIAL ANALYTICS ====================

/**
 * @route   GET /api/admin/financial/overview
 * @desc    Get aggregated financial overview (counts only)
 * @query   timeRange
 * @access  Admin only
 */
router.get("/financial/overview", getFinancialOverview);

/**
 * @route   GET /api/admin/financial/trends
 * @desc    Get transaction trends
 * @query   timeRange
 * @access  Admin only
 */
router.get("/financial/trends", getTransactionTrends);
export default router;
