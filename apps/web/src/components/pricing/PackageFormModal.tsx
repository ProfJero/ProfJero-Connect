import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { apiFetch, ApiError } from '../../lib/api';
import type { Package } from '@profjero/shared';

interface Props {
  open: boolean;
  service: string;
  /** null = create mode; Package = edit mode */
  existing: Package | null;
  onClose: () => void;
  onSaved: () => void;
}

export function PackageFormModal({
  open,
  service,
  existing,
  onClose,
  onSaved,
}: Props) {
  const isEdit = existing !== null;

  const [name, setName] = useState('');
  const [units, setUnits] = useState('');
  const [priceGhs, setPriceGhs] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(existing?.name ?? '');
    setUnits(existing ? String(existing.units) : '');
    setPriceGhs(existing ? String(existing.priceGhs) : '');
    setDescription(existing?.description ?? '');
    setActive(existing?.active ?? true);
    setDisplayOrder(existing ? String(existing.displayOrder) : '0');
    setError(null);
    setSubmitting(false);
  }, [open, existing]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  // Live effective rate preview
  const unitsNum = Number(units);
  const priceNum = Number(priceGhs);
  const effectiveRate =
    unitsNum > 0 && priceNum > 0
      ? (priceNum / unitsNum).toFixed(4)
      : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }
    const u = Number(units);
    if (!Number.isInteger(u) || u <= 0) {
      setError('Units must be a positive whole number.');
      return;
    }
    const p = Number(priceGhs);
    if (!Number.isFinite(p) || p <= 0) {
      setError('Price must be a positive number.');
      return;
    }
    const order = Number(displayOrder);
    if (!Number.isInteger(order) || order < 0) {
      setError('Display order must be a non-negative integer.');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        name: trimmedName,
        units: u,
        priceGhs: p,
        description: description.trim() || null,
        active,
        displayOrder: order,
      };

      if (isEdit && existing) {
        await apiFetch(`/admin/pricing/packages/${existing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch(`/admin/pricing/${service}/packages`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
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
      title={isEdit ? 'Edit package' : 'Add package'}
      onClose={handleClose}
      locked={submitting}
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Starter"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Units <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              placeholder="500"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Price (GHS) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={priceGhs}
              onChange={(e) => setPriceGhs(e.target.value)}
              placeholder="20.00"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
            />
          </div>
        </div>

        {effectiveRate && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-[11px] text-blue-800">
            <span className="font-semibold">Effective rate:</span> GHS{' '}
            {effectiveRate} per unit
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Description (optional)
          </label>
          <input
            type="text"
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Ideal for small campaigns"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Display order
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Lower numbers appear first.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              &nbsp;
            </label>
            <label className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#1976d2] focus:ring-[#1976d2]"
              />
              <span className="text-[11px] text-slate-600">Active</span>
            </label>
          </div>
        </div>

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
            {submitting ? 'Saving…' : isEdit ? 'Save' : 'Add package'}
          </button>
        </div>
      </form>
    </Modal>
  );
}