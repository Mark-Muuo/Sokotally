import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getToken } from "../storage/auth";
import { API_BASE } from "../config/api";
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  Users,
  Server,
  Cpu,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [fraudFlags, setFraudFlags] = useState(null);
  const [growthData, setGrowthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("24h");

  const fetchAdminData = async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      // Fetch all admin data in parallel
      const [statsRes, healthRes, fraudRes, growthRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/admin/system-health?timeRange=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/admin/fraud-flags`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/admin/analytics/growth?period=week`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      } else if (statsRes.status === 403) {
        setError("Access denied. Admin privileges required.");
        return;
      }

      if (healthRes.ok) {
        const data = await healthRes.json();
        setSystemHealth(data);
      }

      if (fraudRes.ok) {
        const data = await fraudRes.json();
        setFraudFlags(data);
      }

      if (growthRes.ok) {
        const data = await growthRes.json();
        setGrowthData(data);
      }
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
      setError("Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAdminData();
  }, [timeRange]);
  const resolveIssue = async (issueId, notes = "") => {
    const token = getToken();
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/issues/${issueId}/resolve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes }),
        },
      );

      if (res.ok) {
        fetchAdminData(); // Refresh data
      }
    } catch (err) {
      console.error("Failed to resolve issue:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (!user?.role || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-gray-600 text-lg">Access Denied</p>
          <p className="text-gray-500 mt-2">Admin privileges required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Server className="h-8 w-8" />
            Platform Control Center
          </h1>
          <p className="text-gray-600 mt-2">
            System diagnostics and application health monitoring
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="h-6 w-6" />}
            title="Total Users"
            value={stats?.overview?.totalUsers || "0"}
            subtitle={`${stats?.overview?.activePercentage || 0}% active`}
            trend="neutral"
            color="blue"
          />
          <StatCard
            icon={<Activity className="h-6 w-6" />}
            title="Active Users"
            value={stats?.overview?.activeUsers || "0"}
            subtitle="Last 24 hours"
            trend="up"
            color="green"
          />
          <StatCard
            icon={<AlertTriangle className="h-6 w-6" />}
            title="Critical Issues"
            value={stats?.systemHealth?.criticalIssues || 0}
            subtitle={`${stats?.systemHealth?.fraudFlags || 0} fraud flags`}
            trend={stats?.systemHealth?.criticalIssues > 0 ? "down" : "neutral"}
            color={stats?.systemHealth?.criticalIssues > 0 ? "red" : "green"}
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Growth (7d)"
            value={stats?.growth?.last7Days || 0}
            subtitle={`Trend: ${stats?.growth?.trend || "stable"}`}
            trend={stats?.growth?.trend}
            color="purple"
          />
        </div>

        {/* System Health Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Uptime & Performance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Health
              </h2>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">API Uptime</span>
                <span
                  className={`font-semibold ${
                    systemHealth?.uptime?.percentage >= 99
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  {systemHealth?.uptime?.percentage || 100}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg Response Time</span>
                <span className="font-semibold text-gray-900">
                  {systemHealth?.performance?.avgResponseTime || 0}ms
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Memory Usage</span>
                <span className="font-semibold text-gray-900">
                  {systemHealth?.performance?.currentMemoryUsageMB || 0} MB
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">CPU Load</span>
                <span className="font-semibold text-gray-900">
                  {systemHealth?.performance?.cpuLoad || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Errors</span>
                <span
                  className={`font-semibold ${
                    systemHealth?.errors?.total > 10
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}
                >
                  {systemHealth?.errors?.total || 0}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  systemHealth?.uptime?.status === "excellent"
                    ? "bg-green-100 text-green-800"
                    : systemHealth?.uptime?.status === "good"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {systemHealth?.uptime?.status === "excellent" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {systemHealth?.uptime?.status || "Unknown"}
              </div>
            </div>
          </div>

          {/* Errors Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Errors
            </h2>

            {systemHealth?.errors?.recent?.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {systemHealth.errors.recent.map((error, idx) => (
                  <div
                    key={idx}
                    className="border-l-4 border-red-500 pl-4 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 capitalize">
                        {error.type}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          error.severity === "critical"
                            ? "bg-red-100 text-red-800"
                            : error.severity === "high"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {error.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {error.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(error.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p>No errors in selected time range</p>
              </div>
            )}
          </div>
        </div>

        {/* Fraud Flags */}
        {fraudFlags && fraudFlags.totalUnresolved > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Fraud Detection Flags
              <span className="ml-2 bg-red-100 text-red-800 text-sm px-2 py-1 rounded-full">
                {fraudFlags.totalUnresolved}
              </span>
            </h2>

            <div className="space-y-3">
              {fraudFlags.activeFlags.slice(0, 5).map((flag) => (
                <div
                  key={flag._id}
                  className="border border-red-200 rounded-lg p-4 bg-red-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 capitalize">
                      {flag.suspiciousActivityType.replace("_", " ")}
                    </span>
                    <button
                      onClick={() =>
                        resolveIssue(flag._id, "Investigated and resolved")
                      }
                      className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Resolve
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Flagged IPs: {flag.flaggedIpAddresses?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(flag.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Growth Analytics */}
        {growthData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              User Growth Analytics
            </h2>

            <div className="space-y-2">
              {growthData.data?.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-gray-100"
                >
                  <span className="text-gray-600">{point.date}</span>
                  <span className="font-medium text-gray-900">
                    +{point.newUsers} users
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, subtitle, trend, color }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
    yellow: "bg-yellow-100 text-yellow-600",
  };

  const trendIcons = {
    up: <TrendingUp className="h-4 w-4 text-green-600" />,
    down: <AlertTriangle className="h-4 w-4 text-red-600" />,
    neutral: <Activity className="h-4 w-4 text-gray-600" />,
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        {trendIcons[trend]}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-gray-500 text-sm">{subtitle}</p>
    </div>
  );
};

export default AdminDashboard;
