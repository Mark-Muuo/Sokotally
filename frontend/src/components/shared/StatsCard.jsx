import React from "react";

const StatsCard = ({ icon, label, value, change, trend, size = "normal" }) => {
  return (
    <div
      className={`border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${size === "large" ? "p-6" : "p-5"}`}
    >
      <div>
        {icon && (
          <div
            className={`${size === "large" ? "w-12 h-12 mb-4" : "w-10 h-10 mb-3"} border border-gray-300 dark:border-slate-700 flex items-center justify-center`}
          >
            {typeof icon === "string" ? (
              <span className={size === "large" ? "text-2xl" : "text-xl"}>
                {icon}
              </span>
            ) : (
              <div className="text-gray-900 dark:text-white">{icon}</div>
            )}
          </div>
        )}

        <div className="text-gray-600 dark:text-slate-400 text-sm mb-2">
          {label}
        </div>
        <div
          className={`${size === "large" ? "text-3xl" : "text-2xl"} font-bold text-gray-900 dark:text-white mb-1`}
        >
          {value}
        </div>

        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <svg
              className={`w-3 h-3 ${trend === "up" ? "text-green-600 dark:text-green-400" : trend === "down" ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {trend === "up" ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              ) : trend === "down" ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14"
                />
              )}
            </svg>
            <span
              className={`text-xs ${trend === "up" ? "text-green-600 dark:text-green-400" : trend === "down" ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}`}
            >
              {change}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
