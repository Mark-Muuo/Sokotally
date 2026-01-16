import React, { useState, useEffect, useMemo } from 'react';
import { getToken } from '../storage/auth';
import { API_BASE } from '../config/api';
import { formatCurrency } from '../utils/formatters';

const Report = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchData = async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      let url = `${API_BASE}/api/transactions/stats/report?period=${period}`;
      if (period === 'month' && selectedMonth) {
        url += `&startDate=${selectedMonth}-01`;
      }
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const reportData = await res.json();
        setData(reportData);
      }
    } catch (err) {
      console.error('Failed to fetch report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, selectedMonth]);

  const stats = useMemo(() => {
    if (!data) return { sales: 0, expenses: 0, profit: 0, debt: 0 };
    return {
      sales: data.sales || 0,
      expenses: data.expenses || 0,
      profit: data.profit || 0,
      debt: data.debts?.outstandingTotal || 0,
    };
  }, [data]);

  const topItems = useMemo(() => {
    if (!data?.recentTransactions) return [];
    const items = {};
    
    data.recentTransactions
      .filter(t => t.type === 'income' && t.items && t.items.length > 0)
      .forEach(t => {
        t.items.forEach(item => {
          const itemName = (item.name || '').toLowerCase().trim();
          if (!itemName) return;
          
          const itemTotal = item.totalPrice || (item.unitPrice * item.quantity) || 0;
          
          if (!items[itemName]) {
            items[itemName] = { name: item.name, total: 0, quantity: 0 };
          }
          items[itemName].total += itemTotal;
          items[itemName].quantity += item.quantity || 0;
        });
      });
    
    return Object.values(items)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [data]);

  const expenses = useMemo(() => {
    if (!data?.recentTransactions) return [];
    const categories = {};
    
    data.recentTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.notes || t.category || 'Other Expenses';
        categories[cat] = (categories[cat] || 0) + (t.amount || 0);
      });
    
    const total = Object.values(categories).reduce((sum, amt) => sum + amt, 0);
    return Object.entries(categories)
      .map(([cat, amt]) => ({ 
        category: cat, 
        amount: amt, 
        percent: total > 0 ? (amt / total) * 100 : 0 
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [data]);

  const handleDownload = async (type) => {
    const token = getToken();
    if (!token) return;
    
    try {
      let url = `${API_BASE}/api/transactions/`;
      let filename = 'sokotally-report';
      
      if (type === 'csv') {
        url += 'export';
        if (selectedMonth && period === 'month') {
          url += `?startDate=${selectedMonth}-01`;
        }
        filename += `-${selectedMonth || new Date().toISOString().split('T')[0]}.csv`;
      } else if (type === 'ai') {
        url += 'reports/ai?format=pdf&download=1';
        if (selectedMonth && period === 'month') {
          url += `&month=${selectedMonth}`;
        }
        filename += `-ai-${selectedMonth || new Date().toISOString().split('T')[0]}.pdf`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const objUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(objUrl);
      } else {
        alert('Failed to download report');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Error downloading report');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-6 py-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Business Reports</h1>
          <p className="text-purple-100 text-sm md:text-base">Comprehensive analytics and insights</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Controls */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Period Selector */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Period:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPeriod('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    period === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setPeriod('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    period === 'month'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Monthly
                </button>
              </div>
              {period === 'month' && (
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
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button 
                onClick={() => handleDownload('csv')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                CSV Report
              </button>
              <button 
                onClick={() => handleDownload('ai')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                AI Report (PDF)
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  label: 'Total Sales', 
                  value: stats.sales, 
                  change: '+12.5%',
                  color: 'from-green-500 to-emerald-600',
                  icon: '💰'
                },
                { 
                  label: 'Total Expenses', 
                  value: stats.expenses, 
                  change: '-5.2%',
                  color: 'from-red-500 to-pink-600',
                  icon: '💸'
                },
                { 
                  label: 'Net Profit', 
                  value: stats.profit, 
                  change: stats.profit >= 0 ? '+' : '-',
                  color: 'from-blue-500 to-indigo-600',
                  icon: '📈'
                },
                { 
                  label: 'Outstanding Debts', 
                  value: stats.debt, 
                  change: '',
                  color: 'from-orange-500 to-yellow-600',
                  icon: '💳'
                }
              ].map((stat, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <div className={`bg-gradient-to-r ${stat.color} p-6 text-white`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold opacity-90 uppercase tracking-wide">{stat.label}</p>
                      <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{stat.icon}</span>
                    </div>
                    <p className="text-3xl font-bold">
                      KSh {stat.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Items */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top Selling Products</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Best performers by revenue</p>
                </div>
                <div className="p-6">
                  {topItems.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">📦</span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">No sales data available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            #{i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.quantity} units sold</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(item.total)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Expense Breakdown */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-red-50 to-pink-50 dark:from-slate-700 dark:to-slate-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Expense Breakdown</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Where your money goes</p>
                </div>
                <div className="p-6">
                  {expenses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">📝</span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">No expense data available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {expenses.map((exp, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{exp.category}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{exp.percent.toFixed(1)}%</span>
                              <span className="font-bold text-red-600 dark:text-red-400 text-sm">{formatCurrency(exp.amount)}</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-red-500 to-pink-600 h-full rounded-full transition-all duration-500"
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
