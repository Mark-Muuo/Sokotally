import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../storage/auth';
import { API_BASE } from '../config/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    
    fetch(`${API_BASE}/api/transactions/stats/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : null)
    .then(setData)
    .catch(console.error);
  }, []);

  const stats = {
    sales: data?.sales || 0,
    expenses: data?.expenses || 0,
    profit: data?.profit || 0,
    debt: data?.debts?.outstandingTotal || 0
  };

  const recent = data?.recentTransactions?.slice(0, 5) || [];

  return (
    <div className="p-6 space-y-6 bg-white dark:bg-slate-900 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back, {user?.name || 'User'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Sales', value: stats.sales, color: 'green' },
          { label: 'Expenses', value: stats.expenses, color: 'red' },
          { label: 'Profit', value: stats.profit, color: 'blue' },
          { label: 'Debt', value: stats.debt, color: 'orange' }
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              KSh {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/record" state={{ openModal: 'sale' }} 
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 hover:bg-green-100 dark:hover:bg-green-900/30 transition">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Add Sale</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Record income</p>
            </div>
          </div>
        </Link>

        <Link to="/record" state={{ openModal: 'expense' }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 hover:bg-red-100 dark:hover:bg-red-900/30 transition">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💸</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Add Expense</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Record spending</p>
            </div>
          </div>
        </Link>

        <Link to="/report"
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">View Reports</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">See analytics</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
        </div>
        <div className="p-4">
          {recent.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {recent.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{t.type === 'income' ? '💰' : '💸'}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {t.items?.map(item => item.name).join(', ') || t.notes || t.type}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(t.occurredAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}KSh {t.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
