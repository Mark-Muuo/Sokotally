import React, { useEffect, useState } from "react";
import { getToken } from "../../storage/auth";
import { API_BASE } from "../../config/api";
import { Power, Plus, Edit2, Trash2 } from "lucide-react";

const FeatureToggles = () => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newFeature, setNewFeature] = useState({
    name: "",
    key: "",
    description: "",
    category: "feature",
  });

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/features`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFeatures(data.features || []);
      }
    } catch (err) {
      console.error("Failed to fetch features:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureId, currentStatus) => {
    const token = getToken();
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/features/${featureId}/toggle`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setFeatures(
          features.map((f) =>
            f._id === featureId ? { ...f, enabled: !currentStatus } : f,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to toggle feature:", err);
    }
  };

  const createFeature = async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/features`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newFeature),
      });
      if (res.ok) {
        setShowModal(false);
        setNewFeature({
          name: "",
          key: "",
          description: "",
          category: "feature",
        });
        fetchFeatures();
      }
    } catch (err) {
      console.error("Failed to create feature:", err);
    }
  };

  const deleteFeature = async (featureId) => {
    if (!window.confirm("Delete this feature toggle?")) return;
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/features/${featureId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchFeatures();
      }
    } catch (err) {
      console.error("Failed to delete feature:", err);
    }
  };

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) acc[feature.category] = [];
    acc[feature.category].push(feature);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Feature Toggles
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Control platform capabilities and experimental features
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          New Feature
        </button>
      </div>

      {Object.keys(groupedFeatures).map((category) => (
        <div key={category} className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
            {category}
          </h3>
          <div className="space-y-4">
            {groupedFeatures[category].map((feature) => (
              <div
                key={feature._id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {feature.name}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          feature.enabled
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {feature.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {feature.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Key:{" "}
                      <code className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                        {feature.key}
                      </code>
                    </p>
                    {feature.affectedUsers &&
                      feature.affectedUsers.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Affected users: {feature.affectedUsers.length}
                        </p>
                      )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        toggleFeature(feature._id, feature.enabled)
                      }
                      className={`p-2 rounded-lg transition ${
                        feature.enabled
                          ? "bg-green-100 text-green-600 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <Power className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => deleteFeature(feature._id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Create Feature Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create Feature Toggle
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newFeature.name}
                  onChange={(e) =>
                    setNewFeature({ ...newFeature, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Key
                </label>
                <input
                  type="text"
                  value={newFeature.key}
                  onChange={(e) =>
                    setNewFeature({ ...newFeature, key: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newFeature.description}
                  onChange={(e) =>
                    setNewFeature({
                      ...newFeature,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={newFeature.category}
                  onChange={(e) =>
                    setNewFeature({ ...newFeature, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700"
                >
                  <option value="feature">Feature</option>
                  <option value="experiment">Experiment</option>
                  <option value="killswitch">Kill Switch</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={createFeature}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureToggles;
