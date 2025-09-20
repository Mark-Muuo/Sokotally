import React, { useState, useEffect } from 'react';
import './Report.css';

const Report = () => {
  const [filterType, setFilterType] = useState('monthly');
  const [customerRange, setCustomerRange] = useState('all');

  // Mock data
  const [reportData, setReportData] = useState({
    sales: [],
    expenses: [],
    debts: [],
    loans: [],
    stock: []
  });

  useEffect(() => {
    generateMockData();
  }, [filterType, customerRange]);

  const generateMockData = () => {
    const now = new Date();
    let periods = [];
    
    // Generate data based on filter type
    switch (filterType) {
      case 'daily':
        periods = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          return date;
        });
        break;
      case 'weekly':
        periods = Array.from({ length: 4 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - (i * 7));
          return date;
        });
        break;
      case 'monthly':
        periods = Array.from({ length: 6 }, (_, i) => {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          return date;
        });
        break;
    }

    // Mock sales data
    const sales = periods.map(period => ({
      date: period,
      amount: Math.floor(Math.random() * 50000) + 10000,
      customer: `Customer ${Math.floor(Math.random() * 20) + 1}`
    }));

    // Mock expense data
    const expenses = [
      { category: 'Rent', amount: 15000 },
      { category: 'Utilities', amount: 5000 },
      { category: 'Supplies', amount: 8000 },
      { category: 'Marketing', amount: 3000 },
      { category: 'Salaries', amount: 25000 },
      { category: 'Other', amount: 2000 }
    ];

    // Mock debt data
    const debts = [
      { person: 'John Doe', amount: 50000, status: 'unpaid' },
      { person: 'Jane Smith', amount: 25000, status: 'paid' },
      { person: 'Mike Johnson', amount: 75000, status: 'unpaid' },
      { person: 'Sarah Wilson', amount: 30000, status: 'partial' }
    ];

    // Mock loan data
    const loans = [
      { institution: 'Bank A', amount: 200000, repaymentPeriod: '24 months' },
      { institution: 'Bank B', amount: 150000, repaymentPeriod: '36 months' },
      { institution: 'Credit Union', amount: 100000, repaymentPeriod: '12 months' }
    ];

    // Mock stock data
    const stock = [
      { item: 'Rice', sold: 150, revenue: 45000 },
      { item: 'Beans', sold: 120, revenue: 36000 },
      { item: 'Maize', sold: 200, revenue: 60000 },
      { item: 'Wheat', sold: 80, revenue: 24000 },
      { item: 'Sugar', sold: 90, revenue: 27000 }
    ];

    setReportData({ sales, expenses, debts, loans, stock });
  };

  // Calculate totals
  const totalSales = reportData.sales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalExpenses = reportData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalSales - totalExpenses;
  const totalDebts = reportData.debts.reduce((sum, debt) => sum + debt.amount, 0);
  const paidDebts = reportData.debts.filter(debt => debt.status === 'paid').reduce((sum, debt) => sum + debt.amount, 0);
  const unpaidDebts = totalDebts - paidDebts;

  const handleExportPDF = () => {
    const printContent = `
      Financial Report
      Report Period: ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}
      
      Profit & Loss Summary:
      Total Sales: KSh ${totalSales.toLocaleString()}
      Total Expenses: KSh ${totalExpenses.toLocaleString()}
      Net Profit/Loss: KSh ${netProfit.toLocaleString()}
      
      Debt Summary:
      Total Outstanding Debts: KSh ${totalDebts.toLocaleString()}
    `;
    
    const blob = new Blob([printContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="report-page">
      <div className="page-header">
        <h1>📊 Financial Reports</h1>
        <p>Comprehensive financial analysis and business insights</p>
        
        {/* Filter Controls */}
        <div className="filter-controls">
          <div className="filter-group">
            <label>Report Period:</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Customer Range:</label>
            <select 
              value={customerRange} 
              onChange={(e) => setCustomerRange(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Customers</option>
              <option value="top10">Top 10 Customers</option>
              <option value="top20">Top 20 Customers</option>
            </select>
          </div>
          
          <button onClick={handleExportPDF} className="export-btn">
            📄 Export Report
          </button>
        </div>
      </div>
      
      <div className="report-content">
        {/* Profit & Loss Section */}
        <section className="report-section">
          <h2>💰 Profit & Loss Statement</h2>
          <div className="pl-summary">
            <div className="pl-card sales">
              <h3>Total Sales</h3>
              <div className="amount">KSh {totalSales.toLocaleString()}</div>
            </div>
            <div className="pl-card expenses">
              <h3>Total Expenses</h3>
              <div className="amount">KSh {totalExpenses.toLocaleString()}</div>
            </div>
            <div className={`pl-card net ${netProfit >= 0 ? 'profit' : 'loss'}`}>
              <h3>Net Profit/Loss</h3>
              <div className="amount">KSh {netProfit.toLocaleString()}</div>
            </div>
          </div>
        </section>

        {/* Debt & Loans Section */}
        <section className="report-section">
          <h2>💳 Debt & Loans Management</h2>
          
          <div className="debt-summary">
            <div className="debt-cards">
              <div className="debt-card">
                <h3>People Owed</h3>
                <div className="debt-list">
                  {reportData.debts.map((debt, index) => (
                    <div key={index} className="debt-item">
                      <span className="person">{debt.person}</span>
                      <span className={`amount ${debt.status}`}>KSh {debt.amount.toLocaleString()}</span>
                      <span className={`status ${debt.status}`}>{debt.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="debt-card">
                <h3>Loan Institutions</h3>
                <div className="loan-list">
                  {reportData.loans.map((loan, index) => (
                    <div key={index} className="loan-item">
                      <span className="institution">{loan.institution}</span>
                      <span className="amount">KSh {loan.amount.toLocaleString()}</span>
                      <span className="period">{loan.repaymentPeriod}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Expenses Section */}
        <section className="report-section">
          <h2>💸 Expense Analysis</h2>
          
          <div className="expense-breakdown">
            <div className="expense-list">
              {reportData.expenses.map((expense, index) => (
                <div key={index} className="expense-item">
                  <span className="category">{expense.category}</span>
                  <span className="amount">KSh {expense.amount.toLocaleString()}</span>
                  <span className="percentage">
                    {((expense.amount / totalExpenses) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stock Report Section */}
        <section className="report-section">
          <h2>📦 Stock Sales Report</h2>
          
          <div className="stock-overview">
            <div className="stock-list">
              {reportData.stock.map((item, index) => (
                <div key={index} className="stock-item">
                  <span className="item-name">{item.item}</span>
                  <span className="quantity-sold">{item.sold} units</span>
                  <span className="revenue">KSh {item.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Summary Section */}
        <section className="report-section ai-summary">
          <h2>🤖 AI Business Insights</h2>
          <div className="ai-insights">
            <div className="insight-item">
              {netProfit > 0 ? "✅ Your business is profitable with a positive net income." : "⚠️ Your business is currently operating at a loss. Consider reducing expenses or increasing sales."}
            </div>
            <div className="insight-item">
              {unpaidDebts > paidDebts ? "📊 You have more outstanding debts than paid ones. Consider implementing a debt collection strategy." : "✅ Your debt collection is going well."}
            </div>
            <div className="insight-item">
              💡 Monitor your top-performing products and consider increasing inventory
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Report;