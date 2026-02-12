import { User } from "../models/User.js";

/**
 * Middleware to verify admin role
 * Must be used after authMiddleware
 */
export async function adminAuthMiddleware(req, res, next) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(req.userId).select("role");

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied. Admin privileges required.",
        code: "ADMIN_REQUIRED",
      });
    }

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
