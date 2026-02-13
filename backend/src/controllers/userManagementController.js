import { User } from "../models/User.js";
import { FeatureToggle } from "../models/FeatureToggle.js";

/**
 * User Management Controller
 * Admin can view, search, promote/demote users
 */

/**
 * Get all users with pagination and search
 */
export async function getAllUsers(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      role = "",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const query = {};

    // Search by name, email, or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "desc" ? -1 : 1;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-passwordHash -otpCode -otpExpires")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

/**
 * Get single user details
 */
export async function getUserDetails(req, res) {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "-passwordHash -otpCode -otpExpires",
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
}

/**
 * Promote user to admin
 */
export async function promoteToAdmin(req, res) {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { role: "admin" },
      { new: true },
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: `${user.name} has been promoted to admin`,
      user,
    });
  } catch (error) {
    console.error("Promote to admin error:", error);
    res.status(500).json({ error: "Failed to promote user" });
  }
}

/**
 * Demote admin to regular user
 */
export async function demoteFromAdmin(req, res) {
  try {
    const { userId } = req.params;

    // Prevent self-demotion
    if (userId === req.userId) {
      return res.status(400).json({ error: "Cannot demote yourself" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role: "user" },
      { new: true },
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: `${user.name} has been demoted to regular user`,
      user,
    });
  } catch (error) {
    console.error("Demote from admin error:", error);
    res.status(500).json({ error: "Failed to demote user" });
  }
}

/**
 * Ban/suspend user account
 */
export async function suspendUser(req, res) {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Prevent self-suspension
    if (userId === req.userId) {
      return res.status(400).json({ error: "Cannot suspend yourself" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        suspended: true,
        suspendedReason: reason || "Suspended by admin",
        suspendedAt: new Date(),
      },
      { new: true },
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: `${user.name} has been suspended`,
      user,
    });
  } catch (error) {
    console.error("Suspend user error:", error);
    res.status(500).json({ error: "Failed to suspend user" });
  }
}

/**
 * Unsuspend user account
 */
export async function unsuspendUser(req, res) {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        suspended: false,
        suspendedReason: null,
        suspendedAt: null,
      },
      { new: true },
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: `${user.name} has been unsuspended`,
      user,
    });
  } catch (error) {
    console.error("Unsuspend user error:", error);
    res.status(500).json({ error: "Failed to unsuspend user" });
  }
}

/**
 * Delete user account (permanent)
 */
export async function deleteUser(req, res) {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (userId === req.userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // TODO: Delete all user data (transactions, items, etc.)

    res.json({
      success: true,
      message: `User ${user.name} has been permanently deleted`,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
}
