import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["income", "expense", "debt", "loan"],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "KES" },
    occurredAt: { type: Date, default: Date.now },

    // Item tracking - multiple items per transaction
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unit: { type: String, default: "unit" }, // kg, pieces, liters, etc.
        unitPrice: { type: Number },
        totalPrice: { type: Number },
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
      },
    ],

    // Legacy single item support (for backward compatibility)
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },

    // Customer information
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String }, // For debt records
    lender: { type: String }, // For loan records

    // Additional metadata
    notes: { type: String },
    conversationText: { type: String }, // Original chat message
    extractedData: { type: mongoose.Schema.Types.Mixed }, // Raw AI extraction

    // User and status
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["unpaid", "paid", "partial"],
      default: "paid",
    },
  },
  { timestamps: true },
);

TransactionSchema.index({ userId: 1, occurredAt: -1 });

export default mongoose.model("Transaction", TransactionSchema);
