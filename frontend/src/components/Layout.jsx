import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          <h2>SokoTally</h2>
        </div>
        <nav className="nav-menu">
          <Link 
            to="/dashboard" 
            className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            📊 Dashboard
          </Link>
          <Link 
            to="/record" 
            className={`nav-item ${location.pathname === '/record' ? 'active' : ''}`}
          >
            📝 Record
          </Link>
          <Link 
            to="/report" 
            className={`nav-item ${location.pathname === '/report' ? 'active' : ''}`}
          >
            📈 Report
          </Link>
        </nav>
        <div className="auth-box">
          {user ? (
            <>
              <div className="user-line">👤 {user.name}</div>
              <button className="nav-item" onClick={signOut}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/signin" className="nav-item">Sign In</Link>
              <Link to="/signup" className="nav-item">Sign Up</Link>
            </>
          )}
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
