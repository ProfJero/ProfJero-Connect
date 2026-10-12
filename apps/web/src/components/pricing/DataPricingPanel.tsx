import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Loader2, Percent, Wifi } from 'lucide-react';
import { Card } from '../ui/Card';
import { useApi } from '../../lib/useApi';
import { apiFetch } from '../../lib/api';
import { cn } from '../../lib/utils';

interface Bundle {
  id: string;
  network: string;
  size: string;
  label: string;
  providerCostGhs: number;
  sellPriceGhs: number;
  markupPercent: number;
  guestPriceGhs?: number | null;
  availableToCustomers: boolean;
  active: boolean;
}

const ghs = (n: number) => `GH₵${n.toFixed(2)}`;

/**
 * Data bundle pricing at a glance: one markup for the whole catalogue,
 * per-network summary, and every bundle priced above the provider's own
 * retail price flagged (customers would buy direct instead).
 */
export function DataPricingPanel() {
  const { data, loading, error, reload } = useApi<{ bundles: Bundle[]; markupPercent: number }>('/admin/providers/data/bundles');
  const [markup, setMarkup] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const bundles = (data?.bundles ?? []).filter((b) => b.active);
  const onSale = bundles.filter((b) => b.availableToCustomers);
  const aboveRetail = bundles.filter((b) => b.guestPriceGhs != null && b.sellPriceGhs > b.guestPriceGhs);
  const networks = [...new Set(bundles.map((b) => b.network))];
  const current = data?.markupPercent ?? 10;
  const value = markup === '' ? String(current) : markup;
  const preview = (cost: number) => Math.ceil(Math.round(cost * (1 + Number(value) / 100) * 100 * 1e6) / 1e6 / 10) / 10;

  const apply = async () => {
    const pct = Number(value);
    if (!Number.isFinite(pct) || pct < 0 || pct > 200) return;
    if (!window.confirm(`Re-price every active bundle at cost + ${pct}%?`)) return;
    setSaving(true);
    setNote(null);
    try {
      const res = await apiFetch<{ updated: number }>('/admin/providers/data/markup', { method: 'PUT', body: JSON.stringify({ markupPercent: pct }) });
      setNote({ ok: true, text: `${res.updated} bundle${res.updated === 1 ? '' : 's'} re-priced at ${pct}%.` });
      setMarkup('');
      reload();
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : 'Could not save.' });
    } finally {
      setSaving(false);
    }
  };

  if (error && !data) {
    return (
      <Card className="p-6 text-sm text-rose-700">
        Could not load data bundles: {error.message}{' '}
        <button type="button" onClick={reload} className="underline font-semibold">Retry</button>
      </Card>
    );
  }
  if (loading && !data) return <div className="h-64 bg-white rounded-xl border border-slate-200/80 animate-pulse" />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-slate-900">Markup on data bundles</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sell price = our API cost + markup, rounded up to the next 10 pesewas. Newly synced bundles use this markup;
                your edited prices are kept on every sync unless our cost changes.
              </p>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="text-xs font-semibold text-slate-700">
                  Markup (%)
                  <input
                    type="number"
                    min={0}
                    max={200}
                    step={1}
                    value={value}
                    onChange={(e) => setMarkup(e.target.value)}
                    className="mt-1 block w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={apply}
                  disabled={saving || Number(value) === current && markup === ''}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#1976d2] hover:bg-[#1565c0] text-white text-xs font-semibold disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Apply to all bundles
                </button>
                <span className="text-xs text-slate-500">
                  e.g. MTN 1GB (cost GH₵4.00) → <strong className="text-slate-800">{ghs(preview(4))}</strong> · provider retail GH₵4.70
                </span>
              </div>
              {note && <p role="status" className={cn('mt-3 text-xs font-medium', note.ok ? 'text-emerald-700' : 'text-rose-700')}>{note.text}</p>}
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><Wifi className="w-4 h-4 text-emerald-700" /> Catalogue</div>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between"><dt className="text-slate-500">Active bundles</dt><dd className="font-semibold">{bundles.length}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">On sale to customers</dt><dd className="font-semibold">{onSale.length}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Networks</dt><dd className="font-semibold">{networks.join(', ') || '—'}</dd></div>
          </dl>
          <Link to="/providers/data/bundles" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1976d2] hover:underline">
            Manage bundles <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>
      </div>

      {aboveRetail.length > 0 && (
        <div role="alert" className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>{aboveRetail.length} bundle{aboveRetail.length === 1 ? ' is' : 's are'} priced above the provider's own retail price</strong> —
            customers could buy {aboveRetail.length === 1 ? 'it' : 'them'} cheaper directly: {aboveRetail.slice(0, 6).map((b) => `${b.network} ${b.size}`).join(', ')}
            {aboveRetail.length > 6 ? '…' : ''}. Lower the markup or edit those prices.
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 text-sm font-bold text-slate-900">Prices by network</div>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Data prices">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-semibold">Bundle</th>
                <th scope="col" className="px-4 py-2.5 font-semibold text-right">Our cost</th>
                <th scope="col" className="px-4 py-2.5 font-semibold text-right">We sell</th>
                <th scope="col" className="px-4 py-2.5 font-semibold text-right">Provider retail</th>
                <th scope="col" className="px-4 py-2.5 font-semibold text-right">Margin</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">On sale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bundles.map((b) => {
                const over = b.guestPriceGhs != null && b.sellPriceGhs > b.guestPriceGhs;
                return (
                  <tr key={b.id}>
                    <td className="px-5 py-2.5 font-medium text-slate-800">{b.network} {b.size}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{ghs(b.providerCostGhs)}</td>
                    <td className={cn('px-4 py-2.5 text-right tabular-nums font-semibold', over ? 'text-rose-700' : 'text-slate-900')}>{ghs(b.sellPriceGhs)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{b.guestPriceGhs != null ? ghs(b.guestPriceGhs) : '—'}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">{ghs(b.sellPriceGhs - b.providerCostGhs)}</td>
                    <td className="px-4 py-2.5">{b.availableToCustomers ? 'Yes' : <span className="text-slate-500">Hidden</span>}</td>
                  </tr>
                );
              })}
              {bundles.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">No bundles yet. Sync the catalogue from Data Bundles.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
