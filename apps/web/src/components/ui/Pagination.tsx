import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Simple page-number pagination. Client-side — the parent slices its data.
 *
 *   const [page, setPage] = useState(1);
 *   const pageItems = allItems.slice((page - 1) * pageSize, page * pageSize);
 *   <Pagination page={page} pageSize={pageSize} total={allItems.length} onPageChange={setPage} />
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  label = 'items',
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  if (total === 0) return null;

  // Show up to 5 page numbers around the current page.
  const pages: number[] = [];
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      <div className="text-slate-500 dark:text-slate-400">
        Showing{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {from}–{to}
        </span>{' '}
        of{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {total}
        </span>{' '}
        {label}
      </div>
      <div className="flex items-center gap-1">
        <PageButton
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
        </PageButton>
        {start > 1 && (
          <>
            <PageButton onClick={() => onPageChange(1)}>1</PageButton>
            {start > 2 && (
              <span className="px-1 text-slate-400 dark:text-slate-500">…</span>
            )}
          </>
        )}
        {pages.map((n) => (
          <PageButton
            key={n}
            active={n === page}
            onClick={() => onPageChange(n)}
          >
            {n}
          </PageButton>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && (
              <span className="px-1 text-slate-400 dark:text-slate-500">…</span>
            )}
            <PageButton onClick={() => onPageChange(totalPages)}>
              {totalPages}
            </PageButton>
          </>
        )}
        <PageButton
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  children,
  active = false,
  disabled = false,
  onClick,
  ...rest
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
} & React.AriaAttributes) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'min-w-[28px] h-7 px-2 rounded-md flex items-center justify-center text-xs transition-colors',
        active
          ? 'bg-[#1976d2] text-white font-semibold shadow-xs'
          : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
        disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}