import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  RefreshCw,
  Loader2,
  Pencil,
  Trash2,
  ArrowLeft,
  Search,
  Percent,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { TableScroll } from '../../components/ui/TableScroll';
import { Pagination } from '../../components/ui/Pagination';
import { useApi } from '../../lib/useApi';
import { apiFetch } from '../../lib/api';
import { cn } from '../../lib/utils';
import { EditBundleModal, type EditableBundle } from './EditBundleModal';

interface DataBundle extends EditableBundle {
  syncedAt: string;
  /** Real profit per sale after the gateway fee and the provider top-up fee. */
  profitGhs?: number;
  profitPercent?: number;
  chargedGhs?: number;
  totalCostGhs?: number;
  gatewayFeeGhs?: number;
}

interface BundlesResponse {
  ok: true;
  bundles: DataBundle[];
  count: number;
  markupPercent?: number;
  fees?: { serviceChargePercent?: number; gatewayFeePercent?: number; providerDepositFeePercent?: number };
  priceListUpdated?: string;
}

const NETWORKS = ['MTN', 'Telecel', 'AirtelTigo'] as const;
const netKey = (n: string): string => {
  const k = n.toUpperCase().replace(/[^A-Z]/g, '');
  if (k.startsWith('MTN')) return 'MTN';
  if (k.startsWith('TELECEL') || k.startsWith('VODAFONE')) return 'Telecel';
  if (k.startsWith('AIRTEL') || k.startsWith('TIGO') || k === 'AT') return 'AirtelTigo';
  return n;
};

interface SyncResponse {
  ok: true;
  summary: { total: number; created: number; updated: number; deactivated: number };
}

type VisibilityFilter = 'all' | 'visible' | 'hidden' | 'disabled';

const PAGE_SIZE = 10;

