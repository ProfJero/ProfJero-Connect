import { useState, type FormEvent } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { cn } from '../../lib/utils';

export interface EditableBundle {
  id: string;
  label: string;
  network: string;
  size: string;
  providerCostGhs: number;
  sellPriceGhs: number;
  markupPercent: number;
  /** Provider's public guest price, when known — stay at or below it. */
  guestPriceGhs?: number | null;
  availableToCustomers: boolean;
  active: boolean;
  displayOrder: number;
}

export function EditBundleModal({
  bundle,
  onClose,
  onSaved,
}: {
  bundle: EditableBundle;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [label, setLabel] = useState(bundle.label);
  const [sellPrice, setSellPrice] = useState(bundle.sellPriceGhs.toFixed(2));
  const [displayOrder, setDisplayOrder] = useState(String(bundle.displayOrder));
  const [available, setAvailable] = useState(bundle.availableToCustomers);
  const [active, setActive] = useState(bundle.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const costPreview = (() => {
    const value = parseFloat(sellPrice);
    if (Number.isNaN(value) || value <= 0) return null;
    const margin = value - bundle.providerCostGhs;
    const pct = bundle.providerCostGhs > 0 ? (margin / bundle.providerCostGhs) * 100 : 0;
    return { margin, pct };
  })();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const price = parseFloat(sellPrice);
    if (Number.isNaN(price) || price <= 0) {
      setError('Sell price must be a positive number.');
      return;
    }
    const order = parseInt(displayOrder, 10);
    if (Number.isNaN(order) || order < 0) {
      setError('Display order must be a non-negative integer.');
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/admin/providers/data/bundles/${encodeURIComponent(bundle.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          label: label.trim(),
          sellPriceGhs: price,
          displayOrder: order,
          availableToCustomers: available,
          active,
        }),
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
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
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Edit bundle
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="font-mono">{bundle.id}</span>
            <span className="mx-2">·</span>
            <span>{bundle.network}</span>
            <span className="mx-2">·</span>
            <span>{bundle.size}</span>
            <span className="mx-2">·</span>
            <span>cost GHS {bundle.providerCostGhs.toFixed(2)}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Display label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              maxLength={120}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Sell price (GHS)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Display order
              </label>
              <input
                type="number"
                min="0"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 tabular-nums"
              />
              <p className="text-[10px] text-slate-400 mt-1">Lower = earlier in the customer list.</p>
            </div>
          </div>

          {costPreview && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-[11px] flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Margin</span>
              <span className={cn(
                'font-semibold',
                costPreview.pct >= 20
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : costPreview.pct >= 10
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400',
              )}>
                GHS {costPreview.margin.toFixed(2)} ({costPreview.pct.toFixed(1)}%)
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="w-4 h-4 text-[#1976d2] rounded"
              />
              Visible to customers
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 text-[#1976d2] rounded"
              />
              Active
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
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
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#1976d2] hover:bg-[#155cd0] disabled:opacity-60 text-white text-xs font-semibold shadow-xs transition"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}