import React from 'react';

const LoadingSpinner = ({ 
  size = 'normal',
  text,
  fullScreen = false
}) => {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    normal: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-3'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} border-slate-700 border-t-blue-500 rounded-full animate-spin`}></div>
      {text && <p className="text-sm text-slate-400">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
