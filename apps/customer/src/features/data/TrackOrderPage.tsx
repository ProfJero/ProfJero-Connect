import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Inbox, Loader2, Search } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { formatDateTime, formatPhone } from '../../lib/format';
import { networkStyle } from '../../lib/services';
import { dataOrderStatus } from '../../lib/dataOrders';
import { Badge } from '../../components/ui/Badge';
import { inputClass } from '../../components/ui/buttons';
import { cn } from '../../lib/utils';
import type { DataOrder } from '../../lib/types';

type Tracked = Pick<DataOrder, 'id' | 'bundleLabel' | 'network' | 'size' | 'recipientNumber' | 'orderStatus' | 'paymentStatus' | 'createdAt' | 'completedAt'>;

/**
 * Track data orders without an account: by order ID (opens that order)
 * or by phone number (latest paid orders sent to it).
 */
export function TrackOrderPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Tracked[] | null>(null);
  const [searched, setSearched] = useState<string | null>(null);

  const search = async (e?: FormEvent) => {
    e?.preventDefault();
    const term = q.trim();
    if (!term) {
      setError('Enter your order ID or the phone number that received the data.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.get<{ orders: Tracked[] }>(`/public/data/track?q=${encodeURIComponent(term)}`, { fresh: true });
      const isId = term.toLowerCase().startsWith('pjd_');
      if (isId && res.orders.length === 1) {
        navigate(`/data/orders/${res.orders[0].id}`);
        return;
      }
      setResults(res.orders);
      setSearched(term);
      setParams({ q: term }, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setResults(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 flex-1">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="text-center">
          <span className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <Search className="w-7 h-7" strokeWidth={2} />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Track your data order</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Enter your order ID, or the phone number the data was sent to.</p>
        </div>

        <form onSubmit={search} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
          <label htmlFor="track-q" className="text-xs font-semibold text-slate-700 dark:text-slate-200">Order ID or phone number</label>
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <input
              id="track-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. 024 123 4567 or pjd_…"
              autoComplete="off"
              spellCheck={false}
              className={cn(inputClass, 'flex-1 py-3 text-base sm:text-sm font-mono')}
              aria-describedby={error ? 'track-error' : undefined}
            />
            <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold px-5 py-3 rounded-xl disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" strokeWidth={2.5} />} Track
            </button>
          </div>
          {error && <p id="track-error" role="alert" className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
        </form>

        {results && (
          <section aria-live="polite" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            {results.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox className="w-9 h-9 mx-auto text-slate-400" strokeWidth={1.5} />
                <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">No paid orders found for {searched}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Check the number or order ID. Orders appear here once payment goes through.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.map((o) => {
                  const st = dataOrderStatus(o as DataOrder);
                  return (
                    <li key={o.id}>
                      <Link to={`/data/orders/${o.id}`} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <span className={cn('px-1.5 py-px rounded text-[10px] font-bold shrink-0', networkStyle(o.network).chip)}>{o.network}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{o.bundleLabel}</span>
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-mono">{formatPhone(o.recipientNumber)}</span> · {formatDateTime(o.createdAt)}
                          </span>
                        </span>
                        <Badge tone={st.tone} label={st.label} />
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Want to buy?{' '}
          <Link to="/data" className="font-semibold text-[#1764e0] dark:text-blue-400 hover:underline">Buy data — no account needed</Link>
        </p>
      </div>
    </main>
  );
}
