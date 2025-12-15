import { Router } from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Debt from '../models/Debt.js';
import Customer from '../models/Customer.js';
import { authMiddleware } from '../middleware/auth.js';

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
router.get('/', authMiddleware, async (req, res, next) => {
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
  } catch (e) { next(e); }
});

// Create transaction
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const doc = await Transaction.create({ ...req.body, userId: toObjectId(req.userId) });
    res.status(201).json(doc);
  } catch (e) { next(e); }
});

router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const doc = await Transaction.findOneAndUpdate({ _id: req.params.id, userId: toObjectId(req.userId) }, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: 'Not Found' });
    res.json(doc);
  } catch (e) { next(e); }
});

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const out = await Transaction.deleteOne({ _id: req.params.id, userId: toObjectId(req.userId) });
    res.json({ ok: out.deletedCount === 1 });
  } catch (e) { next(e); }
});

// Dashboard statistics endpoint
router.get('/stats/dashboard', authMiddleware, async (req, res, next) => {
  try {
    const userId = toObjectId(req.userId);
    const now = new Date();
    
    // Current period (this month)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    thisMonthStart.setHours(0, 0, 0, 0);
    
    // Previous period (last month)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    lastMonthStart.setHours(0, 0, 0, 0);
    const lastMonthEnd = new Date(thisMonthStart);
    lastMonthEnd.setMilliseconds(-1);

    // This month's sales and expenses
    const [thisMonthSalesAgg] = await Transaction.aggregate([
      { $match: { userId, type: 'income', occurredAt: { $gte: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const [thisMonthExpensesAgg] = await Transaction.aggregate([
      { $match: { userId, type: 'expense', occurredAt: { $gte: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Last month's sales and expenses for comparison
    const [lastMonthSalesAgg] = await Transaction.aggregate([
      { $match: { userId, type: 'income', occurredAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const [lastMonthExpensesAgg] = await Transaction.aggregate([
      { $match: { userId, type: 'expense', occurredAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const sales = thisMonthSalesAgg?.total || 0;
    const expenses = thisMonthExpensesAgg?.total || 0;
    const profit = sales - expenses;

    const prevSales = lastMonthSalesAgg?.total || 0;
    const prevExpenses = lastMonthExpensesAgg?.total || 0;
    const prevProfit = prevSales - prevExpenses;

    // Calculate realistic percentage changes (return 0 if no previous data)
    const salesTrend = prevSales > 0 ? ((sales - prevSales) / prevSales * 100) : 0;
    const expensesTrend = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses * 100) : 0;
    const profitTrend = prevProfit !== 0 ? ((profit - prevProfit) / Math.abs(prevProfit) * 100) : 0;

    // Debts summary from Debt model
    const [outstandingDebtsAgg] = await Debt.aggregate([
      { $match: { userId, status: 'unpaid' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    // Also get debts from Transaction model (type: 'debt')
    const [transactionDebtsAgg] = await Transaction.aggregate([
      { $match: { userId, type: 'debt', status: 'unpaid' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const outstandingDebts = (outstandingDebtsAgg?.total || 0) + (transactionDebtsAgg?.total || 0);
    const outstandingDebtsCount = (outstandingDebtsAgg?.count || 0) + (transactionDebtsAgg?.count || 0);

    const inSevenDays = new Date();
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    const [dueSoonAgg] = await Debt.aggregate([
      { $match: { userId, status: 'unpaid', dueDate: { $exists: true, $lte: inSevenDays } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const dueSoonTotal = dueSoonAgg?.total || 0;
    const dueSoonCount = dueSoonAgg?.count || 0;

    // Get monthly aggregated data for charts (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySales = await Transaction.aggregate([
      { $match: { userId, type: 'income', occurredAt: { $gte: sixMonthsAgo } } },
      { $group: { 
        _id: { $dateToString: { format: '%Y-%m', date: '$occurredAt' } }, 
        total: { $sum: '$amount' } 
      }},
      { $sort: { _id: 1 } }
    ]);

    const monthlyExpenses = await Transaction.aggregate([
      { $match: { userId, type: 'expense', occurredAt: { $gte: sixMonthsAgo } } },
      { $group: { 
        _id: { $dateToString: { format: '%Y-%m', date: '$occurredAt' } }, 
        total: { $sum: '$amount' } 
      }},
      { $sort: { _id: 1 } }
    ]);

    // Recent transactions (last 50 to ensure we capture recent activity)
    const recentTransactions = await Transaction.find({ userId }).sort({ occurredAt: -1 }).limit(50).lean();

    // Sales by period for reports (supports range: daily, weekly, monthly)
    const { range } = req.query;
    let salesByDay = [];

    if (!range || range === 'daily') {
      // last 7 days
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - 6);
      daysAgo.setHours(0,0,0,0);

      salesByDay = await Transaction.aggregate([
        { $match: { userId, type: 'income', occurredAt: { $gte: daysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$occurredAt' } }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } }
      ]);
    } else if (range === 'weekly') {
      // last 28 days grouped by day (4 weeks)
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - 27);
      daysAgo.setHours(0,0,0,0);

      salesByDay = await Transaction.aggregate([
        { $match: { userId, type: 'income', occurredAt: { $gte: daysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$occurredAt' } }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } }
      ]);
    } else if (range === 'monthly') {
      // last 6 months grouped by month
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - 5);
      monthsAgo.setHours(0,0,0,0);

      salesByDay = await Transaction.aggregate([
        { $match: { userId, type: 'income', occurredAt: { $gte: monthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$occurredAt' } }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } }
      ]);
    }

    // Top customers by sales (try to lookup Customer name)
    const topCustomers = await Transaction.aggregate([
      { $match: { userId, type: 'income' } },
      { $group: { _id: '$customerId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
      { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
      { $project: { customerId: '$_id', name: { $ifNull: ['$customer.name', 'Walk-in Customer'] }, total: 1, count: 1 } }
    ]);

    res.json({
      sales,
      expenses,
      profit,
      trends: {
        sales: Math.round(salesTrend * 10) / 10, // Round to 1 decimal
        expenses: Math.round(expensesTrend * 10) / 10,
        profit: Math.round(profitTrend * 10) / 10
      },
      debts: {
        outstandingTotal: outstandingDebts,
        outstandingCount: outstandingDebtsCount,
        dueSoonTotal,
        dueSoonCount
      },
      recentTransactions,
      monthlyData: {
        sales: monthlySales,
        expenses: monthlyExpenses
      },
      salesByDay,
      topCustomers
    });
  } catch (e) {
    next(e);
  }
});

// ============ NEW ANALYTICS ENDPOINTS ============

// Get top selling items
router.get('/analytics/top-items', authMiddleware, async (req, res, next) => {
  try {
    const userId = toObjectId(req.userId);
    const { limit = 10, period = 'all' } = req.query;
    
    const matchStage = { userId, type: 'income', items: { $exists: true, $ne: [] } };
    
    // Add time filter if period specified
    if (period !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      if (period === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      }
      
      matchStage.occurredAt = { $gte: startDate };
    }
    
    const topItems = await Transaction.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.name',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.totalPrice' },
        transactionCount: { $sum: 1 },
        avgPrice: { $avg: '$items.unitPrice' },
        unit: { $first: '$items.unit' }
      }},
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
      { $project: {
        itemName: '$_id',
        totalQuantity: 1,
        totalRevenue: 1,
        transactionCount: 1,
        avgPrice: { $round: ['$avgPrice', 2] },
        unit: 1,
        _id: 0
      }}
    ]);
    
    res.json({ items: topItems, period });
  } catch (e) {
    next(e);
  }
});

// Get inventory insights (items sold vs stock)
router.get('/analytics/inventory-insights', authMiddleware, async (req, res, next) => {
  try {
    const userId = toObjectId(req.userId);
    
    // Get sales by item
    const salesByItem = await Transaction.aggregate([
      { $match: { userId, type: 'income', items: { $exists: true, $ne: [] } } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.name',
        soldQuantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.totalPrice' },
        unit: { $first: '$items.unit' }
      }},
      { $sort: { soldQuantity: -1 } }
    ]);
    
    // Get purchases by item
    const purchasesByItem = await Transaction.aggregate([
      { $match: { userId, type: 'expense', items: { $exists: true, $ne: [] } } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.name',
        purchasedQuantity: { $sum: '$items.quantity' },
        cost: { $sum: '$items.totalPrice' }
      }}
    ]);
    
    // Merge sales and purchases
    const inventory = salesByItem.map(sale => {
      const purchase = purchasesByItem.find(p => p._id === sale._id);
      return {
        itemName: sale._id,
        soldQuantity: sale.soldQuantity,
        purchasedQuantity: purchase?.purchasedQuantity || 0,
        revenue: sale.revenue,
        cost: purchase?.cost || 0,
        profit: sale.revenue - (purchase?.cost || 0),
        unit: sale.unit
      };
    });
    
    res.json({ inventory });
  } catch (e) {
    next(e);
  }
});

// Get sales trends by item over time
router.get('/analytics/item-trends', authMiddleware, async (req, res, next) => {
  try {
    const userId = toObjectId(req.userId);
    const { itemName, days = 30 } = req.query;
    
    if (!itemName) {
      return res.status(400).json({ error: 'itemName query parameter required' });
    }
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    daysAgo.setHours(0, 0, 0, 0);
    
    const trends = await Transaction.aggregate([
      { $match: { 
        userId, 
        type: 'income', 
        occurredAt: { $gte: daysAgo },
        'items.name': itemName.toLowerCase()
      }},
      { $unwind: '$items' },
      { $match: { 'items.name': itemName.toLowerCase() } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$occurredAt' } },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.totalPrice' }
      }},
      { $sort: { _id: 1 } },
      { $project: {
        date: '$_id',
        quantity: 1,
        revenue: 1,
        _id: 0
      }}
    ]);
    
    res.json({ itemName, trends, period: `${days} days` });
  } catch (e) {
    next(e);
  }
});

// Generate comprehensive report
router.get('/reports/comprehensive', authMiddleware, async (req, res, next) => {
  try {
    const userId = toObjectId(req.userId);
    const { startDate, endDate, format = 'json' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    
    const dateFilter = { userId, occurredAt: { $gte: start, $lte: end } };
    
    // Financial summary
    const [salesAgg] = await Transaction.aggregate([
      { $match: { ...dateFilter, type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    
    const [expensesAgg] = await Transaction.aggregate([
      { $match: { ...dateFilter, type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    
    // Top items
    const topItems = await Transaction.aggregate([
      { $match: { ...dateFilter, type: 'income', items: { $exists: true, $ne: [] } } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.name',
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.totalPrice' },
        unit: { $first: '$items.unit' }
      }},
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);
    
    // Daily breakdown
    const dailyBreakdown = await Transaction.aggregate([
      { $match: dateFilter },
      { $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$occurredAt' } },
          type: '$type'
        },
        total: { $sum: '$amount' }
      }},
      { $sort: { '_id.date': 1 } }
    ]);
    
    const report = {
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      summary: {
        totalSales: salesAgg?.total || 0,
        totalExpenses: expensesAgg?.total || 0,
        netProfit: (salesAgg?.total || 0) - (expensesAgg?.total || 0),
        salesCount: salesAgg?.count || 0,
        expensesCount: expensesAgg?.count || 0
      },
      topItems: topItems.map(item => ({
        name: item._id,
        quantity: item.quantity,
        revenue: item.revenue,
        unit: item.unit
      })),
      dailyBreakdown
    };
    
    res.json(report);
  } catch (e) {
    next(e);
  }
});

export default router;


