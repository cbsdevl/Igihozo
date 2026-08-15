import { HiMagnifyingGlass } from 'react-icons/hi2';
import { useDebounce } from '../hooks/useDebounce';
import { useState, useEffect } from 'react';
import Pagination from './ui/Pagination';
import LoadingSpinner from './ui/LoadingSpinner';

export default function DataTable({
  columns,
  data,
  loading = false,
  error = null,
  searchable = false,
  onSearch,
  placeholder = 'Search...',
  pagination,
  onPageChange,
  actions,
  emptyMessage = 'No data found',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => {
    if (onSearch) onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);

  return (
    <div className="card">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        {searchable && (
          <div className="relative w-full sm:w-72">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              className="input pl-9"
            />
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">{actions}</div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 mb-4 bg-danger-50 text-danger-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-16">
                  <LoadingSpinner />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-16 text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.id || idx} className="group">
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && onPageChange && (
        <Pagination {...pagination} onPageChange={onPageChange} />
      )}
    </div>
  );
}

