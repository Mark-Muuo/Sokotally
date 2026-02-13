/**
 * Report Generation Service
 * Generates downloadable business reports for various time periods
 */

import Transaction from "../models/Transaction.js";
import Inventory from "../models/Inventory.js";
import Customer from "../models/Customer.js";
import Debt from "../models/Debt.js";

/**
 * Parse natural language time period into date range
 * @param {string} timePeriod - Natural language time period
 * @returns {Object} { startDate, endDate, label }
 */
export const parseTimePeriod = (timePeriod) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let startDate, endDate, label;

  const lowerPeriod = timePeriod.toLowerCase().trim();

  // Today
  if (
    lowerPeriod.includes("today") ||
    lowerPeriod.includes("leo") ||
    lowerPeriod === "siku hii"
  ) {
    startDate = today;
    endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    label = "Today";
  }
  // Yesterday
  else if (lowerPeriod.includes("yesterday") || lowerPeriod.includes("jana")) {
    startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    endDate = today;
    label = "Yesterday";
  }
  // This week
  else if (
    lowerPeriod.includes("this week") ||
    lowerPeriod.includes("wiki hii")
  ) {
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as start
    startDate = new Date(today.getTime() - diff * 24 * 60 * 60 * 1000);
    endDate = new Date();
    label = "This Week";
  }
  // Last week
  else if (
    lowerPeriod.includes("last week") ||
    lowerPeriod.includes("wiki iliyopita")
  ) {
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisWeekStart = new Date(
      today.getTime() - diff * 24 * 60 * 60 * 1000,
    );
    startDate = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    endDate = thisWeekStart;
    label = "Last Week";
  }
  // This month
  else if (
    lowerPeriod.includes("this month") ||
    lowerPeriod.includes("mwezi huu")
  ) {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date();
    label = "This Month";
  }
  // Last month
  else if (
    lowerPeriod.includes("last month") ||
    lowerPeriod.includes("mwezi uliopita")
  ) {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 1);
    label = "Last Month";
  }
  // Last 7 days
  else if (
    lowerPeriod.includes("last 7 days") ||
    lowerPeriod.includes("siku 7 zilizopita")
  ) {
    startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    endDate = new Date();
    label = "Last 7 Days";
  }
  // Last 30 days
  else if (
    lowerPeriod.includes("last 30 days") ||
    lowerPeriod.includes("siku 30 zilizopita")
  ) {
    startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    endDate = new Date();
    label = "Last 30 Days";
  }
  // This year
  else if (
    lowerPeriod.includes("this year") ||
    lowerPeriod.includes("mwaka huu")
  ) {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date();
    label = "This Year";
  }
  // All time
  else if (
    lowerPeriod.includes("all time") ||
    lowerPeriod.includes("all") ||
    lowerPeriod.includes("yote")
  ) {
    startDate = new Date(2020, 0, 1); // Arbitrary old date
    endDate = new Date();
    label = "All Time";
  }
  // Default to last 30 days
  else {
    startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    endDate = new Date();
    label = "Last 30 Days";
  }

  return { startDate, endDate, label };
};

/**
 * Generate comprehensive business report
 * @param {string} userId - User ID
 * @param {Object} dateRange - { startDate, endDate }
 * @returns {Promise<Object>} Report data
 */
