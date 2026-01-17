import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import ChatMessage from "../models/ChatMessage.js";
import Transaction from "../models/Transaction.js";
import Item from "../models/Item.js";
import Debt from "../models/Debt.js";
import Customer from "../models/Customer.js";
import { authMiddleware } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

export const authRouter = Router();

function sign(user) {
  const payload = { sub: user.id, phone: user.phone };
  const secret = process.env.JWT_SECRET || "dev-secret";
  const expiresIn = "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

authRouter.post("/register", async (req, res) => {
  try {
    const { name, firstName, lastName, phone, password, preferredLang } =
      req.body || {};
    const computedName =
      name || [firstName, lastName].filter(Boolean).join(" ").trim();
    if (!firstName || !lastName || !computedName || !phone || !password)
      return res.status(400).json({ error: "Missing fields" });

    // Normalize phone number (remove spaces, ensure it starts with +254)
    const normalizedPhone = phone.replace(/\s/g, "").startsWith("+254")
      ? phone.replace(/\s/g, "")
      : `+254${phone.replace(/^0/, "")}`;

    const exists = await User.findOne({ phone: normalizedPhone });
    if (exists)
      return res.status(409).json({ error: "Phone number already registered" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: computedName,
      firstName,
      lastName,
      phone: normalizedPhone,
      passwordHash,
      preferredLang: preferredLang || "en",
    });
    const token = sign(user);
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        preferredLang: user.preferredLang || "en",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        town: user.town || "",
        gender: user.gender || "",
        ageRange: user.ageRange || "",
        avatar: user.avatar || "",
      },
    });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body || {};
    if (!phone || !password)
      return res.status(400).json({ error: "Phone and password required" });

    // Normalize phone number
    const normalizedPhone = phone.replace(/\s/g, "").startsWith("+254")
      ? phone.replace(/\s/g, "")
      : `+254${phone.replace(/^0/, "")}`;

    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = sign(user);
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        preferredLang: user.preferredLang || "en",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        town: user.town || "",
        gender: user.gender || "",
        ageRange: user.ageRange || "",
        avatar: user.avatar || "",
      },
    });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// Send OTP to user's phone (DEV: returns code when not in production)
authRouter.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body || {};
    if (!phone) return res.status(400).json({ error: "Phone required" });
    const normalizedPhone = phone.replace(/\s/g, "").startsWith("+254")
      ? phone.replace(/\s/g, "")
      : `+254${phone.replace(/^0/, "")}`;
    const user = await User.findOne({ phone: normalizedPhone });
    if (!user)
      return res
        .status(404)
        .json({ error: "No account found for this phone number" });

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await User.findByIdAndUpdate(user.id, {
      otpCode: code,
      otpExpires: expires,
    });

    const payload = { ok: true, sent: true };
    if ((process.env.NODE_ENV || "development") !== "production") {
      payload.code = code; // return code in dev for testing
    }
    return res.json(payload);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// Verify OTP and issue JWT
authRouter.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body || {};
    if (!phone || !otp)
      return res.status(400).json({ error: "Phone and OTP required" });
    const normalizedPhone = phone.replace(/\s/g, "").startsWith("+254")
      ? phone.replace(/\s/g, "")
      : `+254${phone.replace(/^0/, "")}`;
    const user = await User.findOne({ phone: normalizedPhone });
    if (!user)
      return res
        .status(404)
        .json({ error: "No account found for this phone number" });

    // Validate OTP
    if (!user.otpCode || !user.otpExpires)
      return res
        .status(400)
        .json({ error: "No active OTP. Please request a new code." });
    if (new Date(user.otpExpires).getTime() < Date.now())
      return res
        .status(400)
        .json({ error: "OTP expired. Please request a new code." });
    if (String(user.otpCode) !== String(otp))
      return res.status(401).json({ error: "Invalid OTP code" });

    // Clear OTP and sign token
    await User.findByIdAndUpdate(user.id, { otpCode: "", otpExpires: null });
    const token = sign(user);
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        preferredLang: user.preferredLang || "en",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        town: user.town || "",
        gender: user.gender || "",
        ageRange: user.ageRange || "",
        avatar: user.avatar || "",
      },
    });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

authRouter.post("/reset-password", async (req, res) => {
  try {
    const { phone, newPassword } = req.body || {};
    if (!phone || !newPassword)
      return res.status(400).json({ error: "Phone and new password required" });

    // Normalize phone number
    const normalizedPhone = phone.replace(/\s/g, "").startsWith("+254")
      ? phone.replace(/\s/g, "")
      : `+254${phone.replace(/^0/, "")}`;

    const user = await User.findOne({ phone: normalizedPhone });
    if (!user)
      return res
        .status(404)
        .json({ error: "No account found for this phone number" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user.id, { passwordHash });

    return res.json({ message: "Password updated successfully" });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// Get current user's profile
authRouter.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        preferredLang: user.preferredLang || "en",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        town: user.town || "",
        gender: user.gender || "",
        ageRange: user.ageRange || "",
        avatar: user.avatar || "",
      },
    });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// Update current user's profile (name/phone)
authRouter.put("/profile", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      phone,
      firstName,
      lastName,
      town,
      gender,
      ageRange,
      preferredLang,
    } = req.body || {};
    const update = {};
    if (name) update.name = name;
    if (firstName !== undefined) update.firstName = firstName;
    if (lastName !== undefined) update.lastName = lastName;
    if (town !== undefined) update.town = town;
    if (gender !== undefined) update.gender = gender;
    if (ageRange !== undefined) update.ageRange = ageRange;
    if (phone) {
      const normalizedPhone = phone.replace(/\s/g, "").startsWith("+254")
        ? phone.replace(/\s/g, "")
        : `+254${phone.replace(/^0/, "")}`;
      update.phone = normalizedPhone;
    }
    if (preferredLang !== undefined) update.preferredLang = preferredLang;
    if (Object.keys(update).length === 0)
      return res.status(400).json({ error: "No fields to update" });
    const user = await User.findByIdAndUpdate(req.userId, update, {
      new: true,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        preferredLang: user.preferredLang || "en",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        town: user.town || "",
        gender: user.gender || "",
        ageRange: user.ageRange || "",
        avatar: user.avatar || "",
      },
    });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// Refresh token endpoint
authRouter.post("/refresh", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const token = sign(user);
    return res.json({ token });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// Avatar upload endpoint
authRouter.post(
  "/profile/avatar",
  authMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    try {
      console.log("Avatar upload request received");
      console.log("User ID:", req.userId);
      console.log("File:", req.file);

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Cloudinary returns the secure URL in req.file.path
      const avatarUrl = req.file.path;
      console.log("Avatar URL from Cloudinary:", avatarUrl);

      await User.findByIdAndUpdate(req.userId, { avatar: avatarUrl });

      return res.json({
        message: "Avatar uploaded successfully",
        avatar: avatarUrl,
      });
    } catch (error) {
      console.error("Avatar upload error details:", error);
      console.error("Error stack:", error.stack);
      return res.status(500).json({
        error: "Failed to upload avatar",
        details: error.message,
      });
    }
  }
);

// Delete account and ALL user data (GDPR compliance)
authRouter.delete("/account", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Delete all user data in parallel for efficiency
    await Promise.all([
      ChatMessage.deleteMany({ userId }),
      Transaction.deleteMany({ userId }),
      Item.deleteMany({ userId }),
      Debt.deleteMany({ userId }),
      Customer.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    return res.json({
      message: "Account and all associated data deleted successfully",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return res.status(500).json({ error: "Failed to delete account" });
  }
});
