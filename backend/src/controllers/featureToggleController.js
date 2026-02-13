import { FeatureToggle } from "../models/FeatureToggle.js";

/**
 * Feature Toggle Controller
 * Admin can enable/disable features system-wide
 */

/**
 * Get all feature toggles
 */
export async function getAllFeatures(req, res) {
  try {
    const features = await FeatureToggle.find()
      .populate("lastModifiedBy", "name email")
      .sort({ category: 1, name: 1 });

    const grouped = features.reduce((acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push(feature);
      return acc;
    }, {});

    res.json({ features, grouped });
  } catch (error) {
    console.error("Get features error:", error);
    res.status(500).json({ error: "Failed to fetch features" });
  }
}

/**
 * Create a new feature toggle
 */
export async function createFeature(req, res) {
  try {
    const { name, key, description, category, affectedUsers, enabled } =
      req.body;

    const feature = new FeatureToggle({
      name,
      key,
      description,
      category: category || "feature",
      affectedUsers: affectedUsers || "all",
      enabled: enabled !== undefined ? enabled : true,
      lastModifiedBy: req.userId,
      lastModifiedAt: new Date(),
    });

    await feature.save();

    res.status(201).json({ success: true, feature });
  } catch (error) {
    console.error("Create feature error:", error);
    res.status(500).json({ error: "Failed to create feature" });
  }
}

/**
 * Toggle feature on/off
 */
export async function toggleFeature(req, res) {
  try {
    const { featureId } = req.params;
    const { enabled } = req.body;

    const feature = await FeatureToggle.findByIdAndUpdate(
      featureId,
      {
        enabled,
        lastModifiedBy: req.userId,
        lastModifiedAt: new Date(),
      },
      { new: true },
    );

    if (!feature) {
      return res.status(404).json({ error: "Feature not found" });
    }

    res.json({
      success: true,
      message: `Feature ${feature.name} ${enabled ? "enabled" : "disabled"}`,
      feature,
    });
  } catch (error) {
    console.error("Toggle feature error:", error);
    res.status(500).json({ error: "Failed to toggle feature" });
  }
}

/**
 * Update feature settings
 */
export async function updateFeature(req, res) {
  try {
    const { featureId } = req.params;
    const updates = req.body;

    const feature = await FeatureToggle.findByIdAndUpdate(
      featureId,
      {
        ...updates,
        lastModifiedBy: req.userId,
        lastModifiedAt: new Date(),
      },
      { new: true },
    );

    if (!feature) {
      return res.status(404).json({ error: "Feature not found" });
    }

    res.json({ success: true, feature });
  } catch (error) {
    console.error("Update feature error:", error);
    res.status(500).json({ error: "Failed to update feature" });
  }
}

/**
 * Delete feature toggle
 */
export async function deleteFeature(req, res) {
  try {
    const { featureId } = req.params;

    const feature = await FeatureToggle.findByIdAndDelete(featureId);

    if (!feature) {
      return res.status(404).json({ error: "Feature not found" });
    }

    res.json({ success: true, message: "Feature deleted" });
  } catch (error) {
    console.error("Delete feature error:", error);
    res.status(500).json({ error: "Failed to delete feature" });
  }
}
