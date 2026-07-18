'use client';

import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  loading?: boolean;
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: keyof T) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  rowActions?: (row: T) => React.ReactNode;
  striped?: boolean;
  hover?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  loading = false,
  sortBy,
  sortOrder = 'asc',
  onSort,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  rowActions,
  striped = true,
  hover = true,
}: DataTableProps<T>) {
  return (
    <div className="w-full space-y-4">
      <div className="rounded-xl border border-black/10 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-black/5 to-black/2 border-b border-black/10">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-6 py-4 text-left font-bold text-ink whitespace-nowrap ${column.width || ''} ${
                      column.sortable ? 'cursor-pointer hover:bg-black/5 transition-colors' : ''
                    }`}
                    onClick={() => column.sortable && onSort?.(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.label}</span>
                      {column.sortable && sortBy === column.key && (
                        <span className="text-coral">
                          {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {rowActions && <th className="px-6 py-4 text-left font-bold text-ink">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (rowActions ? 1 : 0)} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-coral animate-bounce" />
                      <span className="text-black/60 font-medium">Loading data...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (rowActions ? 1 : 0)} className="px-6 py-12 text-center">
                    <div className="space-y-2">
                      <p className="text-black/60 font-medium">No data found</p>
                      <p className="text-sm text-black/40">Try adjusting your filters or search terms</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr
                    key={keyExtractor(row, index)}
                    className={`border-b border-black/5 transition-all ${
                      striped && index % 2 === 0 ? 'bg-black/2' : ''
                    } ${hover ? 'hover:bg-black/5' : ''}`}
                  >
                    {columns.map((column) => (
                      <td key={String(column.key)} className={`px-6 py-4 text-sm text-black/80 ${column.width || ''}`}>
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </td>
                    ))}
                    {rowActions && <td className="px-6 py-4">{rowActions(row)}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 rounded-lg border border-black/10 bg-white">
          <span className="text-sm text-black/60 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-black/10 hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = currentPage > 3 ? currentPage - 2 + i : i + 1;
                return page <= totalPages ? (
                  <button
                    key={page}
                    onClick={() => onPageChange?.(page)}
                    className={`w-8 h-8 rounded-lg font-bold transition-all ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-coral to-coral/80 text-white shadow-lg'
                        : 'border border-black/10 hover:bg-black/5'
                    }`}
                  >
                    {page}
                  </button>
                ) : null;
              })}
            </div>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-black/10 hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
