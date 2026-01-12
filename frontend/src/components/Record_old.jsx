import React, { useEffect, useState } from "react";
import EditTransactionModal from "./shared/EditTransactionModal";
import { getToken } from "../storage/auth";
import Card from "./shared/Card";
import Badge from "./shared/Badge";
import DataTable from "./shared/DataTable";
import { API_BASE } from "../config/api";
import { formatCurrency } from "../utils/formatters";

const Record = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const [selectedDate, setSelectedDate] = useState(`${year}-${month}-${day}`);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
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
          // Filter by selected date
          const transactionDate = new Date(t.occurredAt || t.createdAt);
          return (
            transactionDate.getDate() === selectedDateObj.getDate() &&
            transactionDate.getMonth() === selectedDateObj.getMonth() &&
            transactionDate.getFullYear() === selectedDateObj.getFullYear()
          );
        });

      // simple categorization
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

  const TransactionList = ({
    items,
    color,
    emptyText,
    showItems = false,
    hideStatus = false,
  }) => (
    <div className="space-y-2">
      {items.length > 0 ? (
        items.map((t) => (
          <div
            key={t.id}
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750 transition"
          >
            <div className="flex items-center justify-between p-3">
              <div className="flex-1">
                {t.customerName ? (
                  <>
                    <p className="text-gray-900 dark:text-white text-lg font-bold">
                      {t.customerName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-gray-600 dark:text-slate-400 text-sm">
                        {t.desc}
                      </p>
                      {t.items && t.items.length > 0 && (
                        <span className="text-gray-500 dark:text-slate-500 text-xs">
                          ({t.items.map((item) => item.name).join(", ")})
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900 dark:text-white text-lg font-bold">
                      {t.desc}
                    </p>
                    {t.items && t.items.length > 0 && (
                      <span className="text-gray-500 dark:text-slate-500 text-xs">
                        ({t.items.map((item) => item.name).join(", ")})
                      </span>
                    )}
                  </div>
                )}
                <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">
                  {t.date}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!hideStatus && t.status && (
                  <Badge
                    variant={t.status === "paid" ? "success" : "warning"}
                    size="small"
                  >
                    {t.status}
                  </Badge>
                )}
                <span className={`font-semibold text-sm ${color}`}>
                  {formatCurrency(t.amount)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(t.id);
                      setModalType(t.type === "income" ? "sale" : t.type);
                      const mappedItems =
                        t.items && t.items.length > 0
                          ? t.items.map((item) => ({
                              name: item.name || "",
                              quantity: item.quantity || 1,
                              unitPrice: item.unitPrice || item.price || 0,
                            }))
                          : [{ name: "", quantity: 1, unitPrice: 0 }];
                      // Format date properly for date input (YYYY-MM-DD)
                      let formattedDate = selectedDate;
                      if (t.occurredAt) {
                        const d = new Date(t.occurredAt);
                        formattedDate = `${d.getFullYear()}-${String(
                          d.getMonth() + 1
                        ).padStart(2, "0")}-${String(d.getDate()).padStart(
                          2,
                          "0"
                        )}`;
                      }
                      setFormData({
                        amount: t.amount,
                        notes: t.desc,
                        customerName: t.customerName || "",
                        items: mappedItems,
                        date: formattedDate,
                        status: t.status || "paid",
                      });
                      setShowModal(true);
                    }}
                    className="p-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                    title="Edit"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(t.id);
                    }}
                    className="p-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                    title="Delete"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-red-600 dark:text-red-400"
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
            {showItems && t.items && t.items.length > 0 && (
              <div className="px-3 pb-3">
                <DataTable
                  compact
                  hoverable={false}
                  columns={[
                    { header: "Item", key: "name" },
                    { header: "Qty", key: "quantity", align: "center" },
                    {
                      header: "Price",
                      key: "unitPrice",
                      align: "right",
                      render: (row) => formatCurrency(row.unitPrice || 0),
                    },
                    {
                      header: "Total",
                      key: "totalPrice",
                      align: "right",
                      render: (row) => (
                        <span className="font-semibold text-emerald-400">
                          {formatCurrency(row.totalPrice || 0)}
                        </span>
                      ),
                    },
                  ]}
                  data={t.items}
                  emptyMessage="No items"
                />
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-center text-slate-500 py-8 text-sm">{emptyText}</p>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Transaction Records
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
            Manage your daily transactions
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={fetchTransactions}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
            title="Refresh transactions"
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
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white text-sm font-medium px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
          >
            Today
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Sales
          </p>
          <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
            KSh {stats.sales.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {categorized.sales.length} transactions
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Expenses
          </p>
          <p className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
            KSh {stats.expenses.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {categorized.expenses.length} transactions
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Profit
          </p>
          <p
            className={`text-2xl md:text-3xl font-bold mb-1 ${
              stats.profit >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-orange-600 dark:text-orange-400"
            }`}
          >
            {stats.profit >= 0 ? "+" : ""}KSh{" "}
            {Math.abs(stats.profit).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Daily performance
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-5">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Debts
          </p>
          <p className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            KSh {stats.debts.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {categorized.debts.length} records
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => openModal("sale")}
          className="p-4 bg-green-600 hover:bg-green-700 text-white font-semibold transition"
        >
          Add Sale
        </button>
        <button
          onClick={() => openModal("expense")}
          className="p-4 bg-red-600 hover:bg-red-700 text-white font-semibold transition"
        >
          Add Expense
        </button>
        <button
          onClick={() => openModal("debt")}
          className="p-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold transition"
        >
          Add Debt
        </button>
        <button
          onClick={() => openModal("loan")}
          className="p-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold transition"
        >
          Add Loan
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-slate-700">
        {["all", "sales", "expenses", "debts", "loans"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-semibold capitalize transition ${
              activeTab === tab
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Transaction Sections */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {(activeTab === "all" || activeTab === "sales") && (
            <Card variant="glass" title="Sales" icon="">
              <TransactionList
                items={categorized.sales}
                color="text-emerald-400"
                emptyText="No sales recorded"
                showItems={true}
                hideStatus={true}
              />
            </Card>
          )}

          {(activeTab === "all" || activeTab === "expenses") && (
            <Card variant="glass" title="Expenses" icon="">
              <TransactionList
                items={categorized.expenses}
                color="text-red-400"
                emptyText="No expenses recorded"
                showItems={true}
                hideStatus={true}
              />
            </Card>
          )}

          {(activeTab === "all" || activeTab === "debts") && (
            <Card variant="glass" title="Debts" icon="">
              <TransactionList
                items={categorized.debts}
                color="text-purple-400"
                emptyText="No debts recorded"
                showItems={true}
              />
            </Card>
          )}

          {(activeTab === "all" || activeTab === "loans") && (
            <Card variant="glass" title="Loans" icon="">
              <TransactionList
                items={categorized.loans}
                color="text-amber-400"
                emptyText="No loans recorded"
                showItems={true}
              />
            </Card>
          )}
        </div>
      )}

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
