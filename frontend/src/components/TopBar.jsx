import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/api';

const TopBar = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Compute effective display name (prefer nickname)
  const effectiveName = (() => {
    if (!user) return null;
    const nickname = (user.nickname || '').trim();
    if (nickname) return nickname;
    const first = user.firstName || '';
    const last = user.lastName || '';
    const computedFull = `${first} ${last}`.trim();
    const display = (user.name || '').trim();
    if (display && computedFull && display !== computedFull) return display;
    return first || display || null;
  })();

  const initials = (effectiveName || user?.name || 'P').split(' ').map(n => n[0]).join('');

  // Get welcome message for dashboard
  const welcomeTitle = location.pathname === '/dashboard' 
    ? `Welcome back, ${effectiveName || 'User'}`
    : '';

  return (
    <div className="bg-slate-900 pl-16 pr-6 md:px-6 py-4 flex items-center justify-between border-b border-slate-800">
      {/* Left side - Welcome text */}
      <div className="flex-1">
        {welcomeTitle && (
          <h1 className="text-2xl font-semibold text-white">{welcomeTitle}</h1>
        )}
      </div>

      {/* Right side - Profile */}
      <div className="flex items-center gap-3">
        <Link to={user ? '/profile' : '/signin'} className="hover:opacity-80 transition">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm overflow-hidden">
            {user?.avatar ? (
              <img src={`${API_BASE}${user.avatar}`} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
        </Link>
      </div>
    </div>
  );
};

export default TopBar;


