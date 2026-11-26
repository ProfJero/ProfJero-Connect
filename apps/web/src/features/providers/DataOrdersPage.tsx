import { Fragment, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag, ArrowLeft, Clock, Loader2, RefreshCw, AlertTriangle, RotateCcw, Send, CheckCircle2,
  Search, ChevronDown, ChevronUp, TrendingUp, Wallet, ListChecks,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { TableScroll } from '../../components/ui/TableScroll';
import { useApi } from '../../lib/useApi';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { formatDateTime, timeAgo } from '../../lib/datetime';
import { cn } from '../../lib/utils';

type OrderStatus = 'pending_payment' | 'payment_confirmed' | 'processing' | 'delivered' | 'failed' | 'refunded';

interface AdminDataOrder {
  id: string;
  projectId: string;
  projectName: string | null;
  guest?: boolean;
  customerEmail?: string | null;
  bundleLabel: string;
  network: string;
  size: string;
  recipientNumber: string;
  amountGhs: number;
  chargedGhs?: number;
  serviceChargeGhs?: number;
  gatewayFeeGhs?: number;
  totalCostGhs?: number;
  providerCostGhs: number;
  profitGhs?: number;
  marginGhs: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'abandoned';
  orderStatus: OrderStatus;
  providerOrderId: string | null;
  providerStatus: string | null;
  providerError: string | null;
  issue?: string | null;
  needsReview: boolean;
  refundError: string | null;
  refundedAt: string | null;
  providerCheckedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const FILTERS: Array<{ id: string; label: string; query: string }> = [
  { id: 'all', label: 'All', query: '' },
  { id: 'review', label: 'Needs attention', query: 'review=1' },
  { id: 'processing', label: 'Pending', query: 'status=processing' },
  { id: 'delivered', label: 'Delivered', query: 'status=delivered' },
  { id: 'failed', label: 'Failed', query: 'status=failed' },
  { id: 'refunded', label: 'Refunded', query: 'status=refunded' },
  { id: 'pending_payment', label: 'Unpaid', query: 'status=pending_payment' },
];

/** Solid, readable pills: dark text on a tinted background, one meaning each. */
const STATUS: Record<OrderStatus, { label: string; cls: string; dot: string }> = {
  pending_payment: { label: 'Awaiting payment', cls: 'bg-slate-100 text-slate-700 ring-slate-300', dot: 'bg-slate-400' },
  payment_confirmed: { label: 'Paid', cls: 'bg-blue-50 text-blue-800 ring-blue-200', dot: 'bg-blue-500' },
  processing: { label: 'Pending', cls: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  delivered: { label: 'Delivered', cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  failed: { label: 'Failed', cls: 'bg-rose-50 text-rose-800 ring-rose-200', dot: 'bg-rose-500' },
  refunded: { label: 'Refunded', cls: 'bg-violet-50 text-violet-800 ring-violet-200', dot: 'bg-violet-500' },
};

const NETWORK_CHIP: Record<string, string> = {
  MTN: 'bg-yellow-300 text-slate-900',
  TELECEL: 'bg-red-600 text-white',
  AIRTELTIGO: 'bg-blue-700 text-white',
};
const networkChip = (n: string) => {
  const k = n.toUpperCase().replace(/[^A-Z]/g, '');
  if (k.startsWith('MTN')) return NETWORK_CHIP.MTN;
  if (k.startsWith('TELECEL') || k.startsWith('VODAFONE')) return NETWORK_CHIP.TELECEL;
  if (k.startsWith('AIRTEL') || k.startsWith('TIGO') || k === 'AT') return NETWORK_CHIP.AIRTELTIGO;
  return 'bg-slate-700 text-white';
};

const ghs = (n: number) => `GH₵${n.toFixed(2)}`;
const phone = (n: string) => {
  const l = n.startsWith('233') ? `0${n.slice(3)}` : n;
  return l.length === 10 ? `${l.slice(0, 3)} ${l.slice(3, 6)} ${l.slice(6)}` : l;
};
const profitOf = (o: AdminDataOrder) => o.profitGhs ?? o.marginGhs;

type Action = 'refresh' | 'retry' | 'mark-delivered' | 'refund';

export function DataOrdersPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const filterId = FILTERS.find((f) => f.id === params.get('filter'))?.id ?? (params.get('review') === '1' ? 'review' : 'all');
  const filter = FILTERS.find((f) => f.id === filterId)!;
  const { data, loading, error, reload } = useApi<{ orders: AdminDataOrder[]; nextCursor: string | null }>(
    `/admin/providers/data/orders?limit=100${filter.query ? `&${filter.query}` : ''}`,
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const role = user?.role ?? 'viewer';
  const can = {
    refresh: ['super_admin', 'admin', 'finance', 'support'].includes(role),
    retry: ['super_admin', 'admin'].includes(role),
    deliver: ['super_admin', 'admin'].includes(role),
    refund: ['super_admin', 'admin', 'finance'].includes(role),
  };

  const act = async (o: AdminDataOrder, action: Action) => {
    const confirmText: Partial<Record<Action, string>> = {
      retry: `Send ${o.bundleLabel} to ${phone(o.recipientNumber)} again?\n\nWe check the provider first and won't resend if it already has this order.`,
      'mark-delivered': `Mark ${o.bundleLabel} to ${phone(o.recipientNumber)} as delivered?\n\nOnly do this after confirming delivery on the provider dashboard.`,
      refund: `Refund the customer in full for ${o.bundleLabel} (${ghs(o.amountGhs)})?`,
    };
    if (confirmText[action] && !window.confirm(confirmText[action])) return;
    setBusy(`${o.id}:${action}`);
    setNote(null);
    try {
      const res = await apiFetch<{ order: AdminDataOrder }>(`/admin/providers/data/orders/${o.id}/${action}`, { method: 'POST', body: '{}' });
      setNote({ tone: 'ok', text: `${o.bundleLabel} to ${phone(o.recipientNumber)}: ${STATUS[res.order.orderStatus].label}.` });
      reload();
    } catch (err) {
      setNote({ tone: 'error', text: err instanceof Error ? err.message : 'Action failed.' });
    } finally {
      setBusy(null);
    }
  };

  const all = useMemo(() => data?.orders ?? [], [data]);
  const orders = useMemo(() => {
    const term = q.trim().toLowerCase().replace(/\s+/g, '');
    if (!term) return all;
    const asIntl = term.startsWith('0') ? `233${term.slice(1)}` : term;
    return all.filter((o) =>
      o.id.includes(term) ||
      o.recipientNumber.includes(asIntl) ||
      o.bundleLabel.toLowerCase().replace(/\s+/g, '').includes(term) ||
      (o.projectName ?? '').toLowerCase().includes(term),
    );
  }, [all, q]);

  const delivered = orders.filter((o) => o.orderStatus === 'delivered');
  const revenue = delivered.reduce((s, o) => s + o.amountGhs, 0);
  const profit = delivered.reduce((s, o) => s + profitOf(o), 0);
  const attention = all.filter((o) => o.needsReview).length;

  const btn = 'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-[11px] font-semibold disabled:opacity-50 transition whitespace-nowrap';

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-5 flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#1976d2] flex items-center justify-center text-white shadow-sm shrink-0">
            <ShoppingBag className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Data Orders</h1>
            <p className="text-xs text-slate-600 mt-0.5">Every data purchase, signed-in and guest. Pending orders are checked with the provider automatically.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={reload} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-50 transition">
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} strokeWidth={2.5} /> Reload
          </button>
          <Link to="/providers/data/bundles" className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-50 transition">
            Bundles
          </Link>
          <Link to="/providers" className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-50 transition">
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} /> Providers
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat icon={ListChecks} label="Orders shown" value={String(orders.length)} />
        <Stat icon={Wallet} label="Delivered sales" value={ghs(revenue)} hint={`${delivered.length} delivered`} />
        <Stat icon={TrendingUp} label="Real profit" value={ghs(profit)} tone={profit >= 0 ? 'good' : 'bad'} hint="after gateway & top-up fees" />
        <Stat icon={AlertTriangle} label="Needs attention" value={String(attention)} tone={attention > 0 ? 'bad' : 'neutral'} onClick={attention > 0 ? () => setParams({ filter: 'review' }, { replace: true }) : undefined} />
      </div>

      <Card className="p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Order filter">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={f.id === filterId}
              onClick={() => setParams(f.id === 'all' ? {} : { filter: f.id }, { replace: true })}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition',
                f.id === filterId
                  ? f.id === 'review' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-[#1976d2] border-[#1976d2] text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative lg:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <label htmlFor="order-search" className="sr-only">Search orders</label>
          <input
            id="order-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Number, order ID, bundle, customer"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1976d2]/30 focus:border-[#1976d2]"
          />
        </div>
      </Card>

      {note && (
        <div role="status" className={cn('px-4 py-2.5 rounded-lg text-xs font-medium border', note.tone === 'ok' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200')}>
          {note.text}
        </div>
      )}

      {error && !data ? (
        <Card className="p-6 text-sm text-rose-800">{error.message}</Card>
      ) : loading && !data ? (
        <Card className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></Card>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center">
          {filterId === 'review' ? <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" strokeWidth={1.5} /> : <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3" strokeWidth={1.5} />}
          <p className="text-sm font-semibold text-slate-800">{filterId === 'review' ? 'Nothing needs attention' : q ? 'No orders match your search' : 'No orders here yet'}</p>
          <p className="text-xs text-slate-600 mt-1">Orders appear as soon as customers start a data checkout.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <TableScroll label="Data orders">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-700 text-left border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Bundle</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Customer</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Number</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Price</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Profit</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => {
                  const st = STATUS[o.orderStatus];
                  const paid = o.paymentStatus === 'paid';
                  const isBusy = (a: Action) => busy === `${o.id}:${a}`;
                  const p = profitOf(o);
                  const expanded = open === o.id;
                  const closed = o.orderStatus === 'delivered' || o.orderStatus === 'refunded';
                  const unpaidNote = o.orderStatus === 'pending_payment' && o.paymentStatus !== 'pending' ? (o.paymentStatus === 'abandoned' ? 'Checkout abandoned' : 'Payment failed') : null;
                  return (
                    <Fragment key={o.id}>
                      <tr className={cn('align-top hover:bg-slate-50/70', o.needsReview && 'bg-rose-50/50')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={cn('px-1.5 py-px rounded text-[10px] font-bold shrink-0', networkChip(o.network))}>{o.network}</span>
                            <span className="font-semibold text-slate-900 whitespace-nowrap">{o.size}</span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-600" title={formatDateTime(o.createdAt)}>{timeAgo(o.createdAt)}</div>
                        </td>
                        <td className="px-4 py-3">
                          {o.guest || o.projectId === 'guest' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">Guest</span>
                          ) : (
                            <Link to={`/projects/${o.projectId}`} className="font-semibold text-[#1565c0] hover:underline">{o.projectName || o.projectId}</Link>
                          )}
                          {o.customerEmail && (o.guest || o.projectId === 'guest') && <div className="mt-1 text-[11px] text-slate-600 truncate max-w-[180px]">{o.customerEmail}</div>}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-800 whitespace-nowrap">{phone(o.recipientNumber)}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="font-semibold text-slate-900 tabular-nums">{ghs(o.amountGhs)}</div>
                          <div className="text-[11px] text-slate-600 tabular-nums">cost {ghs(o.providerCostGhs)}</div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                          <span className={cn('font-semibold', !paid || o.orderStatus === 'refunded' ? 'text-slate-500' : p >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                            {!paid || o.orderStatus === 'refunded' ? '—' : ghs(p)}
                          </span>
                        </td>
                        <td className="px-4 py-3 min-w-[170px] max-w-[280px]">
                          <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ring-1 ring-inset text-[11px] font-semibold', st.cls)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', st.dot)} />{st.label}
                          </span>
                          {unpaidNote && <div className="mt-1 text-[11px] text-slate-600">{unpaidNote}</div>}
                          {o.issue && (
                            <div className={cn('mt-1.5 flex items-start gap-1 text-[11px] leading-snug', o.needsReview ? 'text-rose-800 font-semibold' : 'text-slate-700')}>
                              {o.needsReview && <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />}
                              <span>{o.issue}</span>
                            </div>
                          )}
                          <button type="button" onClick={() => setOpen(expanded ? null : o.id)} className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#1565c0] hover:underline" aria-expanded={expanded}>
                            Details {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {can.refresh && !closed && (
                              <button type="button" disabled={busy !== null} onClick={() => act(o, 'refresh')} className={cn(btn, 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50')}>
                                {isBusy('refresh') ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Check
                              </button>
                            )}
                            {can.retry && paid && o.needsReview && !o.providerOrderId && !closed && (
                              <button type="button" disabled={busy !== null} onClick={() => act(o, 'retry')} className={cn(btn, 'border-blue-300 bg-white text-blue-800 hover:bg-blue-50')}>
                                {isBusy('retry') ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Resend
                              </button>
                            )}
                            {can.deliver && paid && (o.orderStatus === 'processing' || o.orderStatus === 'payment_confirmed' || (o.needsReview && o.orderStatus === 'pending_payment')) && (
                              <button type="button" disabled={busy !== null} onClick={() => act(o, 'mark-delivered')} className={cn(btn, 'border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50')}>
                                {isBusy('mark-delivered') ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Delivered
                              </button>
                            )}
                            {can.refund && paid && !closed && (
                              <button type="button" disabled={busy !== null} onClick={() => act(o, 'refund')} className={cn(btn, 'border-rose-300 bg-white text-rose-800 hover:bg-rose-50')}>
                                {isBusy('refund') ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />} Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-slate-50">
                          <td colSpan={7} className="px-4 py-3">
                            <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-[11px]">
                              <Detail label="Order ID" value={o.id} mono />
                              <Detail label="Bundle" value={o.bundleLabel} />
                              <Detail label="Ordered" value={formatDateTime(o.createdAt)} />
                              <Detail label="Payment" value={o.paymentStatus} />
                              <Detail label="Customer paid (with service charge)" value={o.chargedGhs != null ? ghs(o.chargedGhs) : ghs(o.amountGhs)} />
                              <Detail label="Gateway fee" value={o.gatewayFeeGhs != null ? ghs(o.gatewayFeeGhs) : '—'} />
                              <Detail label="Cost incl. top-up fee" value={o.totalCostGhs != null ? ghs(o.totalCostGhs) : ghs(o.providerCostGhs)} />
                              <Detail label="Real profit" value={ghs(p)} />
                              <Detail label="Provider order" value={o.providerOrderId ?? '—'} mono />
                              <Detail label="Provider status" value={o.providerStatus ?? '—'} />
                              <Detail label="Last checked" value={o.providerCheckedAt ? timeAgo(o.providerCheckedAt) : '—'} />
                              {o.refundedAt && <Detail label="Refunded" value={formatDateTime(o.refundedAt)} />}
                              {(o.providerError || o.refundError) && (
                                <div className="col-span-2 md:col-span-4">
                                  <dt className="text-slate-600 font-semibold">Technical detail</dt>
                                  <dd className="mt-0.5 font-mono text-[10.5px] text-slate-800 break-words whitespace-pre-wrap max-h-24 overflow-y-auto bg-white border border-slate-200 rounded-md p-2">
                                    {o.refundError ? `Refund: ${o.refundError}\n` : ''}{o.providerError ?? ''}
                                  </dd>
                                </div>
                              )}
                            </dl>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        </Card>
      )}
    </main>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-slate-600 font-semibold">{label}</dt>
      <dd className={cn('mt-0.5 text-slate-900 break-all', mono && 'font-mono')}>{value}</dd>
    </div>
  );
}

function Stat({
  icon: Icon, label, value, hint, tone = 'neutral', onClick,
}: {
  icon: typeof Wallet; label: string; value: string; hint?: string; tone?: 'neutral' | 'good' | 'bad'; onClick?: () => void;
}) {
  const body = (
    <>
      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
        <Icon className="w-3.5 h-3.5" strokeWidth={2} /> {label}
      </div>
      <div className={cn('mt-1 text-lg font-bold tabular-nums', tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-rose-700' : 'text-slate-900')}>{value}</div>
      {hint && <div className="text-[11px] text-slate-600">{hint}</div>}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="text-left bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 hover:border-rose-300 transition">{body}</button>
  ) : (
    <Card className="p-4">{body}</Card>
  );
}
