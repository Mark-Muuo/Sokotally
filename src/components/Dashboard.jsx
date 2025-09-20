import React, { useState } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [chatMessage, setChatMessage] = useState('');
  const [llmResponse, setLlmResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock user data
  const user = {
    name: "John Smith",
    username: "john.smith"
  };

  // Mock financial data
  const financialData = {
    sales: 125000,
    expenses: 78000,
    profit: 47000
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setIsLoading(true);
    
    // Simulate LLM API call
    setTimeout(() => {
      setLlmResponse(`LLM Response: I received your message: "${chatMessage}". This would normally be processed by our AI assistant to help with your bookkeeping needs.`);
      setIsLoading(false);
      setChatMessage('');
    }, 1500);
  };

  const formatCurrency = (amount) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  return (
    <div className="dashboard">
      {/* User Info Header */}
      <header className="user-header">
        <div className="user-info">
          <h1>Welcome back, {user.name}</h1>
        </div>
        <div className="user-avatar">
          <div className="avatar-circle">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      </header>

      {/* Financial Cards */}
      <div className="financial-cards">
        <div className="card sales-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Today's Sales</h3>
            <p className="amount">{formatCurrency(financialData.sales)}</p>
            <span className="trend positive">+12.5% from last month</span>
          </div>
        </div>

        <div className="card expenses-card">
          <div className="card-icon">💸</div>
          <div className="card-content">
            <h3>Today's Expenses</h3>
            <p className="amount">{formatCurrency(financialData.expenses)}</p>
            <span className="trend negative">+8.2% from last month</span>
          </div>
        </div>

        <div className="card profit-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>Today's Profit/Loss</h3>
            <p className={`amount profit-amount ${financialData.profit >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(financialData.profit)}</p>
            <span className="trend positive">+15.3% from last month</span>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="chat-section">
        <div className="chat-container">
          <h3>AI Assistant</h3>
          <p>Ask questions or input bookkeeping details for processing</p>
          
          <form onSubmit={handleChatSubmit} className="chat-form">
            <div className="chat-input-group">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Enter your bookkeeping details or questions..."
                className="chat-input"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className="chat-submit"
                disabled={isLoading || !chatMessage.trim()}
              >
                {isLoading ? '⏳' : (
                  <svg
                    className="arrow-icon"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" clipRule="evenodd" d="M3 12c0-.414.336-.75.75-.75h11.69l-3.72-3.72a.75.75 0 1 1 1.06-1.06l5 5c.293.293.293.767 0 1.06l-5 5a.75.75 0 1 1-1.06-1.06l3.72-3.72H3.75A.75.75 0 0 1 3 12z" />
                  </svg>
                )}
              </button>
            </div>
          </form>

          {/* LLM Response Display */}
          {llmResponse && (
            <div className="llm-response">
              <h4>AI Response:</h4>
              <div className="response-content">
                {llmResponse}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Processing your request...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
