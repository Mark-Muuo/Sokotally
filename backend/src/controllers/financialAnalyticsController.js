import Transaction from "../models/Transaction.js";
import { User } from "../models/User.js";

/**
 * Financial Analytics Controller
 * Aggregate financial data across all users (admin overview only)
 * NO individual user transaction details exposed
 */

/**
 * Get aggregated financial overview
 */
export async function getFinancialOverview(req, res) {
  try {
    const { timeRange = "30d" } = req.query;
    const timeFilter = getTimeFilter(timeRange);

    // Platform-wide aggregated metrics only
    const metrics = await Transaction.aggregate([
      { $match: { createdAt: { $gte: timeFilter } } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    // Daily transaction volume (count only, not amounts)
    const dailyVolume = await Transaction.aggregate([
      { $match: { createdAt: { $gte: timeFilter } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: "$type",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    // Active users with transactions
    const activeTransactors = await Transaction.distinct("userId", {
      createdAt: { $gte: timeFilter },
    });

    res.json({
      overview: {
        sales: metrics.find((m) => m._id === "sale")?.count || 0,
        expenses: metrics.find((m) => m._id === "expense")?.count || 0,
        activeUsers: activeTransactors.length,
        note: "Amounts hidden for privacy - counts only",
      },
      dailyVolume: dailyVolume.map((d) => ({
        date: d._id.date,
        type: d._id.type,
        count: d.count,
      })),
      timeRange,
    });
  } catch (error) {
    console.error("Get financial overview error:", error);
    res.status(500).json({ error: "Failed to fetch financial overview" });
  }
}

/**
 * Get transaction trends (counts, not amounts)
 */
export async function getTransactionTrends(req, res) {
  try {
    const { timeRange = "30d" } = req.query;
    const timeFilter = getTimeFilter(timeRange);

    const trends = await Transaction.aggregate([
      { $match: { createdAt: { $gte: timeFilter } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: "$type",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    res.json({ trends, timeRange });
  } catch (error) {
    console.error("Get transaction trends error:", error);
    res.status(500).json({ error: "Failed to fetch transaction trends" });
  }
}

function getTimeFilter(timeRange) {
  const now = Date.now();
  switch (timeRange) {
    case "24h":
      return new Date(now - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
  }
}
