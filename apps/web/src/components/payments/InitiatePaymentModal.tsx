import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { apiFetch, ApiError } from '../../lib/api';
import { cn } from '../../lib/utils';
import type {
  InitiatePaymentResponse,
  Package,
  ProjectListResponse,
  PricingResponse,
} from '@profjero/shared';

interface Props {
  open: boolean;
  projects: ProjectListResponse['projects'];
  onClose: () => void;
  onInitiated: (response: InitiatePaymentResponse) => void;
}

type PurchaseMode = 'package' | 'custom';

export function InitiatePaymentModal({
  open,
  projects,
  onClose,
  onInitiated,
}: Props) {
  const [projectId, setProjectId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [mode, setMode] = useState<PurchaseMode>('package');
  const [packageId, setPackageId] = useState('');
  const [units, setUnits] = useState('');
  const [amountGhs, setAmountGhs] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);

  // Load packages once on open.
  useEffect(() => {
    if (!open) return;
    setProjectId(projects[0]?.id ?? '');
    setCustomerEmail('');
    setMode('package');
    setPackageId('');
    setUnits('');
    setAmountGhs('');
    setError(null);
    setSubmitting(false);
  }, [open, projects]);

  useEffect(() => {
    if (!open || packages.length > 0 || packagesLoading) return;
    setPackagesLoading(true);
    apiFetch<PricingResponse>('/admin/pricing/sms')
      .then((resp) => {
        const active = resp.pricing.packages.filter((p) => p.active);
        setPackages(active);
        if (active.length > 0) setPackageId(active[0].id);
      })
      .catch(() => {
        // Fall back to custom mode if packages can't be loaded.
        setMode('custom');
      })
      .finally(() => setPackagesLoading(false));
  }, [open, packages.length, packagesLoading]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!projectId) {
      setError('Select a project.');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setError('Enter a valid customer email.');
      return;
    }

    let body: Record<string, unknown> = {
      projectId,
      customerEmail: customerEmail.trim(),
    };

    if (mode === 'package') {
      if (!packageId) {
        setError('Select a package.');
        return;
      }
      body.packageId = packageId;
    } else {
      const u = Number(units);
      const a = Number(amountGhs);
      if (!Number.isInteger(u) || u <= 0) {
        setError('Units must be a positive whole number.');
        return;
      }
      if (!Number.isFinite(a) || a <= 0) {
        setError('Amount must be a positive number.');
        return;
      }
      body.units = u;
      body.amountPesewas = Math.round(a * 100);
    }

    setSubmitting(true);
    try {
      const resp = await apiFetch<InitiatePaymentResponse>(
        '/admin/payments/initiate',
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      );
      onInitiated(resp);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Initiation failed.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const activePackages = packages;
  const hasPackages = activePackages.length > 0;

  return (
    <Modal
      open={open}
      title="Initiate Payment"
      onClose={handleClose}
      locked={submitting}
    >
      <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Create a Paystack payment link for a customer. Send them the URL
          and the wallet will credit automatically once they pay.
        </p>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Project <span className="text-rose-500">*</span>
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20 cursor-pointer"
          >
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Customer email <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="customer@example.com"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Paystack sends the receipt here.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Purchase type
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setMode('package')}
              disabled={!hasPackages}
              className={cn(
                'py-2 px-3 rounded-lg text-xs font-semibold border transition',
                mode === 'package'
                  ? 'bg-[#1976d2] border-[#1976d2] text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed',
              )}
            >
              Package
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={cn(
                'py-2 px-3 rounded-lg text-xs font-semibold border transition',
                mode === 'custom'
                  ? 'bg-[#1976d2] border-[#1976d2] text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
              )}
            >
              Custom amount
            </button>
          </div>
        </div>

        {mode === 'package' ? (
          packagesLoading ? (
            <div className="h-11 bg-slate-100 rounded-lg animate-pulse" />
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Package <span className="text-rose-500">*</span>
              </label>
              <select
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20 cursor-pointer"
              >
                {activePackages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.units.toLocaleString()} units / GHS{' '}
                    {p.priceGhs.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          )
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Units <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="1000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Amount (GHS) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={amountGhs}
                onChange={(e) => setAmountGhs(e.target.value)}
                placeholder="50.00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1976d2] focus:ring-2 focus:ring-[#1976d2]/20"
              />
            </div>
          </div>
        )}

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
            className="px-4 py-2 rounded-lg bg-[#1976d2] hover:bg-blue-600 text-white text-xs font-medium disabled:opacity-60 transition min-w-[140px]"
          >
            {submitting ? 'Creating…' : 'Create payment link'}
          </button>
        </div>
      </form>
    </Modal>
  );
}