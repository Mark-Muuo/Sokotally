import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { voiceUpload } from "../middleware/upload.js";
import ChatMessage from "../models/ChatMessage.js";
import Transaction from "../models/Transaction.js";
import Item from "../models/Item.js";
import Debt from "../models/Debt.js";
import Customer from "../models/Customer.js";
import { extractKeywords } from "../services/keywordExtractor.js";
import {
  getLLMResponse,
  transcribeAudio,
  synthesizeSpeech,
} from "../services/llmService.js";
import { extractTransactionData } from "../services/transactionExtractor.js";
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

    // Fetch business analytics if user is asking about sales/business data
    let businessContext = "";
    const lowerMessage = userMessage.toLowerCase();
    const isBusinessQuery =
      lowerMessage.includes("top") ||
      lowerMessage.includes("selling") ||
      lowerMessage.includes("least") ||
      lowerMessage.includes("sales") ||
      lowerMessage.includes("profit") ||
      lowerMessage.includes("expense") ||
      lowerMessage.includes("debt") ||
      lowerMessage.includes("mauzo") ||
      lowerMessage.includes("faida") ||
      lowerMessage.includes("matumizi") ||
      lowerMessage.includes("deni") ||
      lowerMessage.includes("bidhaa") ||
      lowerMessage.includes("item") ||
      lowerMessage.includes("product");

    if (isBusinessQuery) {
      try {
        // Fetch analytics data
        const [topItemsData, leastItemsData, statsData] = await Promise.all([
          Transaction.aggregate([
            {
              $match: {
                userId,
                type: "income",
                items: { $exists: true, $ne: [] },
              },
            },
            { $unwind: "$items" },
            {
              $group: {
                _id: { $toLower: { $trim: { input: "$items.name" } } },
                originalName: { $first: "$items.name" },
                totalQuantity: { $sum: "$items.quantity" },
                totalRevenue: {
                  $sum: {
                    $ifNull: [
                      "$items.totalPrice",
                      { $multiply: ["$items.unitPrice", "$items.quantity"] },
                    ],
                  },
                },
                avgPrice: {
                  $avg: { $ifNull: ["$items.unitPrice", "$items.price"] },
                },
              },
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
          ]),
          Transaction.aggregate([
            {
              $match: {
                userId,
                type: "income",
                items: { $exists: true, $ne: [] },
              },
            },
            { $unwind: "$items" },
            {
              $group: {
                _id: { $toLower: { $trim: { input: "$items.name" } } },
                originalName: { $first: "$items.name" },
                totalQuantity: { $sum: "$items.quantity" },
                totalRevenue: {
                  $sum: {
                    $ifNull: [
                      "$items.totalPrice",
                      { $multiply: ["$items.unitPrice", "$items.quantity"] },
                    ],
                  },
                },
                avgPrice: {
                  $avg: { $ifNull: ["$items.unitPrice", "$items.price"] },
                },
              },
            },
            { $sort: { totalQuantity: 1 } },
            { $limit: 10 },
          ]),
          Transaction.aggregate([
            { $match: { userId } },
            {
              $group: {
                _id: "$type",
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ]),
        ]);

        // Format business context
        const sales = statsData.find((s) => s._id === "income")?.total || 0;
        const expenses = statsData.find((s) => s._id === "expense")?.total || 0;
        const profit = sales - expenses;

        businessContext = `\n\nBUSINESS ANALYTICS DATA (use this to answer business questions):
Total Sales: KSh ${sales.toLocaleString()}
Total Expenses: KSh ${expenses.toLocaleString()}
Net Profit: KSh ${profit.toLocaleString()}

Top Selling Items (by quantity):
${topItemsData
  .slice(0, 5)
  .map(
    (item, i) =>
      `${i + 1}. ${item.originalName} - ${item.totalQuantity} units sold, KSh ${item.totalRevenue?.toLocaleString() || 0} revenue, avg price KSh ${item.avgPrice?.toFixed(2) || 0}`
  )
  .join("\n")}

Least Selling Items (by quantity):
${leastItemsData
  .slice(0, 5)
  .map(
    (item, i) =>
      `${i + 1}. ${item.originalName} - ${item.totalQuantity} units sold, KSh ${item.totalRevenue?.toLocaleString() || 0} revenue, avg price KSh ${item.avgPrice?.toFixed(2) || 0}`
  )
  .join("\n")}

Use this data to provide accurate, helpful answers about the business performance.`;
      } catch (error) {
        console.error("Error fetching business context:", error);
      }
    }

    // Get conversation history for context
    const recentMessages = await ChatMessage.find({
      userId,
      conversationId: convId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Use ONE unified conversational prompt - let the LLM detect language automatically
    const conversationalPrompt = `You are SokoTally, a friendly AI assistant for small shop owners in Kenya. You are like ChatGPT - helpful, conversational, and can talk about anything naturally.

CRITICAL LANGUAGE RULE: You MUST respond in the EXACT SAME LANGUAGE that the user is using. If they write in Swahili, respond in Swahili. If they write in English, respond in English. Do NOT translate or switch languages.

You are a normal conversational AI that can:
- Chat about absolutely anything - business, weather, daily life, general questions, news, sports, entertainment
- Answer any questions casually and naturally, just like ChatGPT
- Be friendly, helpful, and understanding
- Help record sales, expenses, loans when users want to
- Provide detailed business analytics and insights
- Give advice on business, customer service, inventory management
- Tell jokes, share stories, or just have casual conversation

BUSINESS ANALYTICS CAPABILITIES:
When users ask about their business (sales, profits, top/least selling items, etc.), you have access to real-time data.
You can answer questions like:
- "What are my top selling items?" / "Bidhaa zipi zinauzwa zaidi?"
- "What are my least selling items?" / "Bidhaa zipi haziuzwi sana?"
- "How much profit did I make?" / "Nimefanya faida kiasi gani?"
- "What are my total sales?" / "Mauzo yangu ni kiasi gani?"
- "Which items need more attention?" / "Bidhaa zipi zinahitaji umakini zaidi?"
- Provide specific numbers, item names, quantities, and prices from the data provided below

Your personality:
- Be like a close friend who also happens to be great at business
- Keep responses conversational and natural - not robotic
- Use the user's language exactly as they used it
- Match their tone - if they're casual, be casual; if they're formal, be respectful
- If they mix languages, respond primarily in their main language
- Be encouraging and positive
- When discussing business data, be specific and use the actual numbers

Examples of how to respond:

If user says in English: "What are my top selling items?"
Respond with actual data: "Your top sellers are: 1. Tomatoes - 45 units sold for KSh 4,500, 2. Onions - 30 units sold for KSh 3,000... These are doing great!"

If user says in Swahili: "Bidhaa zipi zinauzwa zaidi?"
Respond in Swahili with data: "Bidhaa zinazouzwa zaidi ni: 1. Nyanya - vitengo 45 kwa Ksh 4,500, 2. Vitunguu - vitengo 30 kwa Ksh 3,000... Unafanya vizuri sana!"

If user says in English: "Which items aren't selling well?"
Respond: "These items need some attention: 1. Carrots - only 3 units sold for KSh 150, 2. Cabbage - only 5 units sold for KSh 250... Maybe try a promotion?"

If user says in Swahili: "Niambie faida yangu"
Respond in Swahili: "Ukaguzi wa biashara yako: Mauzo - Ksh 50,000, Matumizi - Ksh 30,000, Faida - Ksh 20,000. Umefanya vizuri!"

REMEMBER: 
- Match the user's language exactly
- Be natural and conversational like ChatGPT
- Use REAL DATA from the business analytics when answering business questions
- Provide specific numbers, item names, quantities, and prices
- You can talk about ANY topic they bring up
- Only mention transaction recording when they talk about business/sales
- Be their friendly AI companion for business and life${businessContext}`;

    const llmResult = await getLLMResponse(
      userMessage,
      conversationalPrompt,
      recentMessages.reverse()
    );
    const aiReply = llmResult.reply;

    // Extract keywords and try transaction extraction - no language needed for extraction
    const keywords = extractKeywords(userMessage);
    const extractedData = await extractTransactionData(userMessage);

    // Check if transaction was detected - but DON'T save yet, wait for user confirmation
    let pendingTransaction = null;
    const hasStrongTransactionIntent =
      extractedData.transactionType &&
      extractedData.totalAmount > 0 &&
      (extractedData.confidence > 0.5 || // Lower threshold for better detection
        userMessage.toLowerCase().includes("sold") ||
        userMessage.toLowerCase().includes("bought") ||
        userMessage.toLowerCase().includes("nimeuza") ||
        userMessage.toLowerCase().includes("nilinunua") ||
        userMessage.toLowerCase().includes("uza") ||
        userMessage.toLowerCase().includes("nunua") ||
        userMessage.toLowerCase().includes("paid") ||
        userMessage.toLowerCase().includes("lipa") ||
        userMessage.toLowerCase().includes("received"));

    if (hasStrongTransactionIntent) {
      // Prepare transaction data but DON'T save yet
      pendingTransaction = {
        type:
          extractedData.transactionType === "sale"
            ? "income"
            : extractedData.transactionType === "purchase"
              ? "expense"
              : extractedData.transactionType,
        amount: extractedData.totalAmount,
        items: extractedData.items,
        customerName: extractedData.customerName,
        date: extractedData.date,
        notes: extractedData.notes,
        extractedData: extractedData,
      };
    }

    // 6. Save user message to database
    const createdRecord = null; // Initialize for response
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
        model: process.env.LLM_PROVIDER || "groq",
        processingTime: Date.now() - startTime,
        confidence: extractedData.confidence,
      },
    });
    await aiChatMessage.save();

    res.json({
      reply: aiReply,
      conversationId: convId,
      pendingTransaction,
      extractedData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// NEW: Confirm and save transaction endpoint
router.post("/confirm-transaction", authMiddleware, async (req, res, next) => {
  try {
    const { transactionData, conversationId } = req.body;
    const userId = req.userId;

    if (!transactionData) {
      return res.status(400).json({ error: "Transaction data is required" });
    }

    // Build complete transaction data
    const fullTransactionData = {
      userId,
      type: transactionData.type,
      amount: transactionData.amount,
      items: transactionData.items,
      conversationText: transactionData.conversationText || "",
      extractedData: transactionData.extractedData,
      occurredAt: transactionData.date
        ? new Date(transactionData.date)
        : new Date(),
      status:
        transactionData.type === "debt" || transactionData.type === "loan"
          ? "unpaid"
          : "paid",
    };

    // Handle customer if mentioned
    if (transactionData.customerName) {
      let customer = await Customer.findOne({
        userId,
        name: transactionData.customerName,
      });

      if (!customer) {
        customer = await Customer.create({
          userId,
          name: transactionData.customerName,
        });
      }

      fullTransactionData.customerId = customer._id;
      fullTransactionData.customerName = transactionData.customerName;
    }

    // Create or update items in inventory
    for (const item of transactionData.items) {
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
      const itemIndex = fullTransactionData.items.findIndex(
        (i) => i.name === item.name
      );
      if (itemIndex >= 0) {
        fullTransactionData.items[itemIndex].itemId = inventoryItem._id;
      }
    }

    // Save transaction
    const transaction = await Transaction.create(fullTransactionData);

    const createdRecord = {
      type: "transaction",
      recordType: fullTransactionData.type,
      recordId: transaction._id,
    };

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${userId}`).emit("transaction:created", {
        transaction,
        items: transactionData.items,
        type: fullTransactionData.type,
      });
    }

    res.json({
      success: true,
      transaction,
      createdRecord,
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

      // Extract structured transaction data from transcribed text
      const extractedData = await extractTransactionData(transcribedText);

      // Get conversation history for context
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
      let pendingTransaction = null;
      const hasStrongTransactionIntent =
        extractedData.transactionType &&
        extractedData.totalAmount > 0 &&
        (extractedData.confidence > 0.5 ||
          transcribedText.toLowerCase().includes("sold") ||
          transcribedText.toLowerCase().includes("bought") ||
          transcribedText.toLowerCase().includes("nimeuza") ||
          transcribedText.toLowerCase().includes("nilinunua") ||
          transcribedText.toLowerCase().includes("paid") ||
          transcribedText.toLowerCase().includes("lipa"));

      if (hasStrongTransactionIntent) {
        // Prepare transaction data but DON'T save yet - wait for user confirmation
        pendingTransaction = {
          type:
            extractedData.transactionType === "sale"
              ? "income"
              : extractedData.transactionType === "purchase"
                ? "expense"
                : extractedData.transactionType,
          amount: extractedData.totalAmount,
          items: extractedData.items,
          customerName: extractedData.customerName,
          date: extractedData.date,
          notes: transcribedText,
          extractedData: extractedData,
        };
      }

      // Generate AI response using unified conversational prompt
      const conversationalPrompt = `You are SokoTally, a friendly AI assistant for small shop owners in Kenya. You are like ChatGPT - helpful, conversational, and can talk about anything naturally.

CRITICAL LANGUAGE RULE: You MUST respond in the EXACT SAME LANGUAGE that the user is using. If they write in Swahili, respond in Swahili. If they write in English, respond in English. Do NOT translate or switch languages.

You are a normal conversational AI that can:
- Chat about absolutely anything - business, weather, daily life, general questions, news, sports, entertainment
- Answer any questions casually and naturally, just like ChatGPT
- Be friendly, helpful, and understanding
- Help record sales, expenses, loans when users want to
- Give advice on business, customer service, inventory management
- Tell jokes, share stories, or just have casual conversation

Your personality:
- Be like a close friend who also happens to be great at business
- Keep responses conversational and natural - not robotic
- Use the user's language exactly as they used it
- Match their tone - if they're casual, be casual; if they're formal, be respectful
- If they mix languages, respond primarily in their main language
- Be encouraging and positive

Examples of how to respond:

If user says in English: "How are you?"
Respond: "I'm doing great! How about you? How's business going today?"

If user says in English: "What's the weather like?"
Respond: "I don't have real-time weather data, but I can tell you it's usually sunny in Kenya this time of year! How's the weather where you are?"

If user says in English: "I sold 5 tomatoes for 100 shillings each"
Respond: "Nice! That's 500 shillings in sales. Want me to record that for you?"

If user says in Swahili: "Habari yako?"
Respond in Swahili: "Nzuri sana! Habari zako? Biashara inakuwaje leo?"

If user says in Swahili: "Nimeuza nyanya 5 kwa shilingi 100 kila moja"
Respond in Swahili: "Hongera! Umefanya mauzo ya shilingi 500. Je, ungependa nirekodi?"

If user says in English: "Tell me a joke"
Respond: "Why did the tomato turn red? Because it saw the salad dressing! What about you, got any good jokes?"

If user says in Swahili: "Niambie utani"
Respond in Swahili: "Kwa nini nyanya iligeuka nyekundu? Kwa sababu iliona salad ikivaa mavazi! Wewe una utani gani mzuri?"

REMEMBER: 
- Match the user's language exactly
- Be natural and conversational like ChatGPT
- You can talk about ANY topic they bring up
- Only mention transaction recording when they talk about business/sales
- Be their friendly AI companion for business and life`;

      const llmResult = await getLLMResponse(
        transcribedText,
        conversationalPrompt,
        recentMessages.reverse()
      );
      aiReply = llmResult.reply;

      // Save user voice message
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

      // Save AI response
      const aiChatMessage = new ChatMessage({
        userId,
        conversationId: convId,
        message: aiReply,
        sender: "ai",
        messageType: "text",
        processedData: extractedData,
        metadata: {
          processingTime: Date.now() - startTime,
        },
      });
      await aiChatMessage.save();

      res.json({
        reply: aiReply,
        transcription: transcribedText,
        conversationId: convId,
        pendingTransaction,
        extractedData,
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
