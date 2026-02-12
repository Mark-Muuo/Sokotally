import mongoose from "mongoose";

const InventorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    currentQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      default: "pieces",
      enum: [
        "kg",
        "pieces",
        "bundles",
        "bags",
        "sacks",
        "crates",
        "liters",
        "grams",
        "units",
      ],
    },
    buyingPrice: {
      type: Number,
      required: true,
      min: 0,
      comment: "Price per unit when buying/restocking",
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
      comment: "Price per unit when selling",
    },
    supplierName: {
      type: String,
      trim: true,
      default: null,
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: 0,
      comment: "Quantity threshold to trigger low stock alert",
    },
    lastRestockedDate: {
      type: Date,
      default: null,
    },
    rawInput: {
      type: String,
      comment: "Original natural language input for AI records",
    },
    category: {
      type: String,
      trim: true,
      default: "general",
    },
    profitMargin: {
      type: Number,
      default: 0,
      comment: "Calculated as (sellingPrice - buyingPrice) / buyingPrice * 100",
    },
    stockValue: {
      type: Number,
      default: 0,
      comment: "Calculated as currentQuantity * buyingPrice",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
InventorySchema.index({ userId: 1, itemName: 1 });
InventorySchema.index({ userId: 1, currentQuantity: 1 });

// Virtual for low stock status
InventorySchema.virtual("isLowStock").get(function () {
  return this.currentQuantity <= this.reorderLevel;
});

// Pre-save hook to calculate derived fields
InventorySchema.pre("save", function (next) {
  // Calculate profit margin
  if (this.buyingPrice > 0) {
    this.profitMargin =
      ((this.sellingPrice - this.buyingPrice) / this.buyingPrice) * 100;
  }

  // Calculate stock value
  this.stockValue = this.currentQuantity * this.buyingPrice;

  next();
});

// Method to update quantity
InventorySchema.methods.updateQuantity = function (
  change,
  reason = "adjustment",
) {
  this.currentQuantity = Math.max(0, this.currentQuantity + change);
  return this.save();
};

// Static method to get low stock items for a user
InventorySchema.statics.getLowStockItems = function (userId) {
  return this.find({
    userId,
    $expr: { $lte: ["$currentQuantity", "$reorderLevel"] },
  }).sort({ currentQuantity: 1 });
};

// Static method to get total inventory value for a user
InventorySchema.statics.getTotalValue = async function (userId) {
  const result = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalValue: { $sum: "$stockValue" },
      },
    },
  ]);

  return result.length > 0 ? result[0].totalValue : 0;
};

export default mongoose.model("Inventory", InventorySchema);
