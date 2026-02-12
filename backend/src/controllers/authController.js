import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

function sign(user) {
  const payload = { sub: user.id, phone: user.phone };
  const secret = process.env.JWT_SECRET || "dev-secret";
  const expiresIn = "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

export async function signup(req, res) {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      phone,
      password,
      preferredLang,
    } = req.body || {};
    if (!firstName || !lastName || !phone || !password)
      return res.status(400).json({ error: "Missing required fields" });

    const normalizedPhone = phone.replace(/\s/g, "").startsWith("+254")
      ? phone.replace(/\s/g, "")
      : `+254${phone.replace(/^0/, "")}`;
    const exists = await User.findOne({ phone: normalizedPhone });
    if (exists)
      return res.status(409).json({ error: "Phone already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      username,
      email,
      phone: normalizedPhone,
      passwordHash,
      preferredLang: preferredLang || "en",
    });
    const token = sign(user);
    return res.status(201).json({ token, user: serializeUser(user) });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}

export async function login(req, res) {
  try {
    const { phone, password } = req.body || {};
    if (!phone || !password)
      return res.status(400).json({ error: "Phone and password required" });
    const normalizedPhone = phone.replace(/\s/g, "").startsWith("+254")
      ? phone.replace(/\s/g, "")
      : `+254${phone.replace(/^0/, "")}`;
    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = sign(user);
    return res.json({ token, user: serializeUser(user) });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username || "",
    email: user.email || "",
    phone: user.phone,
    preferredLang: user.preferredLang || "en",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    town: user.town || "",
    gender: user.gender || "",
    ageRange: user.ageRange || "",
    avatar: user.avatar || "",
    role: user.role || "user",
  };
}
