import React from 'react';

const ActionButton = ({ 
  icon, 
  label, 
  description, 
  onClick, 
  href,
  color = 'blue',
  variant = 'primary',
  size = 'normal',
  disabled = false
}) => {
  const colorClasses = {
    blue: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20',
      secondary: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 hover:border-blue-500/50 text-white',
      ghost: 'hover:bg-blue-500/10 text-blue-400'
    },
    emerald: {
      primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
      secondary: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 hover:border-emerald-500/50 text-white',
      ghost: 'hover:bg-emerald-500/10 text-emerald-400'
    },
    red: {
      primary: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20',
      secondary: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 hover:border-red-500/50 text-white',
      ghost: 'hover:bg-red-500/10 text-red-400'
    },
    purple: {
      primary: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20',
      secondary: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 hover:border-purple-500/50 text-white',
      ghost: 'hover:bg-purple-500/10 text-purple-400'
    },
    slate: {
      primary: 'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-700/20',
      secondary: 'bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-slate-600 text-white',
      ghost: 'hover:bg-slate-800 text-slate-400'
    }
  };

  const iconColorClasses = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    slate: 'bg-slate-600'
  };

  const colors = colorClasses[color] || colorClasses.blue;
  const iconColor = iconColorClasses[color] || iconColorClasses.blue;
  const classes = colors[variant] || colors.primary;
  
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    normal: description ? 'p-3' : 'px-4 py-2',
    large: 'p-4'
  };

  const baseClasses = `inline-flex items-center gap-3 ${sizeClasses[size]} rounded-xl transition-all duration-200 group ${
    variant === 'primary' ? 'shadow-lg' : variant === 'secondary' ? 'border' : ''
  } ${classes} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;

  const content = (
    <>
      {icon && (
        <div className={`${size === 'large' ? 'w-12 h-12' : size === 'small' ? 'w-6 h-6' : 'w-10 h-10'} rounded-lg ${variant === 'ghost' ? iconColor : variant === 'secondary' ? iconColor : 'bg-white/20'} flex items-center justify-center group-hover:scale-105 transition-transform`}>
          {typeof icon === 'string' ? (
            <span className={size === 'large' ? 'text-xl' : 'text-base'}>{icon}</span>
          ) : (
            <div className={variant === 'primary' ? 'text-white' : ''}>{icon}</div>
          )}
        </div>
      )}
      
      <div className="flex-1">
        <div className={`font-semibold ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
          {label}
        </div>
        {description && (
          <div className="text-xs text-slate-400 mt-0.5">{description}</div>
        )}
      </div>
      
      {!description && (
        <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses} disabled={disabled}>
      {content}
    </button>
  );
};

export default ActionButton;
