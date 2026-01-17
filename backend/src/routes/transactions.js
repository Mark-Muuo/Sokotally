import { Router } from "express";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Debt from "../models/Debt.js";
import Customer from "../models/Customer.js";
import { authMiddleware } from "../middleware/auth.js";
import { getLLMResponse } from "../services/llmService.js";

const router = Router();

// Helper to convert string userId to ObjectId
const toObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return id;
  }
};

// List with basic filters
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { from, to, type } = req.query;
    const query = { userId: toObjectId(req.userId) };
    if (type) query.type = type;
    if (from || to) {
      query.occurredAt = {};
      if (from) query.occurredAt.$gte = new Date(from);
      if (to) query.occurredAt.$lte = new Date(to);
    }
    const rows = await Transaction.find(query).sort({ occurredAt: -1 });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// Create transaction
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const doc = await Transaction.create({
      ...req.body,
      userId: toObjectId(req.userId),
    });
    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", authMiddleware, async (req, res, next) => {
  try {
    const doc = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: toObjectId(req.userId) },
      req.body,
      { new: true },
    );
    if (!doc) return res.status(404).json({ error: "Not Found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const out = await Transaction.deleteOne({
      _id: req.params.id,
      userId: toObjectId(req.userId),
    });
    res.json({ ok: out.deletedCount === 1 });
  } catch (e) {
    next(e);
  }
});

