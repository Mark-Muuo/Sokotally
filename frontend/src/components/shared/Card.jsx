import React from "react";

const Card = ({
  title,
  subtitle,
  icon,
  children,
  actions,
  noPadding = false,
  className = "",
}) => {
  return (
    <div
      className={`border bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 ${className}`}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 border border-gray-300 dark:border-slate-700 flex items-center justify-center">
                {typeof icon === "string" ? (
                  <span className="text-lg text-gray-900 dark:text-white">
                    {icon}
                  </span>
                ) : (
                  <div className="text-gray-900 dark:text-white">{icon}</div>
                )}
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              {subtitle && (
                <div className="text-sm text-gray-600 dark:text-slate-400 mt-0.5">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </div>
  );
};

export default Card;
