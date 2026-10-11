import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, RefreshCw, Loader2, Save, X, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { TableScroll } from '../../components/ui/TableScroll';
import { useApi } from '../../lib/useApi';
import { apiFetch } from '../../lib/api';
import { cn } from '../../lib/utils';

interface DataBundle {
  id: string;
  network: string;
  size: string;
  label: string;
  providerCostGhs: number;
  sellPriceGhs: number;
  markupPercent: number;
  availableToCustomers: boolean;
  active: boolean;
  displayOrder: number;
  syncedAt: string;
}

interface BundlesResponse {
  ok: true;
  bundles: DataBundle[];
  count: number;
}

interface SyncResponse {
  ok: true;
  summary: { total: number; created: number; updated: number; deactivated: number };
}

const fmtGhs = (n: number) => `GHS ${n.toFixed(2)}`;

export function DataBundlesPage() {
  const { data, loading, error, reload } = useApi<BundlesResponse>(
    '/admin/providers/data/bundles',
  );
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
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
      setSyncMsg(
        err instanceof Error ? `Sync failed: ${err.message}` : 'Sync failed.',
      );
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

  const bundles = data?.bundles ?? [];
  const availableCount = bundles.filter((b) => b.availableToCustomers).length;

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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {bundles.length} bundles synced · {availableCount} visible to customers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/providers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
            Providers
          </Link>
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

      {error && (
        <Card className="p-5 text-sm text-rose-700 dark:text-rose-400">
          Couldn't load bundles: {error.message}
        </Card>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : bundles.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No bundles synced yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Click "Sync from provider" to pull the catalog.
            </p>
          </div>
        ) : (
          <TableScroll>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/60 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-5 whitespace-nowrap">Bundle</th>
                  <th className="py-3 px-4 whitespace-nowrap">Network</th>
                  <th className="py-3 px-4 whitespace-nowrap">Size</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Cost</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Sell</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Margin</th>
                  <th className="py-3 px-5 text-center whitespace-nowrap">Visible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bundles.map((b) => (
                  <BundleRow
                    key={b.id}
                    bundle={b}
                    busy={busyIds.has(b.id)}
                    onToggleAvailability={() => toggleAvailability(b)}
                    onPriceSaved={() => reload()}
                    markBusy={(busy) => markBusy(b.id, busy)}
                  />
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Card>
    </main>
  );
}

function BundleRow({
  bundle,
  busy,
  onToggleAvailability,
  onPriceSaved,
  markBusy,
}: {
  bundle: DataBundle;
  busy: boolean;
  onToggleAvailability: () => void;
  onPriceSaved: () => Promise<void> | void;
  markBusy: (busy: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [priceInput, setPriceInput] = useState(bundle.sellPriceGhs.toFixed(2));
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const marginGhs = bundle.sellPriceGhs - bundle.providerCostGhs;
  const marginPct = bundle.providerCostGhs > 0
    ? (marginGhs / bundle.providerCostGhs) * 100
    : 0;

  const savePrice = async () => {
    const value = parseFloat(priceInput);
    if (Number.isNaN(value) || value <= 0) {
      setSaveErr('Enter a positive number.');
      return;
    }
    setSaveErr(null);
    markBusy(true);
    try {
      await apiFetch(
        `/admin/providers/data/bundles/${encodeURIComponent(bundle.id)}/price`,
        {
          method: 'PUT',
          body: JSON.stringify({ sellPriceGhs: value }),
        },
      );
      await onPriceSaved();
      setEditing(false);
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      markBusy(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setPriceInput(bundle.sellPriceGhs.toFixed(2));
    setSaveErr(null);
  };

  return (
    <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
      <td className="py-3 px-5">
        <div className="font-semibold text-slate-900 dark:text-slate-100">
          {bundle.label}
        </div>
        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
          {bundle.id}
        </div>
      </td>
      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{bundle.network}</td>
      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{bundle.size}</td>
      <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300 tabular-nums">
        {fmtGhs(bundle.providerCostGhs)}
      </td>
      <td className="py-3 px-4 text-right tabular-nums">
        {editing ? (
          <div className="flex items-center justify-end gap-1.5">
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="w-24 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-right"
              autoFocus
            />
            <button
              onClick={savePrice}
              disabled={busy}
              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-50"
              title="Save"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={cancelEdit}
              disabled={busy}
              className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="font-semibold text-slate-900 dark:text-slate-100 hover:text-[#1976d2] dark:hover:text-blue-400 underline-offset-2 hover:underline"
            title="Click to edit"
          >
            {fmtGhs(bundle.sellPriceGhs)}
          </button>
        )}
        {saveErr && (
          <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1">
            {saveErr}
          </div>
        )}
      </td>
      <td className="py-3 px-4 text-right tabular-nums">
        <span className={cn(
          'font-semibold',
          marginPct >= 20
            ? 'text-emerald-600 dark:text-emerald-400'
            : marginPct >= 10
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-rose-600 dark:text-rose-400',
        )}>
          {fmtGhs(marginGhs)}
        </span>
        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
          {marginPct.toFixed(1)}%
        </div>
      </td>
      <td className="py-3 px-5 text-center">
        <button
          onClick={onToggleAvailability}
          disabled={busy}
          className={cn(
            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50',
            bundle.availableToCustomers ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700',
          )}
          aria-label={bundle.availableToCustomers ? 'Hide from customers' : 'Show to customers'}
        >
          <span
            className={cn(
              'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
              bundle.availableToCustomers ? 'translate-x-[18px]' : 'translate-x-[3px]',
            )}
          />
        </button>
      </td>
    </tr>
  );
}