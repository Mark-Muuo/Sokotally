import React from "react";

const ProgressBar = ({
  value,
  max = 100,
  color = "blue",
  size = "normal",
  showLabel = false,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    blue: "bg-blue-600",
    emerald: "bg-green-600",
    red: "bg-red-600",
    purple: "bg-purple-600",
    amber: "bg-amber-600",
    gray: "bg-gray-600",
  };

  const sizeClasses = {
    small: "h-1",
    normal: "h-2",
    large: "h-3",
  };

  return (
    <div>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-slate-400">
            {value} / {max}
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
      <div
        className={`w-full bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden ${sizeClasses[size]}`}
      >
        <div
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
