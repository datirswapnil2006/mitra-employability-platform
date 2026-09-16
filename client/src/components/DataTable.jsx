  import React, { useState } from 'react';
import EmptyState from './EmptyState';
import Pagination from './Pagination';

export const DataTable = ({
  columns = [],
  data = [],
  keyField = '_id',
  emptyTitle = 'No Records Found',
  emptyMessage = 'No data is available matching the current criteria.',
  pageSize = 10,
  enablePagination = true,
  className = '',
  tableClassName = '',
  containerClassName = ''
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedData = enablePagination
    ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : data;

  return (
    <div className={`w-full space-y-3 ${className}`}>
      <div className={`w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs custom-scrollbar ${containerClassName}`}>
        <table className={`w-full text-left border-collapse text-xs sm:text-sm ${tableClassName}`}>
          <thead>
            <tr className="bg-slate-50/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
              {columns.map((col, idx) => (
                <th key={idx} className={`p-4 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap ${col.thClassName || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rIdx) => (
                <tr key={row[keyField] || rIdx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`p-4 font-normal ${col.tdClassName || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-4">
                  <EmptyState title={emptyTitle} description={emptyMessage} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {enablePagination && totalItems > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default DataTable;
