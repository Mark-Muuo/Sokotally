/**
 * Query Service
 * Handles conversational queries about finances and stock using AI
 */

import { getLLMResponse } from "./llmService.js";
import Transaction from "../models/Transaction.js";
import Inventory from "../models/Inventory.js";
import StockMovement from "../models/StockMovement.js";

/**
 * Process a natural language query about user's finances or stock
 * @param {string} query - User's question
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response with answer and data
 */
export async function processFinancialQuery(query, userId) {
  try {
    // First, understand what the query is asking for
    const intent = await classifyQueryIntent(query);

    // Fetch relevant data based on intent
    const relevantData = await fetchRelevantData(userId, intent);

    // Generate natural language response using AI
    const response = await generateQueryResponse(query, relevantData);

    return {
      success: true,
      intent,
      answer: response.answer,
      data: relevantData,
      confidence: response.confidence,
    };
  } catch (error) {
    console.error("Error processing financial query:", error);
    return {
      success: false,
      error: "Failed to process query",
      answer:
        "I'm sorry, I couldn't process your question. Please try asking in a different way.",
    };
  }
}

/**
 * Classify the intent of the query
 */
async function classifyQueryIntent(query) {
  const lowerQuery = query.toLowerCase();

  // Define intent patterns
  const intents = {
    profit: /profit|faida|pato/i,
    sales: /sales|sold|uza|mauzo/i,
    expenses: /expenses?|spent?|gharama|matumizi/i,
    debt: /debt|deni|owe|mdeni/i,
    stock: /stock|inventory|hisa|bidhaa|nina.*?gani/i,
    summary: /summary|total|jumla|overall/i,
    trend: /trend|pattern|growth|increase|decrease/i,
    specific_item: /tomato|cabbage|onion|carrot|spinach|sukuma/i,
    time_based: /today|yesterday|week|month|last|this/i,
  };

  const detectedIntents = [];
  for (const [intent, pattern] of Object.entries(intents)) {
    if (pattern.test(lowerQuery)) {
      detectedIntents.push(intent);
    }
  }

  // Extract time period
  const timePeriod = extractTimePeriod(query);

  return {
    primary: detectedIntents[0] || "summary",
    all: detectedIntents,
    timePeriod,
  };
}

/**
 * Extract time period from query
 */
function extractTimePeriod(query) {
  const lowerQuery = query.toLowerCase();

  if (/today|leo/i.test(lowerQuery)) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return { type: "day", start: today, end: new Date(), label: "today" };
  }

  if (/yesterday|jana/i.test(lowerQuery)) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);
    return {
      type: "day",
      start: yesterday,
      end: yesterdayEnd,
      label: "yesterday",
    };
  }

  if (/this week|wiki hii/i.test(lowerQuery)) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return {
      type: "week",
      start: startOfWeek,
      end: new Date(),
      label: "this week",
    };
  }

  if (/last week|wiki iliyopita/i.test(lowerQuery)) {
    const today = new Date();
    const startOfLastWeek = new Date(today);
    startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
    startOfLastWeek.setHours(0, 0, 0, 0);
    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
    endOfLastWeek.setHours(23, 59, 59, 999);
    return {
      type: "week",
      start: startOfLastWeek,
      end: endOfLastWeek,
      label: "last week",
    };
  }

  if (/this month|mwezi huu/i.test(lowerQuery)) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      type: "month",
      start: startOfMonth,
      end: new Date(),
      label: "this month",
    };
  }

  if (/last month|mwezi uliopita/i.test(lowerQuery)) {
    const today = new Date();
    const startOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    );
    const endOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );
    return {
      type: "month",
      start: startOfLastMonth,
      end: endOfLastMonth,
      label: "last month",
    };
  }

  // Default to today if no time period specified
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return { type: "day", start: today, end: new Date(), label: "today" };
}

/**
 * Fetch relevant data based on intent
 */
