import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getToken } from "../storage/auth";
import { API_BASE } from "../config/api";
import { formatCurrency } from "../utils/formatters";

const Report = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });
  const [topItems, setTopItems] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      let url = `${API_BASE}/api/transactions/stats/report?period=${period}`;
      if (period === "month" && selectedMonth) {
        url += `&startDate=${selectedMonth}-01`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const reportData = await res.json();
        setData(reportData);
      }

      // Fetch analytics separately
      fetchAnalytics();
    } catch (err) {
      console.error("Failed to fetch report:", err);
    } finally {
      setLoading(false);
    }
  }, [period, selectedMonth]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    const token = getToken();
    if (!token) {
      setAnalyticsLoading(false);
      return;
    }

    try {
      // Determine period in days for analytics
      let periodDays = "all";
      if (period === "month" && selectedMonth) {
        const now = new Date();
        const selected = new Date(selectedMonth);
        periodDays = 30; // Default to 30 days for monthly view
      }

      // Fetch top selling items
      const topRes = await fetch(
        `${API_BASE}/api/transactions/analytics/top-items?limit=10&period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (topRes.ok) {
        const topData = await topRes.json();
        setTopItems(topData.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [period, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [period, selectedMonth, fetchData]);

  const stats = useMemo(() => {
    if (!data) return { sales: 0, expenses: 0, profit: 0, debt: 0 };
    return {
      sales: data.sales || 0,
      expenses: data.expenses || 0,
      profit: data.profit || 0,
      debt: data.debts?.outstandingTotal || 0,
    };
  }, [data]);

  const expenses = useMemo(() => {
    if (!data?.recentTransactions) return [];
    const categories = {};

    data.recentTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const cat = t.notes || t.category || "Other Expenses";
        categories[cat] = (categories[cat] || 0) + (t.amount || 0);
      });

    const total = Object.values(categories).reduce((sum, amt) => sum + amt, 0);
    return Object.entries(categories)
      .map(([cat, amt]) => ({
        category: cat,
        amount: amt,
        percent: total > 0 ? (amt / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [data]);

  const handleDownload = async (type) => {
    const token = getToken();
    if (!token) return;

    try {
      let url = `${API_BASE}/api/transactions/`;
      let filename = "sokotally-report";

      if (type === "csv") {
        url += "export";
        if (selectedMonth && period === "month") {
          url += `?startDate=${selectedMonth}-01`;
        }
        filename += `-${
          selectedMonth || new Date().toISOString().split("T")[0]
        }.csv`;
      } else if (type === "ai") {
        url += "reports/ai?format=pdf&download=1";
        if (selectedMonth && period === "month") {
          url += `&month=${selectedMonth}`;
        }
        filename += `-ai-${
          selectedMonth || new Date().toISOString().split("T")[0]
        }.pdf`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const objUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(objUrl);
      } else {
        alert("Failed to download report");
      }
    } catch (err) {
      console.error("Download error:", err);
      alert("Error downloading report");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white mb-2">
            Business Reports
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
            Clear summaries of your sales and expenses
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Controls */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Period Selector */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Period:
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPeriod("all")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    period === "all"
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setPeriod("month")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    period === "month"
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                  }`}
                >
                  Monthly
                </button>
              </div>
              {period === "month" && (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-md transition"
              >
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
              <button
                onClick={() => handleDownload("csv")}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 text-sm font-medium rounded-md transition"
              >
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                CSV Report
              </button>
              <button
                onClick={() => handleDownload("ai")}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 text-sm font-medium rounded-md transition"
              >
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                AI Report (PDF)
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-900 dark:border-white border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: "Total Sales",
                  value: stats.sales,
                  icon: "↑",
                  color: "text-green-600 dark:text-green-400",
                  bg: "bg-green-50 dark:bg-green-900/20",
                },
                {
                  label: "Total Expenses",
                  value: stats.expenses,
                  icon: "↓",
                  color: "text-red-600 dark:text-red-400",
                  bg: "bg-red-50 dark:bg-red-900/20",
                },
                {
                  label: "Net Profit",
                  value: stats.profit,
                  icon: "■",
                  color: "text-blue-600 dark:text-blue-400",
                  bg: "bg-blue-50 dark:bg-blue-900/20",
                },
                {
                  label: "Outstanding Debts",
                  value: stats.debt,
                  icon: "◆",
                  color: "text-orange-600 dark:text-orange-400",
                  bg: "bg-orange-50 dark:bg-orange-900/20",
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide font-medium">
                      {stat.label}
                    </p>
                    <div
                      className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}
                    >
                      <span className={`text-2xl ${stat.color}`}>
                        {stat.icon}
                      </span>
                    </div>
                  </div>
                  <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                    KSh {stat.value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Charts and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Items */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Top Selling Products
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Best performers by revenue
                  </p>
                </div>
                <div className="p-6">
                  {topItems.length === 0 ? (
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
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        No sales data available
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topItems.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {item.itemName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {item.totalQuantity} units @{" "}
                              {formatCurrency(item.avgPrice || 0)}/unit
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(item.totalRevenue || 0)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Total
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Expense Breakdown */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Expense Breakdown
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Where your money goes
                  </p>
                </div>
                <div className="p-6">
                  {expenses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-12 h-12 text-gray-400"
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
                      <p className="text-gray-500 dark:text-gray-400">
                        No expense data available
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {expenses.map((exp, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {exp.category}
                            </p>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {exp.percent.toFixed(1)}%
                              </span>
                              <span className="font-semibold text-red-600 dark:text-red-400 text-sm">
                                {formatCurrency(exp.amount)}
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-red-500 dark:bg-red-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${exp.percent}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Report;
