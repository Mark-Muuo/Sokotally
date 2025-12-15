import React from 'react';

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Animated background circles */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="relative w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
          {typeof icon === 'string' ? (
            <span className="text-4xl opacity-50">{icon}</span>
          ) : icon ? (
            <div className="text-slate-600">{icon}</div>
          ) : (
            <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          )}
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-400 text-center max-w-md mb-6">{description}</p>}
      
      {(action || onAction) && (
        <div>
          {action || (
            <button 
              onClick={onAction}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/20"
            >
              {actionLabel || 'Get Started'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
