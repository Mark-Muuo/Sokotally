import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { voiceUpload } from "../middleware/upload.js";
import ChatMessage from "../models/ChatMessage.js";
import Transaction from "../models/Transaction.js";
import Item from "../models/Item.js";
import Debt from "../models/Debt.js";
import Customer from "../models/Customer.js";
import {
  extractKeywords,
  buildContextFromKeywords,
} from "../services/keywordExtractor.js";
import {
  getLLMResponse,
  transcribeAudio,
  synthesizeSpeech,
} from "../services/llmService.js";
import {
  extractTransactionData,
  detectLanguage,
  generateConfirmation,
} from "../services/transactionExtractor.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Text message endpoint
router.post("/message", authMiddleware, async (req, res, next) => {
  const startTime = Date.now();

  try {
    const { text, conversationId } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    const userMessage = text.trim();
    const convId = conversationId || uuidv4();
    const userId = req.userId;

    // 1. Detect language
    const language = detectLanguage(userMessage);

    // 2. Extract keywords from user message (legacy support)
    const keywords = extractKeywords(userMessage);

    // 3. NEW: Use advanced LLM extraction for structured data
    const extractedData = await extractTransactionData(userMessage, language);

    // 4. Get conversation history for context
    const recentMessages = await ChatMessage.find({
      userId,
      conversationId: convId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // 5. Generate confirmation message
    let aiReply = "";
    let createdRecord = null;

    // Process transaction based on extracted data
    if (extractedData.transactionType && extractedData.totalAmount > 0) {
      // Create transaction with items
      const transactionData = {
        userId,
        type:
          extractedData.transactionType === "sale"
            ? "income"
            : extractedData.transactionType === "purchase"
            ? "expense"
            : extractedData.transactionType,
        amount: extractedData.totalAmount,
        items: extractedData.items,
        conversationText: userMessage,
        extractedData: extractedData,
        occurredAt: extractedData.date
          ? new Date(extractedData.date)
          : new Date(),
        status:
          extractedData.transactionType === "debt" ||
          extractedData.transactionType === "loan"
            ? "unpaid"
            : extractedData.paymentStatus || "paid",
      };

      // Handle customer if mentioned
      if (extractedData.customerName) {
        let customer = await Customer.findOne({
          userId,
          name: extractedData.customerName,
        });

        if (!customer) {
          customer = await Customer.create({
            userId,
            name: extractedData.customerName,
          });
        }

        transactionData.customerId = customer._id;
        transactionData.customerName = extractedData.customerName;
      }

      // Create or update items in inventory
      for (const item of extractedData.items) {
        let inventoryItem = await Item.findOne({
          userId,
          name: item.name,
        });

        if (!inventoryItem) {
          inventoryItem = await Item.create({
            userId,
            name: item.name,
            unit: item.unit,
            price: item.unitPrice,
          });
        }

        // Link item to transaction
        const itemIndex = transactionData.items.findIndex(
          (i) => i.name === item.name
        );
        if (itemIndex >= 0) {
          transactionData.items[itemIndex].itemId = inventoryItem._id;
        }
      }

      // Save transaction
      const transaction = await Transaction.create(transactionData);

      createdRecord = {
        type: "transaction",
        recordType: transactionData.type,
        recordId: transaction._id,
      };

      // Generate confirmation
      aiReply = generateConfirmation(extractedData, language);

      const io = req.app.get("io");
      if (io) {
        io.to(`user:${userId}`).emit("transaction:created", {
          transaction,
          items: extractedData.items,
          type: transactionData.type,
        });
      }
    } else {
      // No transaction detected, use conversational AI with enhanced intelligence
      const conversationalPrompt =
        language === "sw"
          ? `Wewe ni SokoTally, msaidizi hodari wa biashara kwa wauzaji mbogamboga nchini Kenya.

MHIMU SANA: Jibu DAIMA kwa Kiswahili pekee. Usitumie Kiingereza kabisa. Hata kama mtumiaji anachanganya lugha, wewe jibu kwa Kiswahili tu.

UTENDAJI WAKO:
1. KUSIKIZA: Elewa mazungumzo ya mtumiaji kwa makini
2. KUELEWA: Tambua nia ya mtumiaji na data ya kibiashara
3. KUHAKIKISHA: Uliza maswali kabla ya kurekodi data
4. KUREKODI: Hifadhi miamala kwa usahihi
5. KUKUMBUKA: Tumia historia ya miamala katika majibu
6. KUCHANGANUA: Toa maarifa ya kibiashara

Unaweza kusaidia:
- Kurekodi mauzo, matumizi, mikopo kwa lugha ya kawaida
- Kufuatilia bidhaa na wateja
- Kuona ripoti za fedha na takwimu
- Kutoa ushauri wa kibiashara

Kuwa rafiki, mkakamavu na msaidizi. Hakikisha kila unaelewa vizuri kabla ya kurekodi. Jibu kwa Kiswahili tu.`
          : `You are SokoTally, an intelligent business assistant for small shop owners in Kenya.

CRITICAL: Respond ONLY in English. The user has sent an English message, so you MUST reply in English only. Do NOT use Kiswahili at all.

YOUR CAPABILITIES (ChatGPT-style):
1. LISTEN: Understand user's natural speech with context
2. COMPREHEND: Extract transactional intent and entities
3. VALIDATE: Confirm details before recording (e.g., "You sold 5 packets of sugar for 200 KES each, total 1,000 KES. Correct?")
4. RECORD: Store accurate, timestamped transaction events
5. REMEMBER: Maintain conversation state and business history
6. ANALYZE: Provide real-time business insights

You can help users:
- Record sales, expenses, and loans using natural language
- Track inventory items and customers
- View financial reports and analytics
- Provide business insights: "You've made 7 sales today totaling 8,400 KES"
- Answer questions about their business performance

ALWAYS:
- Use clarifying questions when uncertain
- Confirm transactions before recording
- Provide running totals and summaries
- Be conversational, accurate, and helpful
- Remember context from previous messages
- Respond in English only since the user wrote in English

Think like a conversational accountant who listens, understands, verifies, records, remembers, analyzes, and speaks back - all in English.`;

      const llmResult = await getLLMResponse(
        userMessage,
        conversationalPrompt,
        recentMessages.reverse()
      );
      aiReply = llmResult.reply;
    }

    // 6. Save user message to database
    const userChatMessage = new ChatMessage({
      userId,
      conversationId: convId,
      message: userMessage,
      sender: "user",
      messageType: "text",
      extractedKeywords: keywords.categories.map((cat) => ({
        keyword: cat,
        category: cat,
        value: null,
      })),
      processedData: extractedData,
    });
    await userChatMessage.save();

    // 7. Save AI response to database
    const aiChatMessage = new ChatMessage({
      userId,
      conversationId: convId,
      message: aiReply,
      sender: "ai",
      messageType: "text",
      processedData: extractedData,
      createdRecord,
      metadata: {
        model: process.env.LLM_PROVIDER || "transactionExtractor",
        processingTime: Date.now() - startTime,
        language: language,
        confidence: extractedData.confidence,
      },
    });
    await aiChatMessage.save();

    res.json({
      reply: aiReply,
      conversationId: convId,
      createdRecord,
      extractedData,
      language,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Voice message endpoint
router.post(
  "/voice",
  authMiddleware,
  voiceUpload.single("audio"),
  async (req, res, next) => {
    const startTime = Date.now();

    try {
      if (!req.file) {
        return res.status(400).json({ error: "Audio file is required" });
      }

      const { conversationId } = req.body || {};
      const convId = conversationId || uuidv4();
      const userId = req.userId;

      // Cloudinary returns the secure URL in req.file.path
      const audioUrl = req.file.path;

      // 1. Transcribe audio to text (Cloudinary URL can be used directly)
      const transcriptionResult = await transcribeAudio(audioUrl);
      const transcribedText = transcriptionResult.text;

      // 2. Detect language (English, Kiswahili, or mixed)
      const language = detectLanguage(transcribedText);

      // 3. Use ADVANCED AI extraction for structured data
      const extractedData = await extractTransactionData(
        transcribedText,
        language
      );

      // 4. Get conversation history for context
      const recentMessages = await ChatMessage.find({
        userId,
        conversationId: convId,
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      // 5. Generate AI confirmation message
      let aiReply = "";
      let createdRecord = null;

      // Process transaction if data was extracted
      if (extractedData.transactionType && extractedData.totalAmount > 0) {
        // Create transaction with items
        const transactionData = {
          userId,
          type:
            extractedData.transactionType === "sale"
              ? "income"
              : extractedData.transactionType === "purchase"
              ? "expense"
              : extractedData.transactionType,
          amount: extractedData.totalAmount,
          items: extractedData.items,
          conversationText: transcribedText,
          extractedData: extractedData,
          occurredAt: extractedData.date
            ? new Date(extractedData.date)
            : new Date(),
          status: "paid",
        };

        // Handle customer if mentioned
        if (extractedData.customerName) {
          let customer = await Customer.findOne({
            userId,
            name: {
              $regex: new RegExp(`^${extractedData.customerName}$`, "i"),
            },
          });

          if (!customer) {
            customer = await Customer.create({
              userId,
              name: extractedData.customerName,
              createdAt: new Date(),
            });
          }

          transactionData.customerId = customer._id;
        }

        // Create transaction
        const transaction = await Transaction.create(transactionData);

        createdRecord = {
          type: "transaction",
          recordType: transactionData.type,
          recordId: transaction._id,
          items: extractedData.items,
        };

        // Emit Socket.IO event for real-time dashboard update
        const io = req.app.get("io");
        if (io) {
          io.to(`user-${userId}`).emit("transaction:created", {
            transaction,
            items: extractedData.items,
            type: transactionData.type,
          });
        }

        // Generate confirmation in appropriate language
        aiReply = generateConfirmation(extractedData, language);
      } else {
        // No transaction detected - have a conversation with language-aware system prompt
        const keywords = extractKeywords(transcribedText);
        let systemPrompt = buildContextFromKeywords(keywords);

        // Add language-specific instruction
        if (language === "sw") {
          systemPrompt = `${systemPrompt}\n\nMHIMU SANA: Jibu DAIMA kwa Kiswahili pekee. Usitumie Kiingereza hata kidogo. Mtumiaji ameongea Kiswahili, basi jibu kwa Kiswahili kamili tu.`;
        } else {
          systemPrompt = `${systemPrompt}\n\nCRITICAL: Respond ONLY in English. The user spoke in English, so reply in English only. Do NOT use Kiswahili at all.`;
        }

        const llmResult = await getLLMResponse(
          transcribedText,
          systemPrompt,
          recentMessages.reverse()
        );
        aiReply = llmResult.reply;
      }

      // 6. Save user voice message
      const userChatMessage = new ChatMessage({
        userId,
        conversationId: convId,
        message: transcribedText,
        sender: "user",
        messageType: "voice",
        audioUrl,
        transcription: transcribedText,
        extractedKeywords:
          extractedData.items?.map((item) => ({
            keyword: item.name,
            category: extractedData.transactionType,
            value: item.totalPrice,
          })) || [],
      });
      await userChatMessage.save();

      // 7. Save AI response
      const aiChatMessage = new ChatMessage({
        userId,
        conversationId: convId,
        message: aiReply,
        sender: "ai",
        messageType: "text",
        processedData: extractedData,
        createdRecord,
        metadata: {
          language: language,
          processingTime: Date.now() - startTime,
        },
      });
      await aiChatMessage.save();

      res.json({
        reply: aiReply,
        transcription: transcribedText,
        conversationId: convId,
        createdRecord,
        extractedData,
        language,
        audioUrl,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get chat history
router.get("/history", authMiddleware, async (req, res, next) => {
  try {
    const { conversationId, limit = 50 } = req.query;
    const userId = req.userId;

    const query = { userId };
    if (conversationId) {
      query.conversationId = conversationId;
    }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      messages: messages.reverse(),
      total: messages.length,
    });
  } catch (error) {
    next(error);
  }
});

// Get all conversations
router.get("/conversations", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.userId;
    const mongoose = await import("mongoose");

    // Get unique conversations with latest message
    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          userId: mongoose.default.Types.ObjectId.isValid(userId)
            ? new mongoose.default.Types.ObjectId(userId)
            : userId,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$conversationId",
          lastMessageAt: { $first: "$createdAt" },
          firstMessage: { $last: "$message" },
          messageCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 1,
          title: { $substr: ["$firstMessage", 0, 50] },
          lastMessageAt: 1,
          messageCount: 1,
          createdAt: "$lastMessageAt",
        },
      },
      { $sort: { lastMessageAt: -1 } },
      { $limit: 50 },
    ]);

    res.json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    next(error);
  }
});

// Get messages for a specific conversation
router.get(
  "/conversations/:conversationId",
  authMiddleware,
  async (req, res, next) => {
    try {
      const userId = req.userId;
      const { conversationId } = req.params;

      const messages = await ChatMessage.find({
        userId,
        conversationId,
      })
        .sort({ createdAt: 1 })
        .lean();

      res.json({ messages, conversationId });
    } catch (error) {
      next(error);
    }
  }
);

// Delete a conversation
router.delete(
  "/conversations/:conversationId",
  authMiddleware,
  async (req, res, next) => {
    try {
      const userId = req.userId;
      const { conversationId } = req.params;

      await ChatMessage.deleteMany({
        userId,
        conversationId,
      });

      res.json({ success: true, message: "Conversation deleted" });
    } catch (error) {
      next(error);
    }
  }
);

// TTS endpoint - Convert text to speech
router.post("/tts", authMiddleware, async (req, res, next) => {
  try {
    const { text, voice } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required for TTS" });
    }

    // Limit text length for TTS
    const textToSpeak = text.trim().slice(0, 4096);

    const { audio, contentType } = await synthesizeSpeech(
      textToSpeak,
      voice || "alloy"
    );

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", audio.length);
    res.send(audio);
  } catch (error) {
    console.error("TTS endpoint error:", error);
    if (
      error.message.includes("requires") ||
      error.message.includes("not yet available")
    ) {
      res.status(501).json({
        error: "TTS not configured",
        message: error.message,
        fallback: "client-side",
      });
    } else {
      next(error);
    }
  }
});

export default router;
