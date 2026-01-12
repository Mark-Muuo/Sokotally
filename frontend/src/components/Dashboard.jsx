import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getToken } from "../storage/auth";
import { API_BASE } from "../config/api";

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE}/api/transactions/stats/dashboard`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const dashboardData = await res.json();
          setData(dashboardData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = {
    sales: data?.sales || 0,
    expenses: data?.expenses || 0,
    profit: data?.profit || 0,
    debt: data?.debts?.outstandingTotal || 0,
  };

  const recent = data?.recentTransactions?.slice(0, 8) || [];
  const topItems = data?.topItems?.slice(0, 5) || [];

  const now = new Date();
  const currentDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 dark:from-slate-950 dark:via-purple-950/30 dark:to-slate-950">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 text-white px-6 py-16 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_3s_linear_infinite]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-6xl font-black mb-4 drop-shadow-2xl animate-[fadeIn_0.5s_ease-out]">
            Welcome back, {user?.name || "User"}! 👋
          </h1>
          <p className="text-purple-100 text-base md:text-xl font-semibold drop-shadow-lg">
            {currentDate}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                {
                  label: "Total Sales",
                  value: stats.sales,
                  color: "from-green-500 to-emerald-600",
                  icon: (
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  ),
                },
                {
                  label: "Total Expenses",
                  value: stats.expenses,
                  color: "from-red-500 to-pink-600",
                  icon: (
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                      />
                    </svg>
                  ),
                },
                {
                  label: "Net Profit",
                  value: stats.profit,
                  color: "from-blue-500 to-indigo-600",
                  icon: (
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ),
                },
                {
                  label: "Outstanding Debts",
                  value: stats.debt,
                  color: "from-orange-500 to-yellow-600",
                  icon: (
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  ),
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/20 dark:border-slate-700/50 hover:-translate-y-2 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div
                    className={`bg-gradient-to-br ${stat.color} p-5 text-white relative`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold opacity-95 uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <div className="transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500">
                        {stat.icon}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 relative">
                    <p className="text-3xl font-black bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                      KSh {stat.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Transactions - Takes 2 columns */}
              <div className="lg:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-white/30 dark:border-slate-700/50">
                <div className="px-6 py-5 border-b border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-purple-50 to-cyan-50 dark:from-purple-900/20 dark:to-cyan-900/20">
                  <h2 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                    Recent Activity
                  </h2>
                  <Link
                    to="/record"
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition flex items-center gap-1"
                  >
                    View All
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
                <div className="p-6">
                  {recent.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">
                        No transactions yet
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Start recording your business activities
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recent.map((t, i) => (
                        <div
                          key={i}
                          className="group flex items-center justify-between p-4 rounded-xl border border-gray-200/50 dark:border-slate-700/50 bg-gradient-to-r from-white to-gray-50/50 dark:from-slate-800 dark:to-slate-750/50 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:-translate-x-1"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  t.type === "income"
                                    ? "bg-green-100 dark:bg-green-900/30"
                                    : "bg-red-100 dark:bg-red-900/30"
                                }`}
                              >
                                {t.type === "income" ? (
                                  <svg
                                    className="w-5 h-5 text-green-600 dark:text-green-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 4v16m8-8H4"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-5 h-5 text-red-600 dark:text-red-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M20 12H4"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white truncate">
                                  {t.items
                                    ?.map((item) => item.name)
                                    .join(", ") ||
                                    t.notes ||
                                    (t.type === "debt" ? "Loan" : t.type)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {new Date(t.occurredAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-lg font-bold ml-4 ${
                              t.type === "income"
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {t.type === "income" ? "+" : "-"}KSh{" "}
                            {t.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Top Selling Items */}
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden border border-white/30 dark:border-slate-700/50">
                <div className="px-6 py-5 border-b border-gray-200/50 dark:border-slate-700/50 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
                  <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                    Top Products
                  </h2>
                </div>
                <div className="p-6">
                  {!topItems || topItems.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-4xl animate-bounce">📦</span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-semibold">
                        No sales data yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topItems.map((item, i) => (
                        <div
                          key={i}
                          className="group flex items-center justify-between p-4 rounded-xl border border-gray-200/50 dark:border-slate-700/50 bg-gradient-to-r from-white to-emerald-50/30 dark:from-slate-800 dark:to-emerald-900/10 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 hover:scale-[1.02]"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {item.quantity} units sold
                            </p>
                          </div>
                          <span className="text-sm font-bold text-green-600 dark:text-green-400 ml-3">
                            KSh {item.revenue?.toLocaleString() || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/30 dark:border-slate-700/50">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: "Record Sale",
                    icon: "💰",
                    path: "/record",
                    color: "from-green-500 to-emerald-600",
                  },
                  {
                    label: "Add Expense",
                    icon: "📝",
                    path: "/record",
                    color: "from-red-500 to-pink-600",
                  },
                  {
                    label: "View Reports",
                    icon: "📊",
                    path: "/report",
                    color: "from-blue-500 to-indigo-600",
                  },
                  {
                    label: "AI Assistant",
                    icon: "🤖",
                    path: "/assistant",
                    color: "from-purple-500 to-violet-600",
                  },
                ].map((action, index) => (
                  <Link
                    key={index}
                    to={action.path}
                    className={`group relative bg-gradient-to-br ${action.color} text-white rounded-2xl p-6 text-center hover:shadow-2xl transform hover:scale-110 hover:-translate-y-2 transition-all duration-300 overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-white/0 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative z-10">
                      <div className="text-4xl mb-3 transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300">
                        {action.icon}
                      </div>
                      <p className="text-sm font-bold tracking-wide">
                        {action.label}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
