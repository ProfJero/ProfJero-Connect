import { useState } from 'react';
import {
  X,
  Users,
  CreditCard,
  Package,
  Flag,
  Hash,
  Calendar,
  Clock,
  Info,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { splitDateTime } from '../../lib/datetime';
import { apiFetch, ApiError } from '../../lib/api';
import type { Payment, PaymentStatus } from '@profjero/shared';

const STATUS_STYLES: Record<PaymentStatus, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  abandoned: 'bg-slate-100 text-slate-600 border-slate-200',
  refunded: 'bg-purple-50 text-purple-700 border-purple-200',
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  success: 'Successful',
  pending: 'Pending',
  failed: 'Failed',
  abandoned: 'Abandoned',
  refunded: 'Refunded',
};

function AttrRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Users;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2 text-slate-500 shrink-0">
        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
        <span>{label}</span>
      </div>
      <div className="text-right min-w-0">{children}</div>
    </div>
  );
}

function formatGhs(pesewas: number): string {
  return `GHS ${(pesewas / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface Props {
  payment: Payment | null;
  projectName: string;
  onClose: () => void;
  onChanged: () => void;
}

export function PaymentDetailsInspector({
  payment,
  projectName,
  onClose,
  onChanged,
}: Props) {
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  if (!payment) return null;

  const created = splitDateTime(payment.createdAt);
  const paidAt = payment.paidAt ? splitDateTime(payment.paidAt) : null;
  const creditedAt = payment.walletCreditedAt
    ? splitDateTime(payment.walletCreditedAt)
    : null;

  const canVerify = payment.status === 'pending' && !payment.walletCreditedAt;

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyError(null);
    try {
      await apiFetch(`/admin/payments/${payment.reference}/verify`, {
        method: 'POST',
        body: '{}',
      });
      onChanged();
    } catch (err) {
      setVerifyError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Verification failed.',
      );
    } finally {
      setVerifying(false);
    }
  };

  return (
    <aside
      className="w-full xl:w-[380px] bg-white border border-slate-200/90 rounded-xl flex flex-col shrink-0 max-h-[calc(100vh-160px)] xl:sticky xl:top-4"
      data-purpose="payment-details-inspector"
    >
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <h3 className="font-bold text-slate-800 text-sm">Payment Details</h3>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          aria-label="Close inspector"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>

      <div className="p-5 space-y-5 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1976d2] flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" strokeWidth={2} />
            </div>
            <p
              className="font-mono text-[11px] font-bold text-slate-800 leading-tight break-all"
              title={payment.reference}
            >
              {payment.reference}
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
              STATUS_STYLES[payment.status],
            )}
          >
            {STATUS_LABELS[payment.status]}
          </span>
        </div>

        {/* Verify action */}
        {canVerify && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" strokeWidth={2} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-amber-900">
                  Awaiting confirmation
                </div>
                <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                  If the customer has paid, click Verify to check with Paystack
                  and credit the wallet.
                </p>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold disabled:opacity-50 transition"
                >
                  <RefreshCw
                    className={cn('w-3 h-3', verifying && 'animate-spin')}
                    strokeWidth={2.5}
                  />
                  {verifying ? 'Verifying…' : 'Verify now'}
                </button>
                {verifyError && (
                  <p className="mt-1.5 text-[11px] text-rose-700">{verifyError}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Attributes */}
        <div className="space-y-3 text-xs">
          <AttrRow icon={Users} label="Project">
            <p className="font-bold text-slate-800">{projectName}</p>
          </AttrRow>

          <AttrRow icon={Users} label="Customer">
            <p className="font-medium text-slate-700 break-all">
              {payment.customerEmail ?? '—'}
            </p>
          </AttrRow>

          <AttrRow icon={CreditCard} label="Amount">
            <p className="font-bold text-slate-900 text-sm">
              {formatGhs(payment.amountPesewas)} {payment.currency}
            </p>
          </AttrRow>

          <AttrRow icon={Package} label="Units">
            <p className="font-semibold text-slate-800">
              {payment.units.toLocaleString()} units
            </p>
          </AttrRow>

          <AttrRow icon={Flag} label="Provider">
            <p className="font-semibold text-slate-800 capitalize">
              {payment.provider}
            </p>
          </AttrRow>

          <AttrRow icon={Hash} label="Package">
            <p className="font-mono text-[11px] text-slate-600 break-all">
              {payment.packageId ?? 'Custom amount'}
            </p>
          </AttrRow>

          <AttrRow icon={Calendar} label="Created">
            <p className="font-medium text-slate-700 text-[11px]">
              {created.date} {created.time}
            </p>
          </AttrRow>

          {paidAt && (
            <AttrRow icon={Calendar} label="Paid">
              <p className="font-medium text-slate-700 text-[11px]">
                {paidAt.date} {paidAt.time}
              </p>
            </AttrRow>
          )}
        </div>

        {/* Verification cards */}
        <div className="space-y-2.5 pt-1">
          <StatusCard
            title="Payment Verification"
            done={payment.status === 'success'}
            doneLabel="Verified"
            pendingLabel="Pending"
            description={
              payment.status === 'success'
                ? 'Payment confirmed by gateway.'
                : payment.status === 'failed'
                  ? payment.failureReason ?? 'Payment failed at the gateway.'
                  : 'Waiting for gateway confirmation.'
            }
          />
          <StatusCard
            title="Unit Crediting"
            done={!!payment.walletCreditedAt}
            doneLabel="Credited"
            pendingLabel="Not yet"
            description={
              creditedAt
                ? `Credited on ${creditedAt.date} at ${creditedAt.time}.`
                : 'Units will be credited once payment is verified.'
            }
            reference={payment.walletTransactionId}
          />
        </div>

        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 flex gap-2.5 items-start">
          <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-2.5 h-2.5" strokeWidth={2.5} />
          </div>
          <p className="text-[11px] text-blue-900 leading-snug">
            <span className="font-bold">Note:</span> Payment verification and
            unit crediting are separate. A successful payment should normally
            credit within seconds; if not, use Verify now.
          </p>
        </div>
      </div>
    </aside>
  );
}

function StatusCard({
  title,
  done,
  doneLabel,
  pendingLabel,
  description,
  reference,
}: {
  title: string;
  done: boolean;
  doneLabel: string;
  pendingLabel: string;
  description: string;
  reference?: string | null;
}) {
  return (
    <div
      className={cn(
        'rounded-lg p-3 border',
        done
          ? 'bg-emerald-50/60 border-emerald-200'
          : 'bg-slate-50/80 border-slate-200',
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          {done ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700" strokeWidth={2} />
          ) : (
            <Clock className="w-4 h-4 text-slate-500" strokeWidth={2} />
          )}
          <span>{title}</span>
        </div>
        <span
          className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold',
            done
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-200 text-slate-600',
          )}
        >
          {done ? doneLabel : pendingLabel}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>
      {reference && (
        <p className="mt-1 font-mono text-[10px] text-slate-500 break-all">
          {reference}
        </p>
      )}
    </div>
  );
}