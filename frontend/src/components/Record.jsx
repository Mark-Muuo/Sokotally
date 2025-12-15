import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getToken } from '../storage/auth';
import Card from './shared/Card';
import Badge from './shared/Badge';
import DataTable from './shared/DataTable';
import { API_BASE } from '../config/api';
import { formatCurrency } from '../utils/formatters';

const Record = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [activeTab, setActiveTab] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('sale');

  const [formData, setFormData] = useState({
    amount: '',
    notes: '',
    customerName: '',
    items: [{ name: '', quantity: 1, price: 0 }]
  });

  useEffect(() => {
    fetchTransactions();
    // Auto-refresh every 10 seconds to catch new AI transactions
    const interval = setInterval(fetchTransactions, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTransactions = async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/transactions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.map(t => {
          // Ensure consistent date formatting (use UTC to avoid timezone issues)
          const transactionDate = new Date(t.occurredAt);
          const year = transactionDate.getFullYear();
          const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
          const day = String(transactionDate.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;
          
          return {
            id: t._id,
            date: dateString,
            type: t.type === 'income' ? 'sale' : t.type,
            desc: t.notes || t.type,
            amount: t.amount,
            status: t.status,
            items: t.items || [],
            customerName: t.customerName
          };
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const byDate = useMemo(() => {
    return transactions.filter(t => t.date === selectedDate);
  }, [transactions, selectedDate]);

  const categorized = useMemo(() => ({
    sales: byDate.filter(t => t.type === 'sale'),
    expenses: byDate.filter(t => t.type === 'expense'),
    debts: byDate.filter(t => t.type === 'debt'),
    loans: byDate.filter(t => t.type === 'loan')
  }), [byDate]);

  const stats = useMemo(() => {
    const sales = categorized.sales.reduce((sum, t) => sum + t.amount, 0);
    const expenses = categorized.expenses.reduce((sum, t) => sum + t.amount, 0);
    const debts = categorized.debts.reduce((sum, t) => sum + t.amount, 0);
    return { sales, expenses, debts, profit: sales - expenses };
  }, [categorized]);

  const openModal = (type) => {
    setModalType(type);
    setFormData({ amount: '', notes: '', customerName: '', items: [{ name: '', quantity: 1, price: 0 }] });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    const payload = {
      type: modalType === 'sale' ? 'income' : modalType,
      amount: parseFloat(formData.amount),
      notes: formData.notes,
      occurredAt: new Date(selectedDate),
      ...(modalType === 'sale' && { customerName: formData.customerName, items: formData.items })
    };

    try {
      const res = await fetch(`${API_BASE}/api/transactions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        fetchTransactions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    const token = getToken();
    if (!token) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTransactions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const TransactionList = ({ items, color, emptyText, showItems = false, hideStatus = false }) => (
    <div className="space-y-2">
      {items.length > 0 ? items.map((t) => (
        <div key={t.id} className="bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition">
          <div className="flex items-center justify-between p-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-medium">{t.desc}</p>
                {t.items && t.items.length > 0 && (
                  <span className="text-slate-500 text-xs">({t.items.map(item => item.name).join(', ')})</span>
                )}
              </div>
              {t.customerName && <p className="text-slate-500 text-xs">Customer/Debtor: {t.customerName}</p>}
              <p className="text-slate-400 text-xs">{t.date}</p>
            </div>
            <div className="flex items-center gap-2">
              {!hideStatus && t.status && <Badge variant={t.status === 'paid' ? 'success' : 'warning'} size="small">{t.status}</Badge>}
              <span className={`font-semibold text-sm ${color}`}>
                {formatCurrency(t.amount)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setModalType(t.type);
                    setFormData({
                      amount: t.amount,
                      notes: t.desc,
                      customerName: t.customerName || '',
                      items: t.items || [{ name: '', quantity: 1, price: 0 }]
                    });
                    setShowModal(true);
                  }}
                  className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg transition"
                  title="Edit"
                >
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 bg-red-600/20 hover:bg-red-600/40 rounded-lg transition"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
                  { header: 'Item', key: 'name' },
                  { header: 'Qty', key: 'quantity', align: 'center' },
                  { header: 'Price', key: 'unitPrice', align: 'right', render: (row) => formatCurrency(row.unitPrice || 0) },
                  { header: 'Total', key: 'totalPrice', align: 'right', render: (row) => <span className="font-semibold text-emerald-400">{formatCurrency(row.totalPrice || 0)}</span> }
                ]}
                data={t.items}
                emptyMessage="No items"
              />
            </div>
          )}
        </div>
      )) : (
        <p className="text-center text-slate-500 py-8 text-sm">{emptyText}</p>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-800/40 to-slate-900/30 border border-slate-700/50 rounded-2xl shadow-2xl">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent flex items-center gap-3">
            <span className="text-4xl">📋</span>
            Transaction Records
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Manage your daily transactions 💼</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTransactions}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105"
            title="Refresh transactions"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-800/80 border border-slate-600/50 hover:border-slate-500/70 text-white text-sm rounded-xl px-4 py-2.5 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button
            onClick={() => setSelectedDate(() => {
              const today = new Date();
              const year = today.getFullYear();
              const month = String(today.getMonth() + 1).padStart(2, '0');
              const day = String(today.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
          >
            Today
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30 hover:border-emerald-400/50 rounded-2xl p-6 transition-all duration-200 shadow-lg hover:shadow-emerald-500/20 group">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-sm font-medium">Sales</p>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <span className="text-xl">💰</span>
            </div>
          </div>
          <p className="text-emerald-400 text-3xl font-bold mb-1">{formatCurrency(stats.sales)}</p>
          <p className="text-slate-500 text-xs flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {categorized.sales.length} transactions
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 hover:border-red-400/50 rounded-2xl p-6 transition-all duration-200 shadow-lg hover:shadow-red-500/20 group">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-sm font-medium">Expenses</p>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
              <span className="text-xl">💸</span>
            </div>
          </div>
          <p className="text-red-400 text-3xl font-bold mb-1">{formatCurrency(stats.expenses)}</p>
          <p className="text-slate-500 text-xs flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {categorized.expenses.length} transactions
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 hover:border-blue-400/50 rounded-2xl p-6 transition-all duration-200 shadow-lg hover:shadow-blue-500/20 group">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-sm font-medium">Profit</p>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <span className="text-xl">📈</span>
            </div>
          </div>
          <p className={`text-3xl font-bold mb-1 ${stats.profit >= 0 ? 'text-blue-400' : 'text-amber-400'}`}>
            {stats.profit >= 0 ? '+' : ''}{formatCurrency(stats.profit)}
          </p>
          <p className="text-slate-500 text-xs">Daily performance</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 hover:border-purple-400/50 rounded-2xl p-6 transition-all duration-200 shadow-lg hover:shadow-purple-500/20 group">
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-400 text-sm font-medium">Debts</p>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <span className="text-xl">📝</span>
            </div>
          </div>
          <p className="text-purple-400 text-3xl font-bold mb-1">{formatCurrency(stats.debts)}</p>
          <p className="text-slate-500 text-xs flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {categorized.debts.length} records
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button onClick={() => openModal('sale')} className="p-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-2xl text-white font-bold transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 flex items-center justify-center gap-2">
          <span className="text-xl">💰</span>
          <span>Add Sale</span>
        </button>
        <button onClick={() => openModal('expense')} className="p-5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-2xl text-white font-bold transition-all duration-200 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-105 flex items-center justify-center gap-2">
          <span className="text-xl">💸</span>
          <span>Add Expense</span>
        </button>
        <button onClick={() => openModal('debt')} className="p-5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-2xl text-white font-bold transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105 flex items-center justify-center gap-2">
          <span className="text-xl">📝</span>
          <span>Add Debt</span>
        </button>
        <button onClick={() => openModal('loan')} className="p-5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 rounded-2xl text-white font-bold transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105 flex items-center justify-center gap-2">
          <span className="text-xl">💵</span>
          <span>Add Loan</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        {['all', 'sales', 'expenses', 'debts', 'loans'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition ${
              activeTab === tab
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Transaction Sections */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {(activeTab === 'all' || activeTab === 'sales') && (
            <Card variant="glass" title="💰 Sales" icon="💰">
              <TransactionList items={categorized.sales} color="text-emerald-400" emptyText="No sales recorded" showItems={true} hideStatus={true} />
            </Card>
          )}
          
          {(activeTab === 'all' || activeTab === 'expenses') && (
            <Card variant="glass" title="💸 Expenses" icon="💸">
              <TransactionList items={categorized.expenses} color="text-red-400" emptyText="No expenses recorded" showItems={true} hideStatus={true} />
            </Card>
          )}
          
          {(activeTab === 'all' || activeTab === 'debts') && (
            <Card variant="glass" title="💳 Debts" icon="💳">
              <TransactionList items={categorized.debts} color="text-purple-400" emptyText="No debts recorded" showItems={true} />
            </Card>
          )}
          
          {(activeTab === 'all' || activeTab === 'loans') && (
            <Card variant="glass" title="💰 Loans" icon="💰">
              <TransactionList items={categorized.loans} color="text-amber-400" emptyText="No loans recorded" showItems={true} />
            </Card>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4 capitalize">Add {modalType}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm block mb-2">Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 text-sm block mb-2">Description</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white"
                  rows="3"
                />
              </div>
              {modalType === 'sale' && (
                <div>
                  <label className="text-slate-400 text-sm block mb-2">Customer Name</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white"
                  />
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold transition">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Record;
