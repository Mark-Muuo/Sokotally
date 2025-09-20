import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();

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
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
