import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getToken } from "../../storage/auth";
import { API_BASE } from "../../config/api";
import {
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  Bot,
  Shield,
} from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          System Performance Overview
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor platform health, user activity, and system diagnostics
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Users className="h-6 w-6" />}
          title="Total Users"
          value={stats?.overview?.totalUsers || "0"}
          subtitle={`${stats?.overview?.activePercentage || 0}% active`}
          color="blue"
        />
        <StatCard
          icon={<Activity className="h-6 w-6" />}
          title="Active Users"
          value={stats?.overview?.activeUsers || "0"}
          subtitle="Last 24 hours"
          color="green"
        />
        <StatCard
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Critical Issues"
          value={stats?.systemHealth?.criticalIssues || 0}
          subtitle={`${stats?.systemHealth?.fraudFlags || 0} fraud flags`}
          color={stats?.systemHealth?.criticalIssues > 0 ? "red" : "green"}
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          title="Growth (7d)"
          value={stats?.growth?.last7Days || 0}
          subtitle={`Trend: ${stats?.growth?.trend || "stable"}`}
          color="purple"
        />
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NavCard
          to="/admin/users"
          icon={<Users className="h-8 w-8" />}
          title="User Management"
          description="Manage users, roles & permissions"
          color="blue"
        />
        <NavCard
          to="/admin/fraud"
          icon={<Shield className="h-8 w-8" />}
          title="Fraud Detection"
          description="Security alerts & suspicious activity"
          color="blue"
        />
        <NavCard
          to="/admin/analytics"
          icon={<TrendingUp className="h-8 w-8" />}
          title="Usage Analytics"
          description="User engagement & retention metrics"
          color="blue"
        />
        <NavCard
          to="/admin/health"
          icon={<Activity className="h-8 w-8" />}
          title="System Health"
          description="API uptime & performance metrics"
          color="blue"
        />
        <NavCard
          to="/admin/ai"
          icon={<Bot className="h-8 w-8" />}
          title="AI Monitoring"
          description="AI usage & token consumption"
          color="blue"
        />
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, subtitle, color }) => {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    green:
      "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
    red: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400",
    purple:
      "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
  };

  return (
    <div className="bg-white dark:bg-[#0f172a]/70 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/5 hover:border-blue-400/40 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
      <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
        {title}
      </h3>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </p>
      <p className="text-gray-500 dark:text-gray-400 text-sm">{subtitle}</p>
    </div>
  );
};

const NavCard = ({ to, icon, title, description, color }) => {
  return (
    <Link
      to={to}
      className="block bg-white dark:bg-[#0f172a]/70 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/5 hover:border-blue-400/40 hover:shadow-2xl hover:shadow-blue-500/15 transition-all duration-300 p-6 group"
    >
      <div className="w-16 h-16 bg-blue-500 flex items-center justify-center text-white rounded-lg mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/20">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </Link>
  );
};

export default AdminDashboard;
