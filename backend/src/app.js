import express from "express";
import cors from "cors";
import morgan from "morgan";

// Routes
import { authRouter } from "./routes/auth.js";
import itemsRouter from "./routes/items.js";
import transactionsRouter from "./routes/transactions.js";
import chatRouter from "./routes/chat.js";
import adminRouter from "./routes/admin.js";
import inventoryRouter from "./routes/inventory.js";

// Middleware
import errorHandler from "./middleware/errorHandler.js";
import { performanceTrackingMiddleware } from "./services/healthMonitor.js";

const app = express();

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173", // Local dev
  "http://localhost:3000",
  process.env.FRONTEND_URL, // Vercel deployment
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in production for now, change to false for strict CORS
      }
    },
    credentials: true,
  }),
);

// Core middleware
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(performanceTrackingMiddleware);

// Health
app.get("/", (_req, res) =>
  res.json({ status: "ok", service: "Sokotally API" }),
);
app.get("/health", (_req, res) => res.json({ ok: true }));

// API routes
// Routes (non-versioned)
app.use("/auth", authRouter);
app.use("/api/items", itemsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/chat", chatRouter);
app.use("/api/admin", adminRouter);

// 404 handler
app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// Central error handler
app.use(errorHandler);

export default app;
