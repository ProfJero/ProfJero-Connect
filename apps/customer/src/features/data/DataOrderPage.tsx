import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, CircleDashed, Clock, CreditCard, Loader2, RotateCcw, Send, Wifi, XCircle } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { formatDateTime, formatGhs, formatPhone } from '../../lib/format';
import { networkStyle } from '../../lib/services';
import { dataOrderStatus } from '../../lib/dataOrders';
import { cn } from '../../lib/utils';
import type { DataOrder } from '../../lib/types';

const FINAL = new Set(['delivered', 'refunded']);

/**
 * One data order, live. Used as the return page after checkout
 * (/services/data/complete?reference=…) and as the order detail page.
 * Polls quickly at first, then slows down; stops once the order is final.
 */
export function DataOrderPage() {
  const { orderId } = useParams();
  const [params] = useSearchParams();
  const id = orderId ?? params.get('reference') ?? params.get('trxref') ?? '';
  const [order, setOrder] = useState<DataOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let timer: number | undefined;
    started.current = Date.now();
    const tick = async () => {
      try {
        const res = await api.post<{ order: DataOrder }>(`/customer/data/orders/${encodeURIComponent(id)}/refresh`);
        if (cancelled) return;
        setOrder(res.order);
        setError(null);
        const done = FINAL.has(res.order.orderStatus) ||
          (res.order.orderStatus === 'pending_payment' && (res.order.paymentStatus === 'failed' || res.order.paymentStatus === 'abandoned'));
        if (done) return;
      } catch (err) {
        if (cancelled) return;
        setError(errorMessage(err));
      }
      const elapsed = Date.now() - started.current;
      timer = window.setTimeout(tick, elapsed < 120_000 ? 3000 : 15_000);
    };
    void tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [id]);

  if (!id) {
    return <Shell><p className="text-sm text-slate-600 dark:text-slate-300">No order was specified. <Link className="text-[#1764e0] dark:text-blue-400 font-semibold" to="/services/data/orders">See your orders</Link>.</p></Shell>;
  }
  if (!order) {
    return (
      <Shell>
        {error ? (
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
        ) : (
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> Checking your order…
          </div>
        )}
      </Shell>
    );
  }

  const status = dataOrderStatus(order);
  const paid = order.paymentStatus === 'paid';
  const sending = paid && (order.orderStatus === 'payment_confirmed' || order.orderStatus === 'processing');
  const delivered = order.orderStatus === 'delivered';
  const failedOrRefunded = order.orderStatus === 'failed' || order.orderStatus === 'refunded';
  const unpaidFinal = order.orderStatus === 'pending_payment' && (order.paymentStatus === 'failed' || order.paymentStatus === 'abandoned');

  const heading = delivered
    ? 'Data delivered'
    : order.orderStatus === 'refunded'
      ? 'Refunded'
      : order.orderStatus === 'failed'
        ? 'Not delivered'
        : unpaidFinal
          ? 'Payment not completed'
          : sending
            ? 'Sending your data…'
            : 'Waiting for payment…';

  const steps: Array<{ label: string; icon: typeof CreditCard; state: 'done' | 'active' | 'todo' | 'bad' }> = [
    { label: 'Payment', icon: CreditCard, state: paid ? 'done' : unpaidFinal ? 'bad' : 'active' },
    { label: 'Sending', icon: Send, state: delivered || failedOrRefunded ? (delivered ? 'done' : 'bad') : sending ? 'active' : 'todo' },
    { label: order.orderStatus === 'refunded' ? 'Refunded' : 'Delivered', icon: order.orderStatus === 'refunded' ? RotateCcw : Wifi, state: delivered || order.orderStatus === 'refunded' ? 'done' : 'todo' },
  ];

  return (
    <Shell>
      <div className="text-center">
        <span
          className={cn(
            'w-16 h-16 rounded-full mx-auto flex items-center justify-center',
            delivered ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
              : failedOrRefunded || unpaidFinal ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              : 'bg-blue-50 text-[#1764e0] dark:bg-blue-500/15 dark:text-blue-300',
          )}
        >
          {delivered ? <CheckCircle2 className="w-8 h-8" strokeWidth={2} />
            : failedOrRefunded || unpaidFinal ? <XCircle className="w-8 h-8" strokeWidth={2} />
            : <Loader2 className="w-8 h-8 animate-spin" strokeWidth={2} />}
        </span>
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">{heading}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {order.bundleLabel} to <span className="font-mono font-semibold">{formatPhone(order.recipientNumber)}</span>
        </p>
        {order.message && <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">{order.message}</p>}
        {sending && !order.message && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Most bundles arrive within a minute. You can leave this page — we'll notify you.</p>
        )}
      </div>

      <ol className="mt-7 grid grid-cols-3 gap-2" aria-label="Order progress">
        {steps.map((s) => {
          const Icon = s.state === 'done' ? CheckCircle2 : s.state === 'active' ? Clock : s.state === 'bad' ? XCircle : CircleDashed;
          return (
            <li key={s.label} className="flex flex-col items-center gap-1.5 text-center">
              <Icon
                className={cn(
                  'w-6 h-6',
                  s.state === 'done' ? 'text-emerald-600 dark:text-emerald-400'
                    : s.state === 'active' ? 'text-[#1764e0] dark:text-blue-400'
                    : s.state === 'bad' ? 'text-rose-500'
                    : 'text-slate-300 dark:text-slate-600',
                )}
                strokeWidth={2}
              />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{s.label}</span>
            </li>
          );
        })}
      </ol>

      <dl className="mt-7 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
        <dt className="text-slate-500 dark:text-slate-400">Status</dt>
        <dd className="text-right font-semibold text-slate-800 dark:text-slate-100">{status.label}</dd>
        <dt className="text-slate-500 dark:text-slate-400">Network</dt>
        <dd className="text-right"><span className={cn('px-1.5 py-px rounded text-[10px] font-bold', networkStyle(order.network).chip)}>{order.network}</span></dd>
        <dt className="text-slate-500 dark:text-slate-400">Amount</dt>
        <dd className="text-right font-semibold text-slate-800 dark:text-slate-100">{formatGhs(order.amountGhs)}</dd>
        <dt className="text-slate-500 dark:text-slate-400">Ordered</dt>
        <dd className="text-right text-slate-700 dark:text-slate-200">{formatDateTime(order.createdAt)}</dd>
        {order.completedAt && (
          <>
            <dt className="text-slate-500 dark:text-slate-400">{delivered ? 'Delivered' : 'Closed'}</dt>
            <dd className="text-right text-slate-700 dark:text-slate-200">{formatDateTime(order.completedAt)}</dd>
          </>
        )}
        <dt className="text-slate-500 dark:text-slate-400">Reference</dt>
        <dd className="text-right font-mono text-[11px] text-slate-600 dark:text-slate-300 break-all">{order.id}</dd>
      </dl>

      <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
        <Link
          to={`/services/data?bundle=${encodeURIComponent(order.bundleId)}&number=${encodeURIComponent(order.recipientNumber)}`}
          className="inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-lg"
        >
          {unpaidFinal ? 'Try again' : 'Buy again'}
        </Link>
        <Link to="/services/data" className="inline-flex items-center justify-center text-xs font-semibold px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
          Buy for another number
        </Link>
        <Link to="/services/data/orders" className="inline-flex items-center justify-center text-xs font-semibold px-5 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
          All orders
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="px-4 sm:px-6 lg:px-8 py-8 flex-1">
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 sm:p-8">
        {children}
      </div>
    </main>
  );
}
