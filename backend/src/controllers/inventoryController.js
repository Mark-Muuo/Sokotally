/**
 * Inventory Controller
 * Handles all stock/inventory management operations with AI-powered extraction
 */

import Inventory from "../models/Inventory.js";
import StockMovement from "../models/StockMovement.js";
import Transaction from "../models/Transaction.js";
import {
  extractStockData,
  classifyMessage,
} from "../services/stockExtractor.js";
import {
  normalizeItemName,
  findInventoryByNormalizedName,
} from "../services/itemNormalizer.js";

/**
 * Process natural language stock input (AI-powered)
 * POST /api/inventory/process
 */
export const processStockInput = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.userId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Extract structured data using AI
    const extracted = await extractStockData(message);

    // Check confidence level
    if (extracted.confidence < 0.5) {
      return res.status(200).json({
        success: false,
        message:
          "Could not understand the stock operation. Please try again with more details.",
        extracted,
        needsManualInput: true,
      });
    }

    // Handle different action types
    if (extracted.actionType === "query_stock") {
      return handleStockQuery(req, res, extracted);
    }

    // Return extracted data for confirmation
    res.status(200).json({
      success: true,
      extracted,
      message: "Stock data extracted successfully. Please confirm.",
      needsConfirmation: true,
    });
  } catch (error) {
    console.error("Error processing stock input:", error);
    res.status(500).json({ error: "Failed to process stock input" });
  }
};

/**
 * Add stock to inventory (after confirmation)
 * POST /api/inventory/add
 */
export const addStock = async (req, res) => {
  try {
    const {
      itemName,
      quantity,
      unit,
      buyingPrice,
      sellingPrice,
      supplierName,
      reorderLevel,
      notes,
      rawInput,
    } = req.body;
    const userId = req.userId;

    if (!itemName || !quantity || !buyingPrice || !sellingPrice) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find existing item using normalized name matching (supports multilingual)
    let inventory = await findInventoryByNormalizedName(
      itemName,
      Inventory,
      userId,
    );

    const previousQuantity = inventory ? inventory.currentQuantity : 0;
    const buyingPricePerUnit = buyingPrice / quantity;

    if (inventory) {
      // Update existing item
      inventory.currentQuantity += quantity;
      inventory.buyingPrice = buyingPricePerUnit; // Update to latest buying price
      inventory.sellingPrice = sellingPrice;
      inventory.lastRestockedDate = new Date();
      if (supplierName) inventory.supplierName = supplierName;
      if (reorderLevel !== undefined) inventory.reorderLevel = reorderLevel;
      if (notes) inventory.notes = notes;
      if (rawInput) inventory.rawInput = rawInput;

      await inventory.save();
    } else {
      // Create new inventory item with normalized name
      const normalizedName = normalizeItemName(itemName);

      inventory = new Inventory({
        userId,
        itemName: normalizedName,
        currentQuantity: quantity,
        unit,
        buyingPrice: buyingPricePerUnit,
        sellingPrice,
        supplierName,
        reorderLevel: reorderLevel || 10,
        notes,
        rawInput,
        lastRestockedDate: new Date(),
      });

      await inventory.save();
    }

    // Create stock movement record
    const movement = new StockMovement({
      inventoryId: inventory._id,
      userId,
      type: "restock",
      quantity,
      previousQuantity,
      newQuantity: inventory.currentQuantity,
      unitPrice: buyingPricePerUnit,
      reason: notes || "Stock added",
      supplierName,
      rawInput,
    });

    await movement.save();

    res.status(201).json({
      success: true,
      message: `Successfully added ${quantity} ${unit} of ${itemName} to inventory`,
      inventory,
      movement,
    });
  } catch (error) {
    console.error("Error adding stock:", error);
    res.status(500).json({ error: "Failed to add stock" });
  }
};

/**
 * Get all inventory items for user
 * GET /api/inventory
 */
export const getAllInventory = async (req, res) => {
  try {
    const userId = req.userId;
    const { sortBy = "itemName", order = "asc", search = "" } = req.query;

    const query = { userId };

    // Add search filter
    if (search) {
      query.itemName = { $regex: search, $options: "i" };
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === "desc" ? -1 : 1;

    const inventory = await Inventory.find(query).sort(sortOptions);

    // Calculate totals
    const totalValue = inventory.reduce(
      (sum, item) => sum + item.stockValue,
      0,
    );
    const totalItems = inventory.length;
    const lowStockCount = inventory.filter((item) => item.isLowStock).length;

    res.status(200).json({
      inventory,
      summary: {
        totalValue,
        totalItems,
        lowStockCount,
      },
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
};

/**
 * Get single inventory item
 * GET /api/inventory/:id
 */
export const getInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const item = await Inventory.findOne({ _id: id, userId });

    if (!item) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    // Get movement history for this item
    const movements = await StockMovement.getItemHistory(id, 20);

    res.status(200).json({
      item,
      movements,
    });
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    res.status(500).json({ error: "Failed to fetch inventory item" });
  }
};

/**
 * Update inventory item
 * PUT /api/inventory/:id
 */
export const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updates = req.body;

    const item = await Inventory.findOne({ _id: id, userId });

    if (!item) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    const previousQuantity = item.currentQuantity;

    // Update allowed fields
    const allowedUpdates = [
      "sellingPrice",
      "buyingPrice",
      "reorderLevel",
      "supplierName",
      "notes",
      "currentQuantity",
    ];
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        item[field] = updates[field];
      }
    });

    await item.save();

    // If quantity changed, create movement record
    if (
      updates.currentQuantity !== undefined &&
      updates.currentQuantity !== previousQuantity
    ) {
      const movement = new StockMovement({
        inventoryId: item._id,
        userId,
        type: "adjustment",
        quantity: updates.currentQuantity - previousQuantity,
        previousQuantity,
        newQuantity: updates.currentQuantity,
        unitPrice: item.buyingPrice,
        reason: updates.reason || "Manual adjustment",
      });
      await movement.save();
    }

    res.status(200).json({
      success: true,
      message: "Inventory item updated successfully",
      item,
    });
  } catch (error) {
    console.error("Error updating inventory item:", error);
    res.status(500).json({ error: "Failed to update inventory item" });
  }
};

