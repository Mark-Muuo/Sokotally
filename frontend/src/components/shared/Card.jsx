import React from 'react';

const Card = ({ 
  title, 
  subtitle,
  icon,
  children, 
  actions,
  variant = 'default',
  noPadding = false,
  className = ''
}) => {
  const variantClasses = {
    default: 'bg-slate-900 border-slate-800',
    glass: 'bg-slate-900/50 backdrop-blur border-slate-800/50',
    gradient: 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700',
    glow: 'bg-slate-900 border-slate-800 shadow-lg shadow-blue-500/5'
  };

  return (
    <div className={`rounded-2xl border ${variantClasses[variant]} ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                {typeof icon === 'string' ? (
                  <span className="text-lg">{icon}</span>
                ) : (
                  <div className="text-white">{icon}</div>
                )}
              </div>
            )}
            <div>
              {title && <h3 className="text-lg font-bold text-white">{title}</h3>}
              {subtitle && <div className="text-sm text-slate-400 mt-0.5">{subtitle}</div>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>
        {children}
      </div>
    </div>
  );
};

export default Card;
