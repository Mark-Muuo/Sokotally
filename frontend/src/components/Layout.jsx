import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';
import TopBar from './TopBar';

const Layout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      {/* Mobile hamburger button */}
      <button 
        className="hamburger" 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo">
          <h2>SokoTally</h2>
        </div>
        <nav className="nav-menu">
          <Link 
            to="/dashboard" 
            className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            📊 Dashboard
          </Link>
          <Link 
            to="/record" 
            className={`nav-item ${location.pathname === '/record' ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            📝 Record
          </Link>
          <Link 
            to="/report" 
            className={`nav-item ${location.pathname === '/report' ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            📈 Report
          </Link>
          {user && (
            <Link 
              to="/profile" 
              className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              👤 Profile
            </Link>
          )}
        </nav>
        <div className="auth-box">
          {!user && (
            <>
              <Link to="/signin" className="nav-item" onClick={() => setSidebarOpen(false)}>Sign In</Link>
              <Link to="/signup" className="nav-item" onClick={() => setSidebarOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      </aside>
      <main className="main-content">
        <TopBar />
        {children}
      </main>
    </div>
  );
};

export default Layout;
