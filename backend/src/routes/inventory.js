/**
 * Inventory Routes
 * All routes for stock/inventory management
 */

import express from "express";
import {
  processStockInput,
  addStock,
  getAllInventory,
  getInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getLowStockItems,
  getStockMovements,
  getInventoryStats,
  reduceStock,
} from "../controllers/inventoryController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// AI-powered stock processing
router.post("/process", processStockInput);

// Inventory management
router.post("/add", addStock);
router.get("/", getAllInventory);
router.get("/stats", getInventoryStats);
router.get("/alerts/low-stock", getLowStockItems);
router.get("/movements", getStockMovements);
router.get("/:id", getInventoryItem);
router.put("/:id", updateInventoryItem);
router.delete("/:id", deleteInventoryItem);

// Stock operations
router.post("/reduce", reduceStock);

export default router;