export function DataBundlesPage() {
  const { data, loading, error, reload } = useApi<BundlesResponse>(
    '/admin/providers/data/bundles',
  );
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<VisibilityFilter>('all');
  const [network, setNetwork] = useState<string>('all');
  const [bulkBusy, setBulkBusy] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<DataBundle | null>(null);
  const [markupModal, setMarkupModal] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const markBusy = (id: string, busy: boolean) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await apiFetch<SyncResponse>('/admin/providers/data/sync', {
        method: 'POST',
      });
      setSyncMsg(
        `Synced: ${res.summary.created} new, ${res.summary.updated} updated, ${res.summary.deactivated} deactivated.`,
      );
      await reload();
    } catch (err) {
      setSyncMsg(err instanceof Error ? `Sync failed: ${err.message}` : 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const toggleAvailability = async (bundle: DataBundle) => {
    markBusy(bundle.id, true);
    try {
      await apiFetch(
        `/admin/providers/data/bundles/${encodeURIComponent(bundle.id)}/availability`,
        {
          method: 'PUT',
          body: JSON.stringify({ available: !bundle.availableToCustomers }),
        },
      );
      await reload();
    } catch (err) {
      console.error('Toggle failed', err);
    } finally {
      markBusy(bundle.id, false);
    }
  };

  const deleteBundle = async (bundle: DataBundle) => {
    if (!window.confirm(`Remove "${bundle.label}" from our catalog?\n\nThe next sync will re-add it (hidden) if the provider still offers it.`)) {
      return;
    }
    markBusy(bundle.id, true);
    try {
      await apiFetch(`/admin/providers/data/bundles/${encodeURIComponent(bundle.id)}`, {
        method: 'DELETE',
      });
      await reload();
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      markBusy(bundle.id, false);
    }
  };

  const allBundles = useMemo(() => data?.bundles ?? [], [data]);

  /** Put every active bundle of one network on sale (or take them all off). */
  const setNetworkOnSale = async (net: string, available: boolean) => {
    const targets = allBundles.filter((b) => netKey(b.network) === net && b.active && b.availableToCustomers !== available);
    if (targets.length === 0) {
      setSyncMsg(`All active ${net} bundles are already ${available ? 'on sale' : 'hidden'}.`);
      return;
    }
    if (!window.confirm(`${available ? 'Put' : 'Take'} ${targets.length} ${net} bundle${targets.length === 1 ? '' : 's'} ${available ? 'on sale' : 'off sale'}?`)) return;
    setBulkBusy(net);
    let failed = 0;
    for (const b of targets) {
      try {
        await apiFetch(`/admin/providers/data/bundles/${encodeURIComponent(b.id)}/availability`, {
          method: 'PUT',
          body: JSON.stringify({ available }),
        });
      } catch {
        failed++;
      }
    }
    setBulkBusy(null);
    setSyncMsg(`${net}: ${targets.length - failed} bundle${targets.length - failed === 1 ? '' : 's'} ${available ? 'now on sale' : 'hidden'}${failed ? `, ${failed} failed` : ''}.`);
    await reload();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allBundles.filter((b) => {
      if (network !== 'all' && netKey(b.network) !== network) return false;
      if (filter === 'visible' && !b.availableToCustomers) return false;
      if (filter === 'hidden' && (b.availableToCustomers || !b.active)) return false;
      if (filter === 'disabled' && b.active) return false;
      if (q) {
        const hay = `${b.label} ${b.network} ${b.size} ${b.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allBundles, search, filter, network]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const availableCount = allBundles.filter((b) => b.availableToCustomers).length;

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#1976d2] flex items-center justify-center text-white shadow-sm shrink-0">
            <Package className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Data Bundles
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {allBundles.length} synced · {availableCount} on sale
              {data?.priceListUpdated && <> · price list of {data.priceListUpdated}</>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/providers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
            Providers
          </Link>
          <button
            type="button"
            onClick={() => setMarkupModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Percent className="w-3.5 h-3.5" strokeWidth={2} />
            Set markup
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1976d2] hover:bg-[#155cd0] disabled:opacity-60 text-white text-xs font-semibold shadow-xs transition"
          >
            <RefreshCw
              className={cn('w-3.5 h-3.5', syncing && 'animate-spin')}
              strokeWidth={2}
            />
            {syncing ? 'Syncing…' : 'Sync from provider'}
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 px-4 py-3 text-xs text-blue-800 dark:text-blue-300">
          {syncMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {NETWORKS.map((net) => {
          const items = allBundles.filter((b) => netKey(b.network) === net && b.active);
          const onSale = items.filter((b) => b.availableToCustomers).length;
          return (
            <Card key={net} className="p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-900">{net}</div>
                <div className="text-[11px] text-slate-600">{items.length === 0 ? 'No bundles synced' : `${onSale} of ${items.length} on sale`}</div>
              </div>
              {items.length > 0 && (
                <button
                  type="button"
                  disabled={bulkBusy !== null}
                  onClick={() => setNetworkOnSale(net, onSale < items.length)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold border transition disabled:opacity-60',
                    onSale < items.length ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50',
                  )}
                >
                  {bulkBusy === net && <Loader2 className="w-3 h-3 animate-spin" />}
                  {onSale < items.length ? 'Put all on sale' : 'Hide all'}
                </button>
              )}
            </Card>
          );
        })}
      </div>

      {data?.fees && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-[11px] text-slate-700 leading-relaxed">
          <strong className="text-slate-900">Profit</strong> is what you keep per sale: customer pays the price
          {data.fees.serviceChargePercent ? <> + {data.fees.serviceChargePercent}% service charge (added on the payment page only)</> : null},
          minus the {data.fees.gatewayFeePercent ?? 0}% payment gateway fee, minus the API price and the {data.fees.providerDepositFeePercent ?? 0}% fee for topping up the provider wallet.
          Change these in Settings → Payments.
        </div>
      )}

      {error && (
        <Card className="p-5 text-sm text-rose-700 dark:text-rose-400">
          Couldn't load bundles: {error.message}
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative md:w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" strokeWidth={2} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search bundles..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1976d2] focus:border-[#1976d2]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <label htmlFor="bundle-network" className="sr-only">Network</label>
            <select
              id="bundle-network"
              value={network}
              onChange={(e) => { setNetwork(e.target.value); setPage(1); }}
              className="mr-1 px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-800 font-semibold"
            >
              <option value="all">All networks</option>
              {NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            {(['all', 'visible', 'hidden', 'disabled'] as VisibilityFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-md font-semibold transition-colors',
                  filter === f
                    ? 'bg-[#1976d2] text-white'
                    : 'text-slate-700 hover:bg-slate-100',
                )}
              >
                {f === 'all'
                  ? `All (${allBundles.length})`
                  : f === 'visible'
                    ? `On sale (${allBundles.filter((b) => b.availableToCustomers).length})`
                    : f === 'hidden'
                      ? `Hidden (${allBundles.filter((b) => !b.availableToCustomers && b.active).length})`
                      : `Disabled (${allBundles.filter((b) => !b.active).length})`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package
              className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3"
              strokeWidth={1.5}
            />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {allBundles.length === 0 ? 'No bundles synced yet' : 'No matching bundles'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {allBundles.length === 0
                ? 'Click "Sync from provider" to pull the catalog.'
                : 'Adjust your search or filter.'}
            </p>
          </div>
        ) : (
          <TableScroll>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-5 whitespace-nowrap">Bundle</th>
                  <th className="py-3 px-4 whitespace-nowrap">Network</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Cost (API)</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Sell</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Provider guest</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Profit / sale</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">On sale</th>
                  <th className="py-3 px-5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pageItems.map((b) => {
                  const margin = b.profitGhs ?? b.sellPriceGhs - b.providerCostGhs;
                  const pct = b.profitPercent ?? (b.sellPriceGhs > 0 ? (margin / b.sellPriceGhs) * 100 : 0);
                  const busy = busyIds.has(b.id);
                  return (
                    <tr
                      key={b.id}
                      className={cn(
                        'transition-colors hover:bg-slate-50',
                        !b.active && 'opacity-60',
                      )}
                    >
                      <td className="py-3 px-5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {b.label}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {b.id}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        {netKey(b.network)}
                        <div className="text-[10px] text-slate-600">
                          {b.size}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-800 tabular-nums">
                        GHS {b.providerCostGhs.toFixed(2)}
                        {b.totalCostGhs != null && (
                          <div className="text-[10px] text-slate-600" title="Including the provider wallet top-up fee">
                            {b.totalCostGhs.toFixed(2)} with fee
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        GHS {b.sellPriceGhs.toFixed(2)}
                        {b.guestPriceGhs != null && b.sellPriceGhs > b.guestPriceGhs && (
                          <div className="text-[10px] font-semibold text-rose-600" title="Customers could buy it cheaper directly from the provider.">
                            above retail
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700 tabular-nums">
                        {b.guestPriceGhs != null ? `GHS ${b.guestPriceGhs.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        <span
                          className={cn(
                            'font-semibold',
                            margin <= 0
                              ? 'text-rose-700'
                              : pct >= 5
                                ? 'text-emerald-700'
                                : 'text-amber-700',
                          )}
                          title={b.chargedGhs != null ? `Customer pays GHS ${b.chargedGhs.toFixed(2)} at checkout; gateway keeps GHS ${(b.gatewayFeeGhs ?? 0).toFixed(2)}; cost with top-up fee GHS ${(b.totalCostGhs ?? b.providerCostGhs).toFixed(2)}.` : undefined}
                        >
                          GHS {margin.toFixed(2)}
                        </span>
                        <div className="text-[10px] text-slate-600 mt-0.5">
                          {margin <= 0 ? 'loss' : `${pct.toFixed(1)}% of price`}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleAvailability(b)}
                          disabled={busy}
                          className={cn(
                            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50',
                            b.availableToCustomers
                              ? 'bg-emerald-500'
                              : 'bg-slate-300 dark:bg-slate-700',
                          )}
                          aria-label={b.availableToCustomers ? 'Hide from customers' : 'Show to customers'}
                        >
                          <span
                            className={cn(
                              'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                              b.availableToCustomers
                                ? 'translate-x-[18px]'
                                : 'translate-x-[3px]',
                            )}
                          />
                        </button>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditing(b)}
                            disabled={busy}
                            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#1976d2] disabled:opacity-50"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteBundle(b)}
                            disabled={busy}
                            className="p-1.5 rounded-md text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 disabled:opacity-50"
                            title="Remove from catalog"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        )}

        {filtered.length > 0 && (
          <Pagination
            page={safePage}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
            label="bundles"
          />
        )}
      </Card>

      {editing && (
        <EditBundleModal
          bundle={editing}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}

      {markupModal && (
        <GlobalMarkupModal
          initial={data?.markupPercent ?? 10}
          onClose={() => setMarkupModal(false)}
          onSaved={async () => {
            await reload();
            setMarkupModal(false);
          }}
        />
      )}
    </main>
  );
}

function GlobalMarkupModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: number;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [markup, setMarkup] = useState(String(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const value = parseFloat(markup);
    if (Number.isNaN(value) || value < 0 || value > 200) {
      setError('Markup must be between 0 and 200%.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch<{ ok: true; markupPercent: number; updated: number }>(
        '/admin/providers/data/markup',
        {
          method: 'PUT',
          body: JSON.stringify({ markupPercent: value }),
        },
      );
      setResult(
        `Applied ${res.markupPercent}% markup. Updated ${res.updated} bundle${res.updated === 1 ? '' : 's'}.`,
      );
      await onSaved();
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Set global markup
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Recomputes every active bundle's sell price as
            <span className="font-mono"> cost × (1 + markup%)</span>, rounded up to the nearest 0.10 GHS.
            Any manual price overrides will be overwritten.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Markup (%)
            </label>
            <input
              type="number"
              min="0"
              max="200"
              step="1"
              value={markup}
              onChange={(e) => setMarkup(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 tabular-nums"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {result && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
              {result}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#1976d2] hover:bg-[#155cd0] disabled:opacity-60 text-white text-xs font-semibold shadow-xs transition"
            >
              {saving ? 'Applying…' : 'Apply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}