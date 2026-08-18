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
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedData = enablePagination
    ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : data;

  return (
    <div className={`w-full space-y-3 ${className}`}>
      <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50/90 text-slate-600 font-semibold border-b border-slate-200 select-none">
              {columns.map((col, idx) => (
                <th key={idx} className="p-4 uppercase tracking-wider text-[11px] font-bold text-slate-500">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rIdx) => (
                <tr key={row[keyField] || rIdx} className="hover:bg-slate-50/80 transition-colors">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="p-4 font-normal">
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
