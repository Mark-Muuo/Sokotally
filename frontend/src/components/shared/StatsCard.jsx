import React from 'react';

const StatsCard = ({ 
  icon, 
  label, 
  value, 
  change, 
  trend, 
  color = 'blue',
  size = 'normal',
  gradient = false 
}) => {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500/10 to-blue-600/5',
      border: 'border-blue-500/30 hover:border-blue-400/50',
      glow: 'bg-blue-500/20',
      text: 'text-blue-400',
      icon: 'bg-gradient-to-br from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/30'
    },
    emerald: {
      bg: 'from-emerald-500/10 to-emerald-600/5',
      border: 'border-emerald-500/30 hover:border-emerald-400/50',
      glow: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      icon: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-500/30'
    },
    red: {
      bg: 'from-red-500/10 to-red-600/5',
      border: 'border-red-500/30 hover:border-red-400/50',
      glow: 'bg-red-500/20',
      text: 'text-red-400',
      icon: 'bg-gradient-to-br from-red-500 to-red-600',
      shadow: 'shadow-red-500/30'
    },
    purple: {
      bg: 'from-purple-500/10 to-purple-600/5',
      border: 'border-purple-500/30 hover:border-purple-400/50',
      glow: 'bg-purple-500/20',
      text: 'text-purple-400',
      icon: 'bg-gradient-to-br from-purple-500 to-purple-600',
      shadow: 'shadow-purple-500/30'
    },
    amber: {
      bg: 'from-amber-500/10 to-amber-600/5',
      border: 'border-amber-500/30 hover:border-amber-400/50',
      glow: 'bg-amber-500/20',
      text: 'text-amber-400',
      icon: 'bg-gradient-to-br from-amber-500 to-amber-600',
      shadow: 'shadow-amber-500/30'
    },
    slate: {
      bg: 'from-slate-700/10 to-slate-800/5',
      border: 'border-slate-600/30 hover:border-slate-500/50',
      glow: 'bg-slate-500/20',
      text: 'text-slate-400',
      icon: 'bg-gradient-to-br from-slate-600 to-slate-700',
      shadow: 'shadow-slate-500/30'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`relative group overflow-hidden bg-gradient-to-br ${gradient ? colors.bg : 'bg-slate-900'} border ${colors.border} rounded-2xl ${size === 'large' ? 'p-7' : 'p-6'} hover:shadow-xl transition-all duration-300 shadow-lg`}>
      {/* Animated glow effect */}
      <div className={`absolute top-0 right-0 w-24 h-24 ${colors.glow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      
      <div className="relative">
        {icon && (
          <div className={`${size === 'large' ? 'w-14 h-14 mb-4' : 'w-12 h-12 mb-3'} rounded-xl ${colors.icon} flex items-center justify-center shadow-lg ${colors.shadow} group-hover:scale-110 transition-transform duration-300`}>
            {typeof icon === 'string' ? (
              <span className={size === 'large' ? 'text-3xl' : 'text-2xl'}>{icon}</span>
            ) : (
              <div className="text-white">{icon}</div>
            )}
          </div>
        )}
        
        <div className="text-slate-400 text-sm mb-2 font-medium">{label}</div>
        <div className={`${size === 'large' ? 'text-4xl' : 'text-3xl'} font-bold text-white mb-1`}>
          {value}
        </div>
        
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <svg className={`w-3 h-3 ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {trend === 'up' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              ) : trend === 'down' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
              )}
            </svg>
            <span className={`text-xs ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
              {change}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
