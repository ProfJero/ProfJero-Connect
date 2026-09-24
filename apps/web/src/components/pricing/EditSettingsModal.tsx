import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { apiFetch, ApiError } from '../../lib/api';
import type { PricingSettings } from '@profjero/shared';

interface Props {
  open: boolean;
  service: string;
  settings: PricingSettings;
  onClose: () => void;
  onSaved: () => void;
}

export function EditSettingsModal({
  open,
  service,
  settings,
  onClose,
  onSaved,
}: Props) {
  const [unitPriceGhs, setUnitPriceGhs] = useState('');
  const [minPurchaseUnits, setMinPurchaseUnits] = useState('');
  const [maxPurchaseUnits, setMaxPurchaseUnits] = useState('');
  const [active, setActive] = useState(settings.active);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setUnitPriceGhs(
      settings.unitPriceGhs !== null ? String(settings.unitPriceGhs) : '',
    );
    setMinPurchaseUnits(
      settings.minPurchaseUnits !== null
        ? String(settings.minPurchaseUnits)
        : '',
    );
    setMaxPurchaseUnits(
      settings.maxPurchaseUnits !== null
        ? String(settings.maxPurchaseUnits)
        : '',
    );
    setActive(settings.active);
    setError(null);
    setSubmitting(false);
  }, [open, settings]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    let unitPrice: number | null = null;
    if (unitPriceGhs.trim()) {
      const n = Number(unitPriceGhs);
      if (!Number.isFinite(n) || n < 0) {
        setError('Unit price must be a non-negative number.');
        return;
      }
      unitPrice = n;
    }

    let minUnits: number | null = null;
    if (minPurchaseUnits.trim()) {
      const n = Number(minPurchaseUnits);
      if (!Number.isInteger(n) || n < 0) {
        setError('Minimum purchase must be a non-negative integer.');
        return;
      }
      minUnits = n;
    }

    let maxUnits: number | null = null;
    if (maxPurchaseUnits.trim()) {
      const n = Number(maxPurchaseUnits);
      if (!Number.isInteger(n) || n < 0) {
        setError('Maximum purchase must be a non-negative integer.');
        return;
      }
      if (minUnits !== null && n < minUnits) {
        setError('Maximum purchase must be greater than or equal to minimum.');
        return;
      }
      maxUnits = n;
    }

    setSubmitting(true);
    try {
      await apiFetch(`/admin/pricing/${service}`, {
        method: 'PUT',
        body: JSON.stringify({
          unitPriceGhs: unitPrice,
          minPurchaseUnits: minUnits,
          maxPurchaseUnits: maxUnits,
          active,
        }),
      });
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Save failed.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Edit unit rate"
      onClose={handleClose}
      locked={submitting}
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          The reference price for arbitrary purchases. Packages can offer
          discounts on top of this.
        </p>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Price per unit (GHS)
          </label>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={unitPriceGhs}
            onChange={(e) => setUnitPriceGhs(e.target.value)}
            placeholder="e.g. 0.05 — leave empty to hide custom purchases"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Min purchase (units)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={minPurchaseUnits}
              onChange={(e) => setMinPurchaseUnits(e.target.value)}
              placeholder="e.g. 500"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Max purchase (units)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={maxPurchaseUnits}
              onChange={(e) => setMaxPurchaseUnits(e.target.value)}
              placeholder="Leave empty for no limit"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
            />
          </div>
        </div>

        <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#1976d2] focus:ring-[#1976d2]"
          />
          <span className="text-[11px] text-slate-600 leading-relaxed">
            Show this service's pricing to clients via the public pricing
            endpoint. Uncheck to hide it while you configure it.
          </span>
        </label>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-[#1976d2] hover:bg-blue-600 text-white text-xs font-medium disabled:opacity-60 transition min-w-[100px]"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}