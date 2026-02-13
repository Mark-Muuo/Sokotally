import mongoose from "mongoose";

const StockMovementSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["restock", "sale", "adjustment", "spoilage", "return", "transfer"],
    },
    quantity: {
      type: Number,
      required: true,
      comment: "Positive for additions, negative for reductions",
    },
    previousQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    newQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
      comment: "Price per unit at time of movement",
    },
    totalValue: {
      type: Number,
      default: 0,
      comment: "Total value of the movement (quantity * unitPrice)",
    },
    reason: {
      type: String,
      trim: true,
      comment: "Optional description of why the movement occurred",
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
      comment: "Link to related transaction if applicable",
    },
    rawInput: {
      type: String,
      comment: "Original natural language input for AI records",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    supplierName: {
      type: String,
      trim: true,
      comment: "Supplier name for restock movements",
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for common queries
StockMovementSchema.index({ userId: 1, date: -1 });
StockMovementSchema.index({ inventoryId: 1, date: -1 });
StockMovementSchema.index({ userId: 1, type: 1, date: -1 });

// Pre-save hook to calculate total value
StockMovementSchema.pre("save", function (next) {
  this.totalValue = Math.abs(this.quantity) * this.unitPrice;
  next();
});

// Static method to get movement history for an item
StockMovementSchema.statics.getItemHistory = function (
  inventoryId,
  limit = 50,
) {
  return this.find({ inventoryId })
    .sort({ date: -1 })
    .limit(limit)
    .populate("transactionId", "type amount notes");
};

// Static method to get all movements for a user within a date range
StockMovementSchema.statics.getUserMovements = function (
  userId,
  startDate,
  endDate,
) {
  const query = { userId };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  return this.find(query)
    .sort({ date: -1 })
    .populate("inventoryId", "itemName unit");
};

// Static method to get movement summary by type
StockMovementSchema.statics.getMovementSummary = async function (
  userId,
  startDate,
  endDate,
) {
  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };

  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) matchStage.date.$lte = new Date(endDate);
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        totalQuantity: { $sum: { $abs: "$quantity" } },
        totalValue: { $sum: "$totalValue" },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

export default mongoose.model("StockMovement", StockMovementSchema);
