import React, { useEffect, useState } from "react";
import { getToken } from "../../storage/auth";
import { API_BASE } from "../../config/api";
import {
  Server,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

const SystemHealth = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/system-health`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (err) {
      console.error("Failed to fetch system health:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  const uptimeHours = health?.currentUptime
    ? (health.currentUptime / (1000 * 60 * 60)).toFixed(2)
    : 0;
  const healthStatus =
    health?.errorCount < 5
      ? "healthy"
      : health?.errorCount < 20
        ? "warning"
        : "critical";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            System Health
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time platform diagnostics and performance monitoring
          </p>
        </div>
        <button
          onClick={fetchSystemHealth}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Refresh
        </button>
      </div>

      {/* Overall Status */}
      <div
        className={`mb-6 rounded-lg p-6 ${
          healthStatus === "healthy"
            ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-500"
            : healthStatus === "warning"
              ? "bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500"
              : "bg-red-50 dark:bg-red-900/20 border-2 border-red-500"
        }`}
      >
        <div className="flex items-center gap-4">
          {healthStatus === "healthy" ? (
            <CheckCircle className="h-12 w-12 text-green-600" />
          ) : (
            <AlertCircle
              className={`h-12 w-12 ${healthStatus === "warning" ? "text-yellow-600" : "text-red-600"}`}
            />
          )}
          <div>
            <h3
              className={`text-2xl font-bold ${
                healthStatus === "healthy"
                  ? "text-green-900 dark:text-green-100"
                  : healthStatus === "warning"
                    ? "text-yellow-900 dark:text-yellow-100"
                    : "text-red-900 dark:text-red-100"
              }`}
            >
              System{" "}
              {healthStatus === "healthy"
                ? "Healthy"
                : healthStatus === "warning"
                  ? "Needs Attention"
                  : "Critical"}
            </h3>
            <p
              className={`${
                healthStatus === "healthy"
                  ? "text-green-700 dark:text-green-300"
                  : healthStatus === "warning"
                    ? "text-yellow-700 dark:text-yellow-300"
                    : "text-red-700 dark:text-red-300"
              }`}
            >
              {health?.errorCount || 0} errors in the last 24 hours
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {uptimeHours}h
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Error Count
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {health?.errorCount || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Requests/min
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {health?.requestRate || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      {health?.recentErrors?.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Errors
          </h3>
          <div className="space-y-3">
            {health.recentErrors.slice(0, 10).map((error, idx) => (
              <div
                key={idx}
                className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 p-3 rounded"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {error.message}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {error.endpoint} •{" "}
                      {new Date(error.timestamp).toLocaleString()}
                    </p>
                    {error.stack && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer">
                          Stack Trace
                        </summary>
                        <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 overflow-x-auto">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {health?.performance && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Average Response Time
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {health.performance.avgResponseTime || 0}ms
              </p>
            </div>
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Database Queries
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {health.performance.dbQueries || 0}
              </p>
            </div>
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Memory Usage
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {health.performance.memoryUsage || 0}MB
              </p>
            </div>
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                CPU Usage
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {health.performance.cpuUsage || 0}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealth;