export const generateReport = async (userId, dateRange) => {
  const { startDate, endDate } = dateRange;

  // Fetch all transactions in date range
  const transactions = await Transaction.find({
    userId,
    occurredAt: { $gte: startDate, $lte: endDate },
  }).sort({ occurredAt: -1 });

  // Calculate financial summary
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const debtsGiven = transactions
    .filter((t) => t.type === "debt")
    .reduce((sum, t) => sum + t.amount, 0);

  const loansReceived = transactions
    .filter((t) => t.type === "loan")
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = income - expenses;

  // Sales breakdown by item
  const salesByItem = {};
  transactions
    .filter((t) => t.type === "income" && t.items && t.items.length > 0)
    .forEach((t) => {
      t.items.forEach((item) => {
        const itemName = item.name || "Unknown";
        if (!salesByItem[itemName]) {
          salesByItem[itemName] = {
            name: itemName,
            quantity: 0,
            revenue: 0,
            count: 0,
          };
        }
        salesByItem[itemName].quantity += item.quantity || 0;
        salesByItem[itemName].revenue +=
          item.totalPrice || item.unitPrice * item.quantity || 0;
        salesByItem[itemName].count += 1;
      });
    });

  const topSellingItems = Object.values(salesByItem)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Daily sales trend
  const dailySales = {};
  transactions
    .filter((t) => t.type === "income")
    .forEach((t) => {
      const date = new Date(t.occurredAt).toISOString().split("T")[0];
      if (!dailySales[date]) {
        dailySales[date] = { date, amount: 0, count: 0 };
      }
      dailySales[date].amount += t.amount;
      dailySales[date].count += 1;
    });

  const salesTrend = Object.values(dailySales).sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );

  // Customer insights
  const customerTransactions = {};
  transactions
    .filter((t) => t.customerName)
    .forEach((t) => {
      const name = t.customerName;
      if (!customerTransactions[name]) {
        customerTransactions[name] = {
          name,
          totalSpent: 0,
          transactionCount: 0,
          lastTransaction: t.occurredAt,
        };
      }
      if (t.type === "income") {
        customerTransactions[name].totalSpent += t.amount;
      }
      customerTransactions[name].transactionCount += 1;
      customerTransactions[name].lastTransaction = t.occurredAt;
    });

  const topCustomers = Object.values(customerTransactions)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // Inventory summary
  const inventorySummary = await Inventory.find({ userId });
  const totalStockValue = inventorySummary.reduce(
    (sum, item) => sum + (item.stockValue || 0),
    0,
  );

  const lowStockItems = inventorySummary.filter(
    (item) => item.currentQuantity <= (item.reorderLevel || 0),
  );

  // Outstanding debts
  const outstandingDebts = await Transaction.find({
    userId,
    status: "unpaid",
    $or: [{ type: "debt" }, { type: "loan" }],
  });

  const totalDebtsOwed = outstandingDebts
    .filter((d) => d.type === "debt")
    .reduce((sum, d) => sum + d.amount, 0);

  const totalLoansOwed = outstandingDebts
    .filter((d) => d.type === "loan")
    .reduce((sum, d) => sum + d.amount, 0);

  return {
    period: {
      startDate,
      endDate,
      label: dateRange.label || "Custom Period",
    },
    summary: {
      totalIncome: income,
      totalExpenses: expenses,
      netProfit,
      profitMargin: income > 0 ? ((netProfit / income) * 100).toFixed(2) : 0,
      totalDebtsGiven: debtsGiven,
      totalLoansReceived: loansReceived,
      transactionCount: transactions.length,
    },
    sales: {
      topSellingItems,
      totalItemsSold: Object.values(salesByItem).reduce(
        (sum, item) => sum + item.quantity,
        0,
      ),
      averageSaleValue:
        income / (transactions.filter((t) => t.type === "income").length || 1),
      salesTrend,
    },
    customers: {
      topCustomers,
      totalCustomers: Object.keys(customerTransactions).length,
    },
    inventory: {
      totalStockValue,
      totalItems: inventorySummary.length,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.map((item) => ({
        name: item.itemName,
        quantity: item.currentQuantity,
        unit: item.unit,
      })),
    },
    debts: {
      totalDebtsOwed,
      totalLoansOwed,
      netDebtPosition: totalDebtsOwed - totalLoansOwed,
      unpaidCount: outstandingDebts.length,
    },
    transactions: transactions.map((t) => ({
      date: t.occurredAt,
      type: t.type,
      amount: t.amount,
      description: t.notes || t.conversationText || "",
      customer: t.customerName || "",
      items: t.items || [],
    })),
  };
};

/**
 * Format report as CSV
 * @param {Object} reportData - Report data from generateReport
 * @returns {string} CSV content
 */
export const formatReportAsCSV = (reportData) => {
  const lines = [];

  // Header
  lines.push(`Business Report - ${reportData.period.label}`);
  lines.push(
    `Period: ${reportData.period.startDate.toLocaleDateString()} to ${reportData.period.endDate.toLocaleDateString()}`,
  );
  lines.push("");

  // Summary
  lines.push("FINANCIAL SUMMARY");
  lines.push("Metric,Value");
  lines.push(
    `Total Income,KES ${reportData.summary.totalIncome.toLocaleString()}`,
  );
  lines.push(
    `Total Expenses,KES ${reportData.summary.totalExpenses.toLocaleString()}`,
  );
  lines.push(`Net Profit,KES ${reportData.summary.netProfit.toLocaleString()}`);
  lines.push(`Profit Margin,${reportData.summary.profitMargin}%`);
  lines.push(`Total Transactions,${reportData.summary.transactionCount}`);
  lines.push("");

  // Top Selling Items
  lines.push("TOP SELLING ITEMS");
  lines.push("Item Name,Quantity Sold,Revenue");
  reportData.sales.topSellingItems.forEach((item) => {
    lines.push(
      `${item.name},${item.quantity},KES ${item.revenue.toLocaleString()}`,
    );
  });
  lines.push("");

  // Top Customers
  lines.push("TOP CUSTOMERS");
  lines.push("Customer Name,Total Spent,Transactions");
  reportData.customers.topCustomers.forEach((customer) => {
    lines.push(
      `${customer.name},KES ${customer.totalSpent.toLocaleString()},${customer.transactionCount}`,
    );
  });
  lines.push("");

  // Inventory
  lines.push("INVENTORY SUMMARY");
  lines.push(
    `Total Stock Value,KES ${reportData.inventory.totalStockValue.toLocaleString()}`,
  );
  lines.push(`Total Items,${reportData.inventory.totalItems}`);
  lines.push(`Low Stock Items,${reportData.inventory.lowStockCount}`);
  lines.push("");

  // Transactions
  lines.push("ALL TRANSACTIONS");
  lines.push("Date,Type,Amount,Customer,Description");
  reportData.transactions.forEach((t) => {
    const date = new Date(t.date).toLocaleString();
    const customer = t.customer || "N/A";
    const desc = (t.description || "").replace(/,/g, ";");
    lines.push(
      `${date},${t.type},KES ${t.amount.toLocaleString()},${customer},${desc}`,
    );
  });

  return lines.join("\n");
};
