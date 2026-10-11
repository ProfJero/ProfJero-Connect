import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Clock, Loader2, RefreshCw, AlertTriangle, RotateCcw, Send, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { TableScroll } from '../../components/ui/TableScroll';
import { useApi } from '../../lib/useApi';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { timeAgo } from '../../lib/datetime';
import { cn } from '../../lib/utils';

type OrderStatus = 'pending_payment' | 'payment_confirmed' | 'processing' | 'delivered' | 'failed' | 'refunded';

interface AdminDataOrder {
  id: string;
  projectId: string;
  projectName: string | null;
  bundleLabel: string;
  network: string;
  size: string;
  recipientNumber: string;
  amountGhs: number;
  providerCostGhs: number;
  marginGhs: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'abandoned';
  orderStatus: OrderStatus;
  providerOrderId: string | null;
  providerStatus: string | null;
  providerError: string | null;
  needsReview: boolean;
  refundError: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const FILTERS: Array<{ id: string; label: string; query: string }> = [
  { id: 'review', label: 'Needs attention', query: 'review=1' },
  { id: 'all', label: 'All', query: '' },
  { id: 'processing', label: 'Sending', query: 'status=processing' },
  { id: 'delivered', label: 'Delivered', query: 'status=delivered' },
  { id: 'failed', label: 'Failed', query: 'status=failed' },
  { id: 'refunded', label: 'Refunded', query: 'status=refunded' },
  { id: 'pending_payment', label: 'Unpaid', query: 'status=pending_payment' },
];

const STATUS_LABEL: Record<OrderStatus, { label: string; tone: string }> = {
  pending_payment: { label: 'Awaiting payment', tone: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20' },
  payment_confirmed: { label: 'Paid', tone: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20' },
  processing: { label: 'Sending', tone: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20' },
  delivered: { label: 'Delivered', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20' },
  failed: { label: 'Failed', tone: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20' },
  refunded: { label: 'Refunded', tone: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20' },
};

const ghs = (n: number) => `GH₵${n.toFixed(2)}`;
const phone = (n: string) => (n.startsWith('233') ? `0${n.slice(3)}` : n);

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

  const role = user?.role ?? 'viewer';
  const can = {
    refresh: ['super_admin', 'admin', 'finance', 'support'].includes(role),
    retry: ['super_admin', 'admin'].includes(role),
    deliver: ['super_admin', 'admin'].includes(role),
    refund: ['super_admin', 'admin', 'finance'].includes(role),
  };

  const act = async (o: AdminDataOrder, action: Action) => {
    const confirmText: Partial<Record<Action, string>> = {
      retry: `Send ${o.bundleLabel} to ${phone(o.recipientNumber)} again?\n\nOnly do this after checking the provider dashboard shows it was NOT delivered — otherwise the customer gets it twice and you pay twice.`,
      'mark-delivered': `Mark ${o.bundleLabel} to ${phone(o.recipientNumber)} as delivered?\n\nOnly do this after confirming delivery on the provider dashboard.`,
      refund: `Refund ${ghs(o.amountGhs)} to the customer for ${o.bundleLabel}?`,
    };
    if (confirmText[action] && !window.confirm(confirmText[action])) return;
    setBusy(`${o.id}:${action}`);
    setNote(null);
    try {
      const res = await apiFetch<{ order: AdminDataOrder }>(`/admin/providers/data/orders/${o.id}/${action}`, { method: 'POST', body: '{}' });
      setNote({ tone: 'ok', text: `${o.bundleLabel} → ${STATUS_LABEL[res.order.orderStatus].label}.` });
      reload();
    } catch (err) {
      setNote({ tone: 'error', text: err instanceof Error ? err.message : 'Action failed.' });
    } finally {
      setBusy(null);
    }
  };

  const orders = data?.orders ?? [];
  const revenue = orders.filter((o) => o.orderStatus === 'delivered').reduce((s, o) => s + o.amountGhs, 0);
  const margin = orders.filter((o) => o.orderStatus === 'delivered').reduce((s, o) => s + o.marginGhs, 0);

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#1976d2] flex items-center justify-center text-white shadow-sm shrink-0">
            <ShoppingBag className="w-6 h-6" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Data Orders</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Customer purchases across every project. Orders still sending are re-checked every 15 minutes.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={reload} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} strokeWidth={2.5} /> Reload
          </button>
          <Link to="/providers" className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} /> Providers
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Order filter">
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
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="p-4"><div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Orders shown</div><div className="text-lg font-bold text-slate-900 dark:text-slate-100">{orders.length}</div></Card>
          <Card className="p-4"><div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Delivered revenue</div><div className="text-lg font-bold text-slate-900 dark:text-slate-100">{ghs(revenue)}</div></Card>
          <Card className="p-4 hidden sm:block"><div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Margin on delivered</div><div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{ghs(margin)}</div></Card>
        </div>
      )}

      {note && (
        <div role="status" className={cn('px-4 py-2.5 rounded-lg text-xs font-medium', note.tone === 'ok' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300')}>
          {note.text}
        </div>
      )}

      {error && !data ? (
        <Card className="p-6 text-sm text-rose-700 dark:text-rose-300">{error.message}</Card>
      ) : loading && !data ? (
        <Card className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></Card>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center">
          {filterId === 'review' ? <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" strokeWidth={1.5} /> : <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" strokeWidth={1.5} />}
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{filterId === 'review' ? 'Nothing needs attention' : 'No orders here yet'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Orders appear as soon as customers start a data checkout.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <TableScroll label="Data orders">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-left">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Order</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Customer</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Number</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">Paid / cost</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((o) => {
                  const st = STATUS_LABEL[o.orderStatus];
                  const paid = o.paymentStatus === 'paid';
                  const isBusy = (a: Action) => busy === `${o.id}:${a}`;
                  const btn = 'inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-semibold disabled:opacity-50 transition';
                  return (
                    <tr key={o.id} className={cn('align-top', o.needsReview && 'bg-rose-50/40 dark:bg-rose-500/5')}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{o.bundleLabel}</div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{o.id}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{timeAgo(o.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/projects/${o.projectId}`} className="font-medium text-[#1976d2] dark:text-blue-400 hover:underline">{o.projectName || o.projectId}</Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">{phone(o.recipientNumber)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{ghs(o.amountGhs)}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">cost {ghs(o.providerCostGhs)} · <span className={o.marginGhs >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}>{ghs(o.marginGhs)}</span></div>
                      </td>
                      <td className="px-4 py-3 max-w-[260px]">
                        <span className={cn('inline-flex px-2 py-0.5 rounded-full border text-[11px] font-semibold', st.tone)}>{st.label}</span>
                        {o.paymentStatus !== 'paid' && o.orderStatus === 'pending_payment' && o.paymentStatus !== 'pending' && (
                          <span className="ml-1 text-[10px] text-slate-500">({o.paymentStatus})</span>
                        )}
                        {o.needsReview && (
                          <div className="mt-1 flex items-start gap-1 text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                            <AlertTriangle className="w-3 h-3 shrink-0 mt-px" /> Needs attention
                          </div>
                        )}
                        {(o.providerError || o.refundError) && (
                          <div className="mt-1 text-[10px] text-slate-600 dark:text-slate-400 break-words">{o.refundError ? `Refund: ${o.refundError}` : o.providerError}</div>
                        )}
                        {o.providerStatus && <div className="mt-0.5 text-[10px] text-slate-500">Provider: {o.providerStatus}{o.providerOrderId ? ` · ${o.providerOrderId}` : ''}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {can.refresh && o.orderStatus !== 'delivered' && o.orderStatus !== 'refunded' && (
                            <button type="button" disabled={busy !== null} onClick={() => act(o, 'refresh')} className={cn(btn, 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800')}>
                              {isBusy('refresh') ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Check
                            </button>
                          )}
                          {can.retry && paid && o.needsReview && !o.providerOrderId && o.orderStatus !== 'refunded' && o.orderStatus !== 'delivered' && (
                            <button type="button" disabled={busy !== null} onClick={() => act(o, 'retry')} className={cn(btn, 'border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-500/30 dark:text-blue-300 dark:hover:bg-blue-500/10')}>
                              {isBusy('retry') ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Resend
                            </button>
                          )}
                          {can.deliver && paid && (o.orderStatus === 'processing' || o.orderStatus === 'payment_confirmed' || (o.needsReview && o.orderStatus === 'pending_payment')) && (
                            <button type="button" disabled={busy !== null} onClick={() => act(o, 'mark-delivered')} className={cn(btn, 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10')}>
                              {isBusy('mark-delivered') ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Delivered
                            </button>
                          )}
                          {can.refund && paid && o.orderStatus !== 'delivered' && o.orderStatus !== 'refunded' && (
                            <button type="button" disabled={busy !== null} onClick={() => act(o, 'refund')} className={cn(btn, 'border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10')}>
                              {isBusy('refund') ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />} Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
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