/**
 * Delete inventory item
 * DELETE /api/inventory/:id
 */
export const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const item = await Inventory.findOneAndDelete({ _id: id, userId });

    if (!item) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    // Delete associated movements
    await StockMovement.deleteMany({ inventoryId: id });

    res.status(200).json({
      success: true,
      message: "Inventory item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    res.status(500).json({ error: "Failed to delete inventory item" });
  }
};

/**
 * Get low stock items
 * GET /api/inventory/alerts/low-stock
 */
export const getLowStockItems = async (req, res) => {
  try {
    const userId = req.userId;

    const lowStockItems = await Inventory.getLowStockItems(userId);

    res.status(200).json({
      count: lowStockItems.length,
      items: lowStockItems,
    });
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    res.status(500).json({ error: "Failed to fetch low stock items" });
  }
};

/**
 * Get stock movement history
 * GET /api/inventory/movements
 */
export const getStockMovements = async (req, res) => {
  try {
    const userId = req.userId;
    const { startDate, endDate, type, limit = 50 } = req.query;

    let query = { userId };

    if (type) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const movements = await StockMovement.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate("inventoryId", "itemName unit");

    res.status(200).json({ movements });
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    res.status(500).json({ error: "Failed to fetch stock movements" });
  }
};

/**
 * Get inventory dashboard stats
 * GET /api/inventory/stats
 */
export const getInventoryStats = async (req, res) => {
  try {
    const userId = req.userId;

    // Get all inventory items
    const allItems = await Inventory.find({ userId });

    // Calculate statistics
    const totalValue = allItems.reduce((sum, item) => sum + item.stockValue, 0);
    const potentialRevenue = allItems.reduce(
      (sum, item) => sum + item.currentQuantity * item.sellingPrice,
      0,
    );
    const potentialProfit = potentialRevenue - totalValue;
    const lowStockItems = allItems.filter((item) => item.isLowStock);
    const outOfStockItems = allItems.filter(
      (item) => item.currentQuantity === 0,
    );

    // Get recent movements
    const recentMovements = await StockMovement.find({ userId })
      .sort({ date: -1 })
      .limit(10)
      .populate("inventoryId", "itemName unit");

    // Get movement summary
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const movementSummary = await StockMovement.getMovementSummary(
      userId,
      thirtyDaysAgo,
      new Date(),
    );

    res.status(200).json({
      totalItems: allItems.length,
      totalValue,
      potentialRevenue,
      potentialProfit,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStockItems: lowStockItems.slice(0, 5),
      recentMovements,
      movementSummary,
    });
  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    res.status(500).json({ error: "Failed to fetch inventory stats" });
  }
};

/**
 * Handle stock queries
 */
async function handleStockQuery(req, res, extracted) {
  try {
    const userId = req.userId;
    const { itemName } = extracted;

    if (itemName) {
      // Query specific item
      const item = await Inventory.findOne({
        userId,
        itemName: itemName.toLowerCase(),
      });

      if (!item) {
        return res.status(200).json({
          success: true,
          message: `You don't have ${itemName} in stock.`,
          item: null,
        });
      }

      return res.status(200).json({
        success: true,
        message: `You have ${item.currentQuantity} ${item.unit} of ${item.itemName} in stock.`,
        item,
      });
    } else {
      // General stock query
      const stats = await getInventoryStats(req, res);
      return stats;
    }
  } catch (error) {
    console.error("Error handling stock query:", error);
    res.status(500).json({ error: "Failed to process stock query" });
  }
}

/**
 * Reduce stock (when items are sold)
 * POST /api/inventory/reduce
 */
export const reduceStock = async (req, res) => {
  try {
    const { itemName, quantity, transactionId, reason } = req.body;
    const userId = req.userId;

    const item = await Inventory.findOne({
      userId,
      itemName: itemName.toLowerCase(),
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found in inventory" });
    }

    if (item.currentQuantity < quantity) {
      return res.status(400).json({
        error: "Insufficient stock",
        available: item.currentQuantity,
        requested: quantity,
      });
    }

    const previousQuantity = item.currentQuantity;
    item.currentQuantity -= quantity;
    await item.save();

    // Create movement record
    const movement = new StockMovement({
      inventoryId: item._id,
      userId,
      type: "sale",
      quantity: -quantity,
      previousQuantity,
      newQuantity: item.currentQuantity,
      unitPrice: item.sellingPrice,
      transactionId,
      reason: reason || "Sale",
    });

    await movement.save();

    res.status(200).json({
      success: true,
      message: "Stock reduced successfully",
      item,
      movement,
    });
  } catch (error) {
    console.error("Error reducing stock:", error);
    res.status(500).json({ error: "Failed to reduce stock" });
  }
};
