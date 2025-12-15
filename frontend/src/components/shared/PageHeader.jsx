import React from 'react';

const PageHeader = ({ 
  icon,
  title, 
  subtitle, 
  actions,
  gradient = true,
  showBackButton = false,
  onBack
}) => {
  return (
    <div className={`relative overflow-hidden ${gradient ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900' : 'bg-slate-900'} border border-slate-800 rounded-2xl p-6 mb-6`}>
      {/* Animated background pattern */}
      {gradient && (
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"></div>
        </div>
      )}
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          {icon && (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              {typeof icon === 'string' ? (
                <span className="text-2xl">{icon}</span>
              ) : (
                <div className="text-white">{icon}</div>
              )}
            </div>
          )}
          
          <div>
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-slate-400 mt-1">{subtitle}</p>}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
