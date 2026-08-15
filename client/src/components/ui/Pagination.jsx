import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

export default function Pagination({ page, pages, total, limit, onPageChange }) {
  if (pages <= 1) return null;

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) rangeWithDots.push(l + 1);
        else if (i - l !== 1) rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-2">
      <span className="text-sm text-slate-500">
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn-icon disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <HiChevronLeft className="w-5 h-5" />
        </button>
        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-slate-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="btn-icon disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <HiChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

