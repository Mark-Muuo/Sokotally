import { AIUsage } from "../models/AIUsage.js";
import { User } from "../models/User.js";

/**
 * AI Usage Monitoring Controller
 * Track and analyze AI interactions
 */

/**
 * Get AI usage statistics
 */
export async function getAIUsageStats(req, res) {
  try {
    const { timeRange = "7d" } = req.query;
    const timeFilter = getTimeFilter(timeRange);

    // Overall stats
    const totalRequests = await AIUsage.countDocuments({
      timestamp: { $gte: timeFilter },
    });
    const successfulRequests = await AIUsage.countDocuments({
      timestamp: { $gte: timeFilter },
      success: true,
    });
    const failedRequests = totalRequests - successfulRequests;

    // Token usage and response time
    const tokenStats = await AIUsage.aggregate([
      { $match: { timestamp: { $gte: timeFilter } } },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: "$tokensUsed" },
          avgTokens: { $avg: "$tokensUsed" },
          maxTokens: { $max: "$tokensUsed" },
          avgResponseTime: { $avg: "$responseTime" },
        },
      },
    ]);

    // By message type
    const byType = await AIUsage.aggregate([
      { $match: { timestamp: { $gte: timeFilter } } },
      {
        $group: {
          _id: "$messageType",
          count: { $sum: 1 },
          avgTokens: { $avg: "$tokensUsed" },
          avgResponseTime: { $avg: "$responseTime" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Active users
    const activeAIUsers = await AIUsage.distinct("userId", {
      timestamp: { $gte: timeFilter },
    });

    // Daily breakdown
    const dailyUsage = await AIUsage.aggregate([
      { $match: { timestamp: { $gte: timeFilter } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          requests: { $sum: 1 },
          tokens: { $sum: "$tokensUsed" },
        },
      },
      { $sort: { _id: 1 } },
    ]).then((results) =>
      results.map((r) => ({
        date: r._id,
        requests: r.requests,
        tokens: r.tokens,
      })),
    );

    const tokenData = tokenStats[0] || {
      totalTokens: 0,
      avgTokens: 0,
      maxTokens: 0,
      avgResponseTime: 0,
    };

    res.json({
      overview: {
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate:
          totalRequests > 0
            ? Math.min(
                100,
                parseFloat(
                  ((successfulRequests / totalRequests) * 100).toFixed(2),
                ),
              )
            : 0,
        activeUsers: activeAIUsers.length,
        totalTokens: tokenData.totalTokens,
        avgTokens: Math.round(tokenData.avgTokens || 0),
        maxTokens: tokenData.maxTokens,
        avgResponseTime: Math.round(tokenData.avgResponseTime || 0),
      },
      byType,
      dailyUsage,
      timeRange,
    });
  } catch (error) {
    console.error("Get AI usage stats error:", error);
    res.status(500).json({ error: "Failed to fetch AI usage statistics" });
  }
}

/**
 * Get AI usage by user
 */
export async function getAIUsageByUser(req, res) {
  try {
    const { timeRange = "7d", page = 1, limit = 20 } = req.query;
    const timeFilter = getTimeFilter(timeRange);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const userUsage = await AIUsage.aggregate([
      { $match: { timestamp: { $gte: timeFilter } } },
      {
        $group: {
          _id: "$userId",
          totalRequests: { $sum: 1 },
          totalTokens: { $sum: "$tokensUsed" },
          avgResponseTime: { $avg: "$responseTime" },
          successRate: {
            $avg: { $cond: ["$success", 1, 0] },
          },
        },
      },
      { $sort: { totalRequests: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    // Populate user details
    const populated = await User.populate(userUsage, {
      path: "_id",
      select: "name email phone",
    });

    res.json({
      users: populated.map((u) => ({
        user: u._id,
        totalRequests: u.totalRequests,
        totalTokens: u.totalTokens,
        avgResponseTime: Math.round(u.avgResponseTime || 0),
        successRate: (u.successRate * 100).toFixed(2),
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get AI usage by user error:", error);
    res.status(500).json({ error: "Failed to fetch user AI usage" });
  }
}

/**
 * Get recent AI interactions
 */
export async function getRecentAIInteractions(req, res) {
  try {
    const { limit = 50, messageType } = req.query;

    const query = {};
    if (messageType) {
      query.messageType = messageType;
    }

    const interactions = await AIUsage.find(query)
      .populate("userId", "name email")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({ interactions });
  } catch (error) {
    console.error("Get recent AI interactions error:", error);
    res.status(500).json({ error: "Failed to fetch recent interactions" });
  }
}

// Helper function
function getTimeFilter(timeRange) {
  const now = Date.now();
  switch (timeRange) {
    case "1h":
      return new Date(now - 60 * 60 * 1000);
    case "6h":
      return new Date(now - 6 * 60 * 60 * 1000);
    case "24h":
      return new Date(now - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
  }
}
