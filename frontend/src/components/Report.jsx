import React, { useState, useEffect, useMemo } from 'react';
import { getToken } from '../storage/auth';
import StatsCard from './shared/StatsCard';
import Card from './shared/Card';
import ProgressBar from './shared/ProgressBar';
import Badge from './shared/Badge';
import DataTable from './shared/DataTable';
import { API_BASE } from '../config/api';
import { formatCurrency } from '../utils/formatters';

const Report = () => {
  const [data, setData] = useState(null);

  const fetchData = () => {
    const token = getToken();
    if (!token) return;
    
    fetch(`${API_BASE}/api/transactions/stats/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(d => setData(d))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds to catch new transactions
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [API_BASE]);

  const stats = useMemo(() => {
    if (!data) return { sales: 0, expenses: 0, profit: 0, debt: 0 };
    return {
      sales: data.sales || 0,
      expenses: data.expenses || 0,
      profit: data.profit || 0,
      debt: data.debts?.outstandingTotal || 0,
      debtCount: data.debts?.outstandingCount || 0,
      dueSoon: data.debts?.dueSoonTotal || 0
    };
  }, [data]);

  const expenses = useMemo(() => {
    if (!data?.recentTransactions) return [];
    const txs = data.recentTransactions.filter(t => t.type === 'expense');
    const categories = {};
    
    txs.forEach(t => {
      const cat = t.notes || t.category || 'Other Expenses';
      categories[cat] = (categories[cat] || 0) + (t.amount || 0);
    });
    
    const total = Object.values(categories).reduce((sum, amt) => sum + amt, 0);
    return Object.entries(categories)
      .map(([cat, amt]) => ({ category: cat, amount: amt, percent: total > 0 ? (amt / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [data]);

  const topItems = useMemo(() => {
    if (!data?.recentTransactions) return [];
    const items = {};
    
    data.recentTransactions
      .filter(t => t.type === 'income' && t.items && t.items.length > 0)
      .forEach(t => {
        t.items.forEach(item => {
          const itemName = item.name;
          const itemTotal = item.totalPrice || (item.unitPrice * item.quantity) || 0;
          items[itemName] = (items[itemName] || 0) + itemTotal;
        });
      });
    
    return Object.entries(items)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [data]);

  const debts = useMemo(() => {
    if (!data?.recentTransactions) return [];
    return data.recentTransactions
      .filter(t => t.type === 'debt' && t.status !== 'paid')
      .map(t => ({
        lender: t.lender || t.customerName || 'Unknown',
        amount: t.amount,
        date: new Date(t.occurredAt).toLocaleDateString(),
        status: t.status || 'unpaid'
      }))
      .slice(0, 5);
  }, [data]);

  const recentTxs = useMemo(() => {
    if (!data?.recentTransactions) return [];
    return data.recentTransactions.slice(0, 10).map(t => {
      let description = t.notes || t.type;
      
      // If transaction has items, show item names
      if (t.items && t.items.length > 0) {
        description = t.items.map(item => item.name).join(', ');
      }
      
      return {
        date: new Date(t.occurredAt).toLocaleDateString(),
        type: t.type,
        description: description,
        amount: t.amount
      };
    });
  }, [data]);

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen">
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-800/40 to-slate-900/30 border border-slate-700/50 rounded-2xl shadow-2xl">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent flex items-center gap-3">
            <span className="text-4xl">📊</span>
            Business Reports
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Comprehensive analytics and insights 📈</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
          <button className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Sales" value={formatCurrency(stats.sales)} color="emerald" gradient icon="💰" />
        <StatsCard label="Total Expenses" value={formatCurrency(stats.expenses)} color="red" gradient icon="💸" />
        <StatsCard label="Net Profit" value={formatCurrency(stats.profit)} color={stats.profit >= 0 ? 'blue' : 'amber'} gradient icon="📈" />
        <StatsCard label="Outstanding Debt" value={formatCurrency(stats.debt)} color="purple" gradient icon="💳" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Debts Summary */}
        <Card variant="glass" title="Debts & Loans" icon="💳">
          {debts.length > 0 ? (
            <div className="space-y-3">
              {debts.map((debt, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <span className="text-lg">💳</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{debt.lender}</p>
                      <p className="text-slate-400 text-xs">{debt.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-400 font-semibold text-sm">{formatCurrency(debt.amount)}</p>
                    <Badge variant={debt.status === 'unpaid' ? 'danger' : 'warning'} size="small">{debt.status}</Badge>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Total Outstanding</span>
                  <span className="text-white font-bold text-lg">{formatCurrency(stats.debt)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No outstanding debts</p>
            </div>
          )}
        </Card>

        {/* Top Selling Items */}
        <Card variant="glass" title="Top Selling Items" icon="🏆">
          {topItems.length > 0 ? (
            <div className="space-y-3">
              {topItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-emerald-400">#{i + 1}</span>
                    </div>
                    <span className="text-white text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-emerald-400 font-semibold text-sm">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No sales data available</p>
            </div>
          )}
        </Card>
      </div>

      {/* Expenses Breakdown */}
      <Card variant="glass" title="Expenses Breakdown" icon="📊">
        {expenses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {expenses.map((exp, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">{exp.category}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="danger" size="small">{exp.percent.toFixed(1)}%</Badge>
                    <span className="text-white font-semibold text-sm">{formatCurrency(exp.amount)}</span>
                  </div>
                </div>
                <ProgressBar value={exp.percent} max={100} color="red" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">No expenses recorded</p>
          </div>
        )}
      </Card>

      {/* Recent Transactions Table */}
      <Card variant="glass" title="Recent Transactions" icon="📋">
        {recentTxs.length > 0 ? (
          <DataTable
            columns={[
              { header: 'Date', key: 'date' },
              { 
                header: 'Type', 
                key: 'type',
                render: (row) => (
                  <Badge 
                    variant={row.type === 'income' ? 'success' : row.type === 'expense' ? 'danger' : 'warning'}
                    size="small"
                  >
                    {row.type}
                  </Badge>
                )
              },
              { header: 'Description', key: 'description' },
              { 
                header: 'Amount', 
                key: 'amount',
                align: 'right',
                render: (row) => (
                  <span className={`font-semibold ${row.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {row.type === 'income' ? '+' : '-'}{formatCurrency(row.amount)}
                  </span>
                )
              }
            ]}
            data={recentTxs}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">No transactions found</p>
          </div>
        )}
      </Card>

      {/* Insights */}
      <Card variant="glass" title="Business Insights">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3">
              <span className="text-xl">💰</span>
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Revenue</h4>
            <p className="text-xs text-slate-400">
              {stats.sales > 0 ? `You've generated ${formatCurrency(stats.sales)} in sales` : 'Start recording sales to see insights'}
            </p>
          </div>
          <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
              <span className="text-xl">📊</span>
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Profit Margin</h4>
            <p className="text-xs text-slate-400">
              {stats.sales > 0 
                ? `${((stats.profit / stats.sales) * 100).toFixed(1)}% profit margin` 
                : 'Track sales and expenses to calculate'}
            </p>
          </div>
          <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
              <span className="text-xl">💳</span>
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">Debt Status</h4>
            <p className="text-xs text-slate-400">
              {stats.debt > 0 
                ? `${formatCurrency(stats.debt)} in outstanding debt` 
                : 'No outstanding debts'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Report;