// Dashboard statistics endpoint
router.get("/stats/dashboard", authMiddleware, async (req, res, next) => {
  try {
    const userId = toObjectId(req.userId);
    const now = new Date();

    // Today (from midnight to now) - full 24 hours
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    todayEnd.setHours(23, 59, 59, 999);

    // Yesterday (full day)
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    yesterdayEnd.setMilliseconds(-1);

    // Today's sales and expenses (full day)
    const [todaySalesAgg] = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: "income",
          occurredAt: { $gte: todayStart, $lte: todayEnd },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const [todayExpensesAgg] = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: "expense",
          occurredAt: { $gte: todayStart, $lte: todayEnd },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Yesterday's sales and expenses for comparison
    const [yesterdaySalesAgg] = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: "income",
          occurredAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const [yesterdayExpensesAgg] = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: "expense",
          occurredAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const sales = todaySalesAgg?.total || 0;
    const expenses = todayExpensesAgg?.total || 0;
    const profit = sales - expenses;

    const prevSales = yesterdaySalesAgg?.total || 0;
    const prevExpenses = yesterdayExpensesAgg?.total || 0;
    const prevProfit = prevSales - prevExpenses;

    // Calculate percentage changes compared to yesterday
    // If yesterday has data, calculate normal percentage
    // If yesterday is 0 but today has data, show as 0 (new sales/expenses)
    // This prevents showing misleading 100% increase
    const salesTrend =
      prevSales > 0 ? ((sales - prevSales) / prevSales) * 100 : 0;
    const expensesTrend =
      prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;
    const profitTrend =
      prevProfit !== 0
        ? ((profit - prevProfit) / Math.abs(prevProfit)) * 100
        : 0;

    // Debts summary from Debt model
    const [outstandingDebtsAgg] = await Debt.aggregate([
      { $match: { userId, status: "unpaid" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    // Also get debts from Transaction model (type: 'debt')
    const [transactionDebtsAgg] = await Transaction.aggregate([
      { $match: { userId, type: "debt", status: "unpaid" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    const outstandingDebts =
      (outstandingDebtsAgg?.total || 0) + (transactionDebtsAgg?.total || 0);
    const outstandingDebtsCount =
      (outstandingDebtsAgg?.count || 0) + (transactionDebtsAgg?.count || 0);

    const inSevenDays = new Date();
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    const [dueSoonAgg] = await Debt.aggregate([
      {
        $match: {
          userId,
          status: "unpaid",
          dueDate: { $exists: true, $lte: inSevenDays },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    const dueSoonTotal = dueSoonAgg?.total || 0;
    const dueSoonCount = dueSoonAgg?.count || 0;

    // Get monthly aggregated data for charts (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySales = await Transaction.aggregate([
      {
        $match: { userId, type: "income", occurredAt: { $gte: sixMonthsAgo } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$occurredAt" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthlyExpenses = await Transaction.aggregate([
      {
        $match: { userId, type: "expense", occurredAt: { $gte: sixMonthsAgo } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$occurredAt" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Recent transactions from today only (to match dashboard stats)
    const recentTransactions = await Transaction.find({
      userId,
      occurredAt: { $gte: todayStart, $lte: todayEnd },
    })
      .sort({ occurredAt: -1 })
      .limit(50)
      .lean();

    // Sales by period for reports (supports range: daily, weekly, monthly)
    const { range } = req.query;
    let salesByDay = [];

    if (!range || range === "daily") {
      // last 7 days
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - 6);
      daysAgo.setHours(0, 0, 0, 0);

      salesByDay = await Transaction.aggregate([
        { $match: { userId, type: "income", occurredAt: { $gte: daysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);
    } else if (range === "weekly") {
      // last 28 days grouped by day (4 weeks)
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - 27);
      daysAgo.setHours(0, 0, 0, 0);

      salesByDay = await Transaction.aggregate([
        { $match: { userId, type: "income", occurredAt: { $gte: daysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);
    } else if (range === "monthly") {
      // last 6 months grouped by month
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - 5);
      monthsAgo.setHours(0, 0, 0, 0);

      salesByDay = await Transaction.aggregate([
        { $match: { userId, type: "income", occurredAt: { $gte: monthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$occurredAt" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);
    }

    // Top customers by sales (try to lookup Customer name)
    const topCustomers = await Transaction.aggregate([
      { $match: { userId, type: "income" } },
      {
        $group: {
          _id: "$customerId",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          customerId: "$_id",
          name: { $ifNull: ["$customer.name", "Walk-in Customer"] },
          total: 1,
          count: 1,
        },
      },
    ]);

    res.json({
      sales,
      expenses,
      profit,
      trends: {
        sales: Math.round(salesTrend * 10) / 10, // Round to 1 decimal
        expenses: Math.round(expensesTrend * 10) / 10,
        profit: Math.round(profitTrend * 10) / 10,
      },
      debts: {
        outstandingTotal: outstandingDebts,
        outstandingCount: outstandingDebtsCount,
        dueSoonTotal,
        dueSoonCount,
      },
      recentTransactions,
      monthlyData: {
        sales: monthlySales,
        expenses: monthlyExpenses,
      },
      salesByDay,
      topCustomers,
    });
  } catch (e) {
    next(e);
  }
});

// ============ NEW ANALYTICS ENDPOINTS ============

// Get report stats with date range filtering
router.get("/stats/report", authMiddleware, async (req, res, next) => {
  try {
    const userId = toObjectId(req.userId);
    const { startDate, endDate, period = "all" } = req.query;

    let dateFilter = { userId };
    let start, end;

    if (period === "month" && startDate) {
      // Specific month
      start = new Date(startDate);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setMilliseconds(-1);
      dateFilter.occurredAt = { $gte: start, $lte: end };
    } else if (startDate && endDate) {
      // Custom range
      start = new Date(startDate);
      end = new Date(endDate);
      dateFilter.occurredAt = { $gte: start, $lte: end };
    }
    // else: all-time (no date filter)

    // Sales and expenses for selected period
    const [salesAgg] = await Transaction.aggregate([
      { $match: { ...dateFilter, type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const [expensesAgg] = await Transaction.aggregate([
      { $match: { ...dateFilter, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const sales = salesAgg?.total || 0;
    const expenses = expensesAgg?.total || 0;
    const profit = sales - expenses;

    // Debts summary
    const [outstandingDebtsAgg] = await Debt.aggregate([
      { $match: { userId, status: "unpaid" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    const [transactionDebtsAgg] = await Transaction.aggregate([
      { $match: { userId, type: "debt", status: "unpaid" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    const outstandingDebts =
      (outstandingDebtsAgg?.total || 0) + (transactionDebtsAgg?.total || 0);
    const outstandingDebtsCount =
      (outstandingDebtsAgg?.count || 0) + (transactionDebtsAgg?.count || 0);

    // Recent transactions for the period
    const recentTransactions = await Transaction.find(dateFilter)
      .sort({ occurredAt: -1 })
      .limit(100)
      .lean();

    res.json({
      sales,
      expenses,
      profit,
      period:
        period === "month" && start
          ? `${start.toLocaleDateString("en-US", { year: "numeric", month: "long" })}`
          : period === "all"
            ? "All Time"
            : "Custom Range",
      dateRange:
        start && end
          ? { start: start.toISOString(), end: end.toISOString() }
          : null,
      debts: {
        outstandingTotal: outstandingDebts,
        outstandingCount: outstandingDebtsCount,
      },
      recentTransactions,
    });
  } catch (e) {
    next(e);
  }
});

// Get top selling items
router.get("/analytics/top-items", authMiddleware, async (req, res, next) => {
  try {
    const userId = toObjectId(req.userId);
    const { limit = 10, period = "all" } = req.query;

    const matchStage = {
      userId,
      type: "income",
      items: { $exists: true, $ne: [] },
    };

    // Add time filter if period specified
    if (period !== "all") {
      const now = new Date();
      let startDate = new Date();

      if (period === "today") {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (period === "month") {
        startDate.setMonth(now.getMonth() - 1);
      }

      matchStage.occurredAt = { $gte: startDate };
    }

    const topItems = await Transaction.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalPrice" },
          transactionCount: { $sum: 1 },
          avgPrice: { $avg: "$items.unitPrice" },
          unit: { $first: "$items.unit" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          itemName: "$_id",
          totalQuantity: 1,
          totalRevenue: 1,
          transactionCount: 1,
          avgPrice: { $round: ["$avgPrice", 2] },
          unit: 1,
          _id: 0,
        },
      },
    ]);

    res.json({ items: topItems, period });
  } catch (e) {
    next(e);
  }
});

// Get least selling items
router.get("/analytics/least-items", authMiddleware, async (req, res, next) => {
  try {
    const userId = toObjectId(req.userId);
    const { limit = 10, period = 30 } = req.query;

    const matchStage = {
      userId,
      type: "income",
      items: { $exists: true, $ne: [] },
    };

    // Time filter based on period (days)
    const now = new Date();
    const startDate = new Date();
    const periodDays = parseInt(period);

    if (periodDays > 0) {
      startDate.setDate(now.getDate() - periodDays);
      startDate.setHours(0, 0, 0, 0);
      matchStage.occurredAt = { $gte: startDate };
    }

    const leastItems = await Transaction.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: { $toLower: { $trim: { input: "$items.name" } } },
          originalName: { $first: "$items.name" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: {
              $ifNull: [
                "$items.totalPrice",
                { $multiply: ["$items.unitPrice", "$items.quantity"] },
              ],
            },
          },
          transactionCount: { $sum: 1 },
          avgPrice: { $avg: { $ifNull: ["$items.unitPrice", "$items.price"] } },
          unit: { $first: "$items.unit" },
        },
      },
      { $sort: { totalQuantity: 1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          itemName: "$originalName",
          totalQuantity: 1,
          totalRevenue: 1,
          transactionCount: 1,
          avgPrice: { $round: ["$avgPrice", 2] },
          unit: 1,
          _id: 0,
        },
      },
    ]);

    res.json({
      items: leastItems,
      period: periodDays > 0 ? `${periodDays} days` : "all time",
      message: leastItems.length === 0 ? "No sales data available" : null,
    });
  } catch (e) {
    next(e);
  }
});

// Get inventory insights (items sold vs stock)
router.get(
  "/analytics/inventory-insights",
  authMiddleware,
  async (req, res, next) => {
    try {
      const userId = toObjectId(req.userId);

      // Get sales by item
      const salesByItem = await Transaction.aggregate([
        {
          $match: { userId, type: "income", items: { $exists: true, $ne: [] } },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            soldQuantity: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.totalPrice" },
            unit: { $first: "$items.unit" },
          },
        },
        { $sort: { soldQuantity: -1 } },
      ]);

      // Get purchases by item
      const purchasesByItem = await Transaction.aggregate([
        {
          $match: {
            userId,
            type: "expense",
            items: { $exists: true, $ne: [] },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            purchasedQuantity: { $sum: "$items.quantity" },
            cost: { $sum: "$items.totalPrice" },
          },
        },
      ]);

      // Merge sales and purchases
      const inventory = salesByItem.map((sale) => {
        const purchase = purchasesByItem.find((p) => p._id === sale._id);
        return {
          itemName: sale._id,
          soldQuantity: sale.soldQuantity,
          purchasedQuantity: purchase?.purchasedQuantity || 0,
          revenue: sale.revenue,
          cost: purchase?.cost || 0,
          profit: sale.revenue - (purchase?.cost || 0),
          unit: sale.unit,
        };
      });

      res.json({ inventory });
    } catch (e) {
      next(e);
    }
  },
);

// Get sales trends by item over time
router.get("/analytics/item-trends", authMiddleware, async (req, res, next) => {
  try {
    const userId = toObjectId(req.userId);
    const { itemName, days = 30 } = req.query;

    if (!itemName) {
      return res
        .status(400)
        .json({ error: "itemName query parameter required" });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    daysAgo.setHours(0, 0, 0, 0);

    const trends = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: "income",
          occurredAt: { $gte: daysAgo },
          "items.name": itemName.toLowerCase(),
        },
      },
      { $unwind: "$items" },
      { $match: { "items.name": itemName.toLowerCase() } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          quantity: 1,
          revenue: 1,
          _id: 0,
        },
      },
    ]);

    res.json({ itemName, trends, period: `${days} days` });
  } catch (e) {
    next(e);
  }
});

// Generate comprehensive report
router.get("/reports/comprehensive", authMiddleware, async (req, res, next) => {
  try {
    const userId = toObjectId(req.userId);
    const { startDate, endDate, format = "json" } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const dateFilter = { userId, occurredAt: { $gte: start, $lte: end } };

    // Financial summary
    const [salesAgg] = await Transaction.aggregate([
      { $match: { ...dateFilter, type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    const [expensesAgg] = await Transaction.aggregate([
      { $match: { ...dateFilter, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    // Top items
    const topItems = await Transaction.aggregate([
      {
        $match: {
          ...dateFilter,
          type: "income",
          items: { $exists: true, $ne: [] },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.totalPrice" },
          unit: { $first: "$items.unit" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    // Daily breakdown
    const dailyBreakdown = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" },
            },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    const report = {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary: {
        totalSales: salesAgg?.total || 0,
        totalExpenses: expensesAgg?.total || 0,
        netProfit: (salesAgg?.total || 0) - (expensesAgg?.total || 0),
        salesCount: salesAgg?.count || 0,
        expensesCount: expensesAgg?.count || 0,
      },
      topItems: topItems.map((item) => ({
        name: item._id,
        quantity: item.quantity,
        revenue: item.revenue,
        unit: item.unit,
      })),
      dailyBreakdown,
    };

    res.json(report);
  } catch (e) {
    next(e);
  }
});

// AI-generated formatted report (Markdown, HTML, or PDF)
router.get("/reports/ai", authMiddleware, async (req, res, next) => {
  try {
    const userId = toObjectId(req.userId);
    const { startDate, endDate, format = "md", download = "1" } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const dateFilter = { userId, occurredAt: { $gte: start, $lte: end } };

    // Core aggregates
    const [salesAgg] = await Transaction.aggregate([
      { $match: { ...dateFilter, type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    const [expensesAgg] = await Transaction.aggregate([
      { $match: { ...dateFilter, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    const topItems = await Transaction.aggregate([
      {
        $match: {
          ...dateFilter,
          type: "income",
          items: { $exists: true, $ne: [] },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.totalPrice" },
          unit: { $first: "$items.unit" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    const dailyBreakdown = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" },
            },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    const summary = {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      totals: {
        sales: salesAgg?.total || 0,
        expenses: expensesAgg?.total || 0,
        profit: (salesAgg?.total || 0) - (expensesAgg?.total || 0),
      },
      counts: {
        sales: salesAgg?.count || 0,
        expenses: expensesAgg?.count || 0,
      },
      topItems: topItems.map((t) => ({
        name: t._id,
        quantity: t.quantity,
        revenue: t.revenue,
        unit: t.unit,
      })),
      daily: dailyBreakdown,
    };

    // Compose prompt
    const systemPrompt =
      "You are a business analyst creating a clear, concise report for a small shop. Keep it simple and actionable.";
    const userMessage = `Create a formatted ${format === "html" ? "HTML" : format === "pdf" ? "plain text" : "Markdown"} report titled "SokoTally Business Report" for the following period.

Data (JSON):\n\n${JSON.stringify(summary, null, 2)}\n\nRequirements:\n- Sections: Overview, Key Metrics, Top Items, Insights & Recommendations.\n- Currency is KSh. Use thousands separators.\n- Keep language simple and friendly.\n- For PDF format, use plain text with clear section headings and bullet points (no markdown syntax).`;

    let body = "";
    let aiGenerated = false;
    try {
      const ai = await getLLMResponse(userMessage, systemPrompt, []);
      body = ai.reply || "";
      aiGenerated = true;
    } catch (e) {
      // Fallback deterministic content if no LLM configured
      const lines = [];
      lines.push("# SokoTally Business Report");
      lines.push("");
      lines.push(
        `Period: ${new Date(summary.period.start).toLocaleDateString()} - ${new Date(summary.period.end).toLocaleDateString()}`,
      );
      lines.push("");
      lines.push("## Key Metrics");
      lines.push(`- Total Sales: KSh ${summary.totals.sales.toLocaleString()}`);
      lines.push(
        `- Total Expenses: KSh ${summary.totals.expenses.toLocaleString()}`,
      );
      lines.push(`- Net Profit: KSh ${summary.totals.profit.toLocaleString()}`);
      lines.push("");
      lines.push("## Top Items");
      if (summary.topItems.length) {
        lines.push("| Item | Quantity | Revenue |");
        lines.push("|---|---:|---:|");
        summary.topItems.forEach((it) =>
          lines.push(
            `| ${it.name} | ${it.quantity} ${it.unit || ""} | KSh ${it.revenue.toLocaleString()} |`,
          ),
        );
      } else {
        lines.push("_No top items for this period._");
      }
      lines.push("");
      lines.push("## Daily Breakdown");
      if (summary.daily.length) {
        lines.push("| Date | Type | Total |");
        lines.push("|---|---|---:|");
        summary.daily.forEach((d) =>
          lines.push(
            `| ${d._id.date} | ${d._id.type} | KSh ${d.total.toLocaleString()} |`,
          ),
        );
      } else {
        lines.push("_No daily data for this period._");
      }
      lines.push("");
      lines.push("## Insights & Recommendations");
      lines.push("- Keep recording transactions daily to improve accuracy.");
      lines.push("- Track best-selling items to maintain enough stock.");
      lines.push("- Review expenses that are growing week over week.");
      body = lines.join("\n");
    }

    // PDF format handling
    if (format === "pdf") {
      const PDFDocument = (await import("pdfkit")).default;
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=sokotally-ai-report-${new Date().toISOString().split("T")[0]}.pdf`,
      );

      // Parse content for PDF rendering
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("SokoTally AI Business Report", { align: "center" });
      doc.moveDown();
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          `Period: ${new Date(summary.period.start).toLocaleDateString()} - ${new Date(summary.period.end).toLocaleDateString()}`,
          { align: "center" },
        );
      doc.moveDown(2);

      // Key Metrics Section
      doc.fontSize(14).font("Helvetica-Bold").text("Key Metrics");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      doc.list([
        `Total Sales: KSh ${summary.totals.sales.toLocaleString()}`,
        `Total Expenses: KSh ${summary.totals.expenses.toLocaleString()}`,
        `Net Profit: KSh ${summary.totals.profit.toLocaleString()}`,
        `Sales Transactions: ${summary.counts.sales}`,
        `Expense Transactions: ${summary.counts.expenses}`,
      ]);
      doc.moveDown();

      // Top Items Section
      doc.fontSize(14).font("Helvetica-Bold").text("Top Selling Items");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      if (summary.topItems.length > 0) {
        summary.topItems.forEach((item, idx) => {
          doc.text(
            `${idx + 1}. ${item.name} - Qty: ${item.quantity} ${item.unit || ""} - Revenue: KSh ${item.revenue.toLocaleString()}`,
          );
        });
      } else {
        doc.text("No top items for this period.");
      }
      doc.moveDown();

      // AI Insights Section
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("AI Insights & Recommendations");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");

      if (aiGenerated) {
        // Parse AI-generated text for insights (remove markdown/HTML formatting)
        const cleanText = body
          .replace(/#+ /g, "")
          .replace(/\*\*/g, "")
          .replace(/\*/g, "")
          .replace(/\|/g, "")
          .replace(/<[^>]*>/g, "")
          .replace(/\n{3,}/g, "\n\n");

        // Extract insights section if present
        const insightsMatch = cleanText.match(
          /insights?[\s&]*recommendations?[:\n]+([\s\S]+)/i,
        );
        if (insightsMatch) {
          doc.text(insightsMatch[1].trim(), { align: "left" });
        } else {
          // Show full AI response if no specific insights section
          doc.text(cleanText, { align: "left" });
        }
      } else {
        // Fallback insights
        doc.list([
          "Keep recording transactions daily to improve accuracy.",
          "Track best-selling items to maintain enough stock.",
          "Review expenses that are growing week over week.",
          "Consider promoting your top-selling items to maximize revenue.",
        ]);
      }

      doc.end();
      doc.pipe(res);
      return;
    }

    if (format === "html") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      if (download === "1") {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="sokotally-ai-report-${new Date().toISOString().split("T")[0]}.html"`,
        );
      }
      return res.send(body);
    }

    // default markdown
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    if (download === "1") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="sokotally-ai-report-${new Date().toISOString().split("T")[0]}.md"`,
      );
    }
    return res.send(body);
  } catch (e) {
    next(e);
  }
});

// Export report as PDF (simple layout)
router.get("/reports/pdf", authMiddleware, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = toObjectId(req.userId);
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    const dateFilter = { userId, occurredAt: { $gte: start, $lte: end } };

    const [salesAgg] = await Transaction.aggregate([
      { $match: { ...dateFilter, type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);
    const [expensesAgg] = await Transaction.aggregate([
      { $match: { ...dateFilter, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    const topItems = await Transaction.aggregate([
      {
        $match: {
          ...dateFilter,
          type: "income",
          items: { $exists: true, $ne: [] },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.totalPrice" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]);

    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sokotally-report-${new Date().toISOString().split("T")[0]}.pdf`,
    );

    doc.fontSize(18).text("SokoTally Business Report", { align: "center" });
    doc.moveDown();
    doc
      .fontSize(10)
      .text(
        `Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      );
    doc.moveDown();

    doc.fontSize(12).text("Key Metrics");
    doc
      .fontSize(10)
      .list([
        `Total Sales: KSh ${(salesAgg?.total || 0).toLocaleString()}`,
        `Total Expenses: KSh ${(expensesAgg?.total || 0).toLocaleString()}`,
        `Net Profit: KSh ${((salesAgg?.total || 0) - (expensesAgg?.total || 0)).toLocaleString()}`,
      ]);
    doc.moveDown();

    doc.fontSize(12).text("Top Items");
    if (topItems.length === 0) {
      doc.fontSize(10).text("No top items for this period.");
    } else {
      topItems.forEach((it) => {
        doc
          .fontSize(10)
          .text(
            `${it._id} - Qty: ${it.quantity} - Revenue: KSh ${it.revenue.toLocaleString()}`,
          );
      });
    }

    doc.end();
    doc.pipe(res);
  } catch (e) {
    next(e);
  }
});

// Export transactions as CSV
router.get("/export", authMiddleware, async (req, res, next) => {
  try {
    const userId = toObjectId(req.userId);
    const { from, to, type } = req.query;
    const query = { userId };
    if (type) query.type = type;
    if (from || to) {
      query.occurredAt = {};
      if (from) query.occurredAt.$gte = new Date(from);
      if (to) query.occurredAt.$lte = new Date(to);
    }
    const transactions = await Transaction.find(query)
      .sort({ occurredAt: -1 })
      .limit(5000);

    // Create CSV content
    let csv = "Date,Type,Description,Amount,Customer,Status\n";

    transactions.forEach((t) => {
      const date = new Date(t.occurredAt).toLocaleDateString();
      const type = t.type || "";
      const description = (t.notes || "").replace(/,/g, ";");
      const amount = t.amount || 0;
      const customer = (t.customerName || "").replace(/,/g, ";");
      const status = t.status || "";

      csv += `${date},${type},${description},${amount},${customer},${status}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=transactions-${new Date().toISOString().split("T")[0]}.csv`,
    );
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

// Export transactions as Excel (.xlsx)
router.get("/export/xlsx", authMiddleware, async (req, res, next) => {
  try {
    const userId = toObjectId(req.userId);
    const { from, to, type } = req.query;
    const query = { userId };
    if (type) query.type = type;
    if (from || to) {
      query.occurredAt = {};
      if (from) query.occurredAt.$gte = new Date(from);
      if (to) query.occurredAt.$lte = new Date(to);
    }

    const transactions = await Transaction.find(query)
      .sort({ occurredAt: -1 })
      .limit(5000);
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Transactions");

    ws.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "Type", key: "type", width: 12 },
      { header: "Description", key: "desc", width: 40 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Customer", key: "customer", width: 20 },
      { header: "Status", key: "status", width: 12 },
    ];

    transactions.forEach((t) =>
      ws.addRow({
        date: new Date(t.occurredAt).toLocaleDateString(),
        type: t.type || "",
        desc: (t.notes || "").replace(/\n/g, " "),
        amount: t.amount || 0,
        customer: t.customerName || "",
        status: t.status || "",
      }),
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=transactions-${new Date().toISOString().split("T")[0]}.xlsx`,
    );

    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    next(e);
  }
});

export default router;