async function fetchRelevantData(userId, intent) {
  const data = {};
  const { timePeriod } = intent;

  try {
    // Fetch transactions for the period
    const transactionQuery = {
      userId,
      occurredAt: { $gte: timePeriod.start, $lte: timePeriod.end },
    };

    const transactions = await Transaction.find(transactionQuery).sort({
      occurredAt: -1,
    });

    // Calculate financial metrics
    const sales = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const profit = sales - expenses;

    data.financial = {
      sales,
      expenses,
      profit,
      transactionCount: transactions.length,
    };

    // If query involves debt
    if (intent.all.includes("debt")) {
      const debts = transactions.filter((t) => t.type === "debt");
      const totalDebt = debts.reduce((sum, t) => sum + t.amount, 0);
      const unpaidDebts = debts.filter((t) => t.status === "unpaid");

      data.debt = {
        total: totalDebt,
        unpaid: unpaidDebts.length,
        unpaidAmount: unpaidDebts.reduce((sum, t) => sum + t.amount, 0),
        debtors: unpaidDebts.map((d) => ({
          name: d.customerName,
          amount: d.amount,
          date: d.occurredAt,
        })),
      };
    }

    // If query involves stock
    if (intent.all.includes("stock")) {
      const inventory = await Inventory.find({ userId });
      const lowStockItems = inventory.filter((item) => item.isLowStock);

      data.stock = {
        totalItems: inventory.length,
        totalValue: inventory.reduce((sum, item) => sum + item.stockValue, 0),
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.map((item) => ({
          name: item.itemName,
          quantity: item.currentQuantity,
          unit: item.unit,
          reorderLevel: item.reorderLevel,
        })),
        items: inventory.map((item) => ({
          name: item.itemName,
          quantity: item.currentQuantity,
          unit: item.unit,
          value: item.stockValue,
        })),
      };
    }

    // If query mentions specific item
    if (intent.all.includes("specific_item")) {
      const itemMatch = intent.all
        .join(" ")
        .match(/tomato|cabbage|onion|carrot|spinach|sukuma/i);
      if (itemMatch) {
        const itemName = itemMatch[0].toLowerCase();
        const item = await Inventory.findOne({
          userId,
          itemName: { $regex: itemName, $options: "i" },
        });

        if (item) {
          data.specificItem = {
            name: item.itemName,
            quantity: item.currentQuantity,
            unit: item.unit,
            value: item.stockValue,
            sellingPrice: item.sellingPrice,
            buyingPrice: item.buyingPrice,
          };
        }
      }
    }

    data.timePeriod = timePeriod.label;
    return data;
  } catch (error) {
    console.error("Error fetching relevant data:", error);
    return data;
  }
}

/**
 * Generate natural language response using AI
 */
async function generateQueryResponse(query, data) {
  const systemPrompt = `You are a helpful financial assistant for a small business owner in Kenya. 
Answer their question based on the provided data. Be concise, friendly, and use simple language.
If the data shows concerning trends (low stock, negative profit), mention it tactfully.
Format numbers with proper currency (KES) and use clear, easy-to-read formatting.

IMPORTANT: Only use the data provided. Do not make up numbers.`;

  const userPrompt = `Question: ${query}

Available Data:
${JSON.stringify(data, null, 2)}

Please provide a clear, friendly answer based on this data.`;

  try {
    const response = await getLLMResponse(userPrompt, systemPrompt, []);

    return {
      answer: response.reply,
      confidence: 0.9,
    };
  } catch (error) {
    console.error("Error generating response:", error);

    // Fallback to basic template response
    return generateBasicResponse(query, data);
  }
}

/**
 * Generate basic template response (fallback)
 */
function generateBasicResponse(query, data) {
  const { financial, debt, stock, timePeriod } = data;

  if (financial) {
    const { sales, expenses, profit } = financial;
    return {
      answer: `For ${timePeriod}, your sales were KES ${sales.toLocaleString()}, expenses were KES ${expenses.toLocaleString()}, and your ${profit >= 0 ? "profit" : "loss"} was KES ${Math.abs(profit).toLocaleString()}.`,
      confidence: 0.7,
    };
  }

  if (stock) {
    return {
      answer: `You have ${stock.totalItems} items in stock with a total value of KES ${stock.totalValue.toLocaleString()}. ${stock.lowStockCount > 0 ? `${stock.lowStockCount} items are running low.` : "All items are well stocked."}`,
      confidence: 0.7,
    };
  }

  if (debt) {
    return {
      answer: `You have ${debt.unpaid} unpaid debts totaling KES ${debt.unpaidAmount.toLocaleString()}.`,
      confidence: 0.7,
    };
  }

  return {
    answer:
      "I don't have enough information to answer that question. Could you please be more specific?",
    confidence: 0.3,
  };
}
