import React from 'react';

const DataTable = ({ 
  columns, 
  data, 
  emptyMessage = 'No data available',
  hoverable = true,
  compact = false
}) => {
  return (
    <div className="overflow-x-auto border border-gray-200 dark:border-slate-800">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-800">
            {columns.map((col, i) => (
              <th 
                key={i} 
                className={`${compact ? 'py-2 px-3' : 'py-3 px-4'} text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-slate-800/50">
          {data && data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={`${hoverable ? 'hover:bg-gray-50 dark:hover:bg-slate-800/30' : ''} transition-colors`}
              >
                {columns.map((col, colIndex) => (
                  <td 
                    key={colIndex} 
                    className={`${compact ? 'py-2 px-3' : 'py-3 px-4'} text-sm ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''} ${col.className || 'text-gray-900 dark:text-white'}`}
                  >
                    {col.render ? col.render(row, rowIndex) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td 
                colSpan={columns.length} 
                className="py-12 text-center text-gray-500 dark:text-slate-500"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <span>{emptyMessage}</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
