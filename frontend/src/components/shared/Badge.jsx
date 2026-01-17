import React from "react";

const Badge = ({ children, variant = "default", size = "normal" }) => {
  const variantClasses = {
    default: "bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-slate-300",
    primary: "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-400",
    success:
      "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-400",
    danger: "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-400",
    warning:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-400",
    info: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-400",
  };

  const sizeClasses = {
    small: "px-2 py-0.5 text-xs",
    normal: "px-3 py-1 text-xs",
    large: "px-4 py-1.5 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
};

export default Badge;
