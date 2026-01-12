import React from 'react';

const Badge = ({ 
  children, 
  variant = 'default',
  size = 'normal',
  pulse = false
}) => {
  const variantClasses = {
    default: 'bg-slate-700 text-slate-300',
    primary: 'bg-blue-500/20 text-blue-400',
    success: 'bg-emerald-500/20 text-emerald-400',
    danger: 'bg-red-500/20 text-red-400',
    warning: 'bg-amber-500/20 text-amber-400',
    info: 'bg-purple-500/20 text-purple-400'
  };

  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    normal: 'px-3 py-1 text-xs',
    large: 'px-4 py-1.5 text-sm'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${pulse ? 'animate-pulse' : ''}`}>
      {pulse && <span className="w-1.5 h-1.5 bg-current"></span>}
      {children}
    </span>
  );
};

export default Badge;
