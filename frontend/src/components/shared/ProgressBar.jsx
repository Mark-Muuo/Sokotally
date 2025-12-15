import React from 'react';

const ProgressBar = ({ 
  value, 
  max = 100, 
  color = 'blue',
  size = 'normal',
  showLabel = false,
  animated = false
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600',
    gradient: 'from-blue-500 via-purple-500 to-pink-500'
  };

  const sizeClasses = {
    small: 'h-1',
    normal: 'h-2',
    large: 'h-3'
  };

  return (
    <div>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">{value} / {max}</span>
          <span className="text-sm font-semibold text-white">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className={`${sizeClasses[size]} bg-gradient-to-r ${colorClasses[color]} rounded-full transition-all duration-500 ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
