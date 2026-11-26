import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronDown, ArrowRight } from 'lucide-react';
import { SERVICES } from '../../lib/services';
import { cn } from '../../lib/utils';

/**
 * "Buy" in the topbar: everything a customer can pay for, one click away
 * from any page. Built from the service catalogue, so new services
 * appear here as soon as they're added.
 */
export function BuyMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const items = SERVICES.filter((s) => s.buy);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 bg-[#1a6cf0] hover:bg-[#155cd0] text-white text-xs font-semibold px-3 sm:px-3.5 py-2 rounded-lg shadow-xs transition-colors"
      >
        <ShoppingBag className="w-4 h-4" strokeWidth={2} />
        <span>Buy</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} strokeWidth={2} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Buy"
          className="fixed left-4 right-4 top-[68px] sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mt-2 sm:w-72 max-h-[calc(100vh-88px)] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-50"
        >
          <div className="px-2.5 pt-1.5 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            What would you like to buy?
          </div>
          {items.map((s) => {
            const Icon = s.icon;
            const soon = s.status === 'soon';
            const body = (
              <>
                <span className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', s.accent.tile)}>
                  <Icon className="w-4 h-4" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {s.buy!.label}
                    {soon && (
                      <span className="px-1.5 py-px rounded text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        Soon
                      </span>
                    )}
                    {!soon && s.tag && (
                      <span className="px-1.5 py-px rounded text-[9px] font-bold uppercase bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        {s.tag}
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">{s.buy!.hint}</span>
                </span>
              </>
            );
            return soon ? (
              <div key={s.id} role="menuitem" aria-disabled="true" className="flex items-center gap-3 px-2.5 py-2 rounded-lg opacity-60 cursor-not-allowed">
                {body}
              </div>
            ) : (
              <Link
                key={s.id}
                role="menuitem"
                to={s.buy!.path}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {body}
              </Link>
            );
          })}
          <Link
            to="/services"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center justify-between px-2.5 py-2 rounded-lg border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-[#1764e0] dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            See all services <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
          </Link>
        </div>
      )}
    </div>
  );
}
