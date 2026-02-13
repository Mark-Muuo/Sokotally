import { Schema, model } from "mongoose";

const chatMessageSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversationId: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    sender: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "voice"],
      default: "text",
    },
    audioUrl: {
      type: String,
    },
    transcription: {
      type: String,
    },
    extractedKeywords: [
      {
        keyword: String,
        category: String,
        value: Schema.Types.Mixed,
      },
    ],
    processedData: {
      type: Schema.Types.Mixed,
    },
    createdRecord: {
      type: {
        type: String,
        enum: ["transaction", "item", "debt"],
      },
      recordType: String,
      recordId: Schema.Types.ObjectId,
    },
    metadata: {
      model: String,
      tokensUsed: Number,
      processingTime: Number,
    },
  },
  {
    timestamps: true,
  },
);

chatMessageSchema.index({ userId: 1, conversationId: 1, createdAt: -1 });

const ChatMessage = model("ChatMessage", chatMessageSchema);

export default ChatMessage;
