import React, { useEffect, useState } from "react";
import EditTransactionModal from "./shared/EditTransactionModal";
import { getToken } from "../storage/auth";
import { API_BASE } from "../config/api";
import { formatCurrency } from "../utils/formatters";

const Record = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const [selectedDate, setSelectedDate] = useState(`${year}-${month}-${day}`);

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalType, setModalType] = useState("sale");
  const [formData, setFormData] = useState({
    amount: "",
    notes: "",
    customerName: "",
    items: [{ name: "", quantity: 1, unitPrice: 0 }],
    date: `${year}-${month}-${day}`,
    status: "paid",
  });

  const [stats, setStats] = useState({
    sales: 0,
    expenses: 0,
    profit: 0,
    debts: 0,
  });
  const [categorized, setCategorized] = useState({
    sales: [],
    expenses: [],
    debts: [],
    loans: [],
  });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/api/transactions`, { headers });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();

      // Filter transactions by selected date
      const selectedDateObj = new Date(selectedDate);
      const normalizedData = (data || [])
        .map((t) => ({
          ...t,
          id: t._id || t.id,
          desc: t.notes || t.desc || "No description",
          date: t.occurredAt
            ? new Date(t.occurredAt).toLocaleDateString()
            : new Date().toLocaleDateString(),
          items: t.items || [],
        }))
        .filter((t) => {
          const transactionDate = new Date(t.occurredAt || t.createdAt);
          return (
            transactionDate.getDate() === selectedDateObj.getDate() &&
            transactionDate.getMonth() === selectedDateObj.getMonth() &&
            transactionDate.getFullYear() === selectedDateObj.getFullYear()
          );
        });

      const sales = normalizedData.filter(
        (t) => t.type === "sale" || t.type === "income"
      );
      const expenses = normalizedData.filter((t) => t.type === "expense");
      const debts = normalizedData.filter((t) => t.type === "debt");
      const loans = normalizedData.filter((t) => t.type === "loan");
      setCategorized({ sales, expenses, debts, loans });
      const salesSum = sales.reduce((s, x) => s + (x.amount || 0), 0);
      const expensesSum = expenses.reduce((s, x) => s + (x.amount || 0), 0);
      const debtsSum = debts.reduce((s, x) => s + (x.amount || 0), 0);
      setStats({
        sales: salesSum,
        expenses: expensesSum,
        profit: salesSum - expensesSum,
        debts: debtsSum,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedDate]);

  const openModal = (type = "sale") => {
    setModalType(type);
    setEditingId(null);
    setFormData({
      amount: "",
      notes: "",
      customerName: "",
      items: [{ name: "", quantity: 1, unitPrice: 0 }],
      date: selectedDate,
      status: "paid",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    const payload = {
      type: modalType === "sale" ? "income" : modalType,
      amount: parseFloat(formData.amount),
      notes: formData.notes,
      occurredAt: new Date(formData.date || selectedDate),
      customerName: formData.customerName || "",
      status: formData.status,
      ...((modalType === "sale" || modalType === "debt") && {
        items: formData.items,
      }),
    };

    try {
      const url = editingId
        ? `${API_BASE}/api/transactions/${editingId}`
        : `${API_BASE}/api/transactions`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({
          amount: "",
          notes: "",
          customerName: "",
          items: [{ name: "", quantity: 1, price: 0 }],
          date: selectedDate,
          status: "paid",
        });
        fetchTransactions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchTransactions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const TransactionCard = ({ t, type }) => (
    <div className="group relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/30 dark:border-slate-700/50 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                type === "sales"
                  ? "bg-gradient-to-br from-emerald-400 to-green-600"
                  : type === "expenses"
                  ? "bg-gradient-to-br from-red-400 to-pink-600"
                  : type === "debts"
                  ? "bg-gradient-to-br from-purple-400 to-violet-600"
                  : "bg-gradient-to-br from-orange-400 to-amber-600"
              } shadow-lg transform group-hover:scale-110 transition-transform duration-300`}
            >
              <span className="text-2xl">
                {type === "sales"
                  ? "💰"
                  : type === "expenses"
                  ? "💸"
                  : type === "debts"
                  ? "💳"
                  : "🏦"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg text-gray-900 dark:text-white truncate">
                {t.customerName && (
                  <span className="text-purple-600 dark:text-purple-400">
                    {t.customerName} •{" "}
                  </span>
                )}
                {t.items?.map((item) => item.name).join(", ") || t.desc}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                {t.date}{" "}
                {t.status && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                      t.status === "paid"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                    }`}
                  >
                    {t.status}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`text-2xl font-black ${
              type === "sales"
                ? "text-emerald-600 dark:text-emerald-400"
                : type === "expenses"
                ? "text-red-600 dark:text-red-400"
                : type === "debts"
                ? "text-purple-600 dark:text-purple-400"
                : "text-orange-600 dark:text-orange-400"
            }`}
          >
            {formatCurrency(t.amount)}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setEditingId(t.id);
                setModalType(t.type === "income" ? "sale" : t.type);
                setFormData({
                  amount: t.amount,
                  notes: t.desc,
                  customerName: t.customerName || "",
                  items:
                    t.items && t.items.length > 0
                      ? t.items.map((item) => ({
                          name: item.name || "",
                          quantity: item.quantity || 1,
                          unitPrice: item.unitPrice || item.price || 0,
                        }))
                      : [{ name: "", quantity: 1, unitPrice: 0 }],
                  date: t.occurredAt
                    ? new Date(t.occurredAt).toISOString().split("T")[0]
                    : selectedDate,
                  status: t.status || "paid",
                });
                setShowModal(true);
              }}
              className="p-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition-all transform hover:scale-110"
            >
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(t.id)}
              className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-all transform hover:scale-110"
            >
              <svg
                className="w-4 h-4 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-cyan-50 to-blue-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 text-white px-6 py-10 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
            Daily Transactions 📝
          </h1>
          <p className="text-emerald-100 text-sm md:text-base">
            Track your sales and expenses for{" "}
            {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Date Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/30 dark:border-slate-700/50">
          <button
            onClick={fetchTransactions}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg
              className="w-5 h-5"
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
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 min-w-[200px] bg-white dark:bg-slate-800 border-2 border-purple-200 dark:border-purple-700 text-gray-900 dark:text-white text-sm font-semibold px-4 py-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-600 transition-all"
          />
          <button
            onClick={() =>
              setSelectedDate(() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, "0");
                const day = String(today.getDate()).padStart(2, "0");
                return `${year}-${month}-${day}`;
              })
            }
            className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            📅 Today
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Sales",
              value: stats.sales,
              gradient: "from-emerald-500 to-green-600",
              icon: "💰",
            },
            {
              label: "Expenses",
              value: stats.expenses,
              gradient: "from-red-500 to-pink-600",
              icon: "💸",
            },
            {
              label: "Profit",
              value: stats.profit,
              gradient: "from-blue-500 to-indigo-600",
              icon: "📈",
            },
            {
              label: "Debts",
              value: stats.debts,
              gradient: "from-purple-500 to-violet-600",
              icon: "💳",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`bg-gradient-to-br ${stat.gradient} p-4 text-white`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-90">
                    {stat.label}
                  </p>
                  <span className="text-2xl transform group-hover:scale-125 transition-transform duration-300">
                    {stat.icon}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <p className="text-2xl font-black bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  KSh {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Add Sale",
              icon: "💰",
              type: "sale",
              gradient: "from-emerald-500 to-green-600",
            },
            {
              label: "Add Expense",
              icon: "💸",
              type: "expense",
              gradient: "from-red-500 to-pink-600",
            },
            {
              label: "Add Debt",
              icon: "💳",
              type: "debt",
              gradient: "from-purple-500 to-violet-600",
            },
            {
              label: "Add Loan",
              icon: "🏦",
              type: "loan",
              gradient: "from-orange-500 to-amber-600",
            },
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => openModal(action.type)}
              className={`group relative bg-gradient-to-br ${action.gradient} text-white rounded-2xl p-5 text-center shadow-lg hover:shadow-2xl transform hover:scale-110 transition-all duration-300 overflow-hidden`}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
              <div className="relative z-10">
                <div className="text-3xl mb-2 transform group-hover:scale-125 transition-transform duration-300">
                  {action.icon}
                </div>
                <p className="text-sm font-bold">{action.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Transactions */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Sales
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {categorized.sales.length} transactions
                  </p>
                </div>
              </div>
              {categorized.sales.length === 0 ? (
                <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/20">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">💰</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No sales for this day
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categorized.sales.map((t) => (
                    <TransactionCard key={t.id} t={t} type="sales" />
                  ))}
                </div>
              )}
            </div>

            {/* Expenses */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">💸</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Expenses
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {categorized.expenses.length} transactions
                  </p>
                </div>
              </div>
              {categorized.expenses.length === 0 ? (
                <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/20">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">💸</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No expenses for this day
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categorized.expenses.map((t) => (
                    <TransactionCard key={t.id} t={t} type="expenses" />
                  ))}
                </div>
              )}
            </div>

            {/* Debts */}
            {categorized.debts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Debts
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {categorized.debts.length} transactions
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {categorized.debts.map((t) => (
                    <TransactionCard key={t.id} t={t} type="debts" />
                  ))}
                </div>
              </div>
            )}

            {/* Loans */}
            {categorized.loans.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🏦</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Loans
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {categorized.loans.length} transactions
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {categorized.loans.map((t) => (
                    <TransactionCard key={t.id} t={t} type="loans" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <EditTransactionModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingId(null);
        }}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        modalType={modalType}
        setModalType={setModalType}
        editingId={editingId}
      />
    </div>
  );
};

export default Record;
