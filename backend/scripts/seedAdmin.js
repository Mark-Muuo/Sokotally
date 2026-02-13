import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "../src/models/User.js";

/**
 * Seed Admin User Script
 * Creates an admin user for accessing the Platform Control Center
 *
 * Usage: node backend/scripts/seedAdmin.js
 */

const mongoUri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sokotally";

async function seedAdmin() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists:");
      console.log(`  Name: ${existingAdmin.name}`);
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Phone: ${existingAdmin.phone}`);

      const readline = await import("readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise((resolve) => {
        rl.question(
          "Do you want to create another admin user? (y/n): ",
          resolve,
        );
      });
      rl.close();

      if (answer.toLowerCase() !== "y") {
        console.log("Exiting...");
        process.exit(0);
      }
    }

    // Admin user details
    const adminData = {
      name: "System Administrator",
      email: "admin@sokotally.com",
      phone: "+254700000000",
      username: "admin",
      password: "Admin@2026!",
      role: "admin",
      preferredLang: "en",
      firstName: "System",
      lastName: "Administrator",
    };

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminData.password, salt);

    // Create admin user
    const admin = new User({
      name: adminData.name,
      email: adminData.email,
      phone: adminData.phone,
      username: adminData.username,
      passwordHash,
      role: adminData.role,
      preferredLang: adminData.preferredLang,
      firstName: adminData.firstName,
      lastName: adminData.lastName,
    });

    await admin.save();

    console.log("\nAdmin user created successfully!");
    console.log("\nAdmin Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Email:    ${adminData.email}`);
    console.log(`Phone:    ${adminData.phone}`);
    console.log(`Username: ${adminData.username}`);
    console.log(`Password: ${adminData.password}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\nWARNING: Please change the password after first login!");
    console.log("\nAccess the admin panel at: /admin");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin user:", error);
    process.exit(1);
  }
}

seedAdmin();
