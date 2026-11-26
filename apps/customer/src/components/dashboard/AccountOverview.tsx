import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertCircle, ArrowRight, Banknote, CreditCard, Info, MessageSquare, Sparkles, Wifi, type LucideIcon } from 'lucide-react';
import { useApi } from '../../lib/useApi';
import { useTheme } from '../../lib/theme';
import { formatGhs, timeAgo } from '../../lib/format';
import { cn } from '../../lib/utils';

export interface AccountOverviewData {
  days: number;
  totals: { spentGhs: number; activeServices: number };
  services: {
    sms: { spentGhs: number; messages: number; unitsUsed: number; delivered: number; batches: number; balanceUnits: number };
    data: { spentGhs: number; orders: number; delivered: number; inProgress: number; gbDelivered: number; numbers: number };
  };
  series: Array<{ date: string; smsGhs: number; dataGhs: number; messages: number; dataOrders: number }>;
  activity: Array<{ id: string; service: 'sms' | 'data' | 'billing'; title: string; detail: string; amountGhs: number | null; status: 'success' | 'warning' | 'error' | 'info'; at: string; link: string }>;
  attention: Array<{ id: string; tone: 'warning' | 'info' | 'error'; text: string; link: string; action: string }>;
}

const PERIODS = [7, 30, 90] as const;

// Validated categorical pair (light / dark surfaces), fixed order: SMS, Data.
const SERIES = {
  light: { sms: '#1a6cf0', data: '#059669', grid: '#e2e8f0', axis: '#64748b', surface: '#ffffff' },
  dark: { sms: '#4f8ff7', data: '#0ea371', grid: '#1e293b', axis: '#94a3b8', surface: '#0f172a' },
};

/**
 * "What's going on across my account": money spent per service, usage and
 * a mixed activity feed, for the chosen period. One request.
 */
export function AccountOverview() {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const { data, loading, error, refresh } = useApi<AccountOverviewData>(`/customer/overview?days=${days}`);
  const o = data;

  return (
    <section aria-labelledby="overview-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="overview-title" className="text-sm font-bold text-slate-900 dark:text-slate-100">Account overview</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Every service on your account, last {days} days.</p>
        </div>
        <div role="group" aria-label="Period" className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={p === days}
              onClick={() => setDays(p)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition',
                p === days ? 'bg-[#1a6cf0] text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
              )}
            >
              {p} days
            </button>
          ))}
        </div>
      </div>

      {error && !o ? (
        <div role="alert" className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
          Couldn't load your overview. <button type="button" onClick={refresh} className="font-semibold text-[#1764e0] dark:text-blue-400 hover:underline">Try again</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi loading={loading && !o} icon={Banknote} tone="slate" label="Spent, all services" value={o ? formatGhs(o.totals.spentGhs) : '—'} foot={o ? `SMS ${formatGhs(o.services.sms.spentGhs)} · Data ${formatGhs(o.services.data.spentGhs)}` : ''} />
            <Kpi loading={loading && !o} icon={MessageSquare} tone="blue" label="Messages sent" value={o ? o.services.sms.messages.toLocaleString() : '—'} foot={o ? `${o.services.sms.unitsUsed.toLocaleString()} units used` : ''} to="/messaging/history" />
            <Kpi loading={loading && !o} icon={Wifi} tone="emerald" label="Data delivered" value={o ? `${o.services.data.delivered.toLocaleString()} bundle${o.services.data.delivered === 1 ? '' : 's'}` : '—'} foot={o ? `${o.services.data.gbDelivered.toLocaleString()} GB to ${o.services.data.numbers.toLocaleString()} number${o.services.data.numbers === 1 ? '' : 's'}` : ''} to="/services/data/orders" />
            <Kpi loading={loading && !o} icon={CreditCard} tone="purple" label="SMS balance" value={o ? `${o.services.sms.balanceUnits.toLocaleString()} units` : '—'} foot="available to send" to="/wallet/add-funds" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <SpendingChart data={o} loading={loading && !o} />
            <ActivityFeed items={o?.activity ?? null} />
          </div>
        </>
      )}
    </section>
  );
}

/** Things worth doing next, across services. */
export function AttentionStrip() {
  const { data } = useApi<AccountOverviewData>('/customer/overview?days=30');
  const items = data?.attention ?? [];
  if (items.length === 0) return null;
  return (
    <ul className="space-y-2" aria-label="Suggested next steps">
      {items.slice(0, 3).map((a) => (
        <li
          key={a.id}
          className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-2.5 text-xs',
            a.tone === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-100'
              : a.tone === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-100'
                : 'bg-blue-50/70 border-blue-100 text-slate-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-slate-200',
          )}
        >
          {a.tone === 'info' ? <Info className="w-4 h-4 shrink-0 text-[#1764e0] dark:text-blue-300" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{a.text}</span>
          <Link to={a.link} className="font-bold shrink-0 hover:underline">{a.action} →</Link>
        </li>
      ))}
    </ul>
  );
}

const TONES: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  blue: 'bg-blue-50 text-[#1764e0] dark:bg-blue-500/15 dark:text-blue-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  purple: 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300',
};

function Kpi({ icon: Icon, tone, label, value, foot, loading, to }: { icon: LucideIcon; tone: string; label: string; value: string; foot: string; loading: boolean; to?: string }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</span>
        <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', TONES[tone])}>
          <Icon className="w-4 h-4" strokeWidth={2} />
        </span>
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-24 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
      ) : (
        <div className="mt-1 text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{value}</div>
      )}
      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">{foot}</div>
    </>
  );
  const cls = 'block bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs';
  return to ? (
    <Link to={to} className={cn(cls, 'hover:border-slate-300 dark:hover:border-slate-700 transition-colors')}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function SpendingChart({ data, loading }: { data: AccountOverviewData | undefined | null; loading: boolean }) {
  const { theme } = useTheme();
  const c = SERIES[theme === 'dark' ? 'dark' : 'light'];
  const days = data?.days ?? 30;
  // Weekly buckets for 90 days keep bars readable.
  const rows = (data?.series ?? []).reduce<Array<{ label: string; sms: number; data: number }>>((acc, d, i) => {
    const date = new Date(`${d.date}T00:00:00Z`);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    if (days === 90) {
      const w = Math.floor(i / 7);
      if (!acc[w]) acc[w] = { label: `w/c ${label}`, sms: 0, data: 0 };
      acc[w].sms += d.smsGhs;
      acc[w].data += d.dataGhs;
    } else {
      acc.push({ label, sms: d.smsGhs, data: d.dataGhs });
    }
    return acc;
  }, []);
  const empty = rows.every((r) => r.sms === 0 && r.data === 0);
  const totalSms = data?.services.sms.spentGhs ?? 0;
  const totalData = data?.services.data.spentGhs ?? 0;

  return (
    <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Spending by service</h3>
        <div className="flex items-center gap-4 text-[11px] font-medium text-slate-600 dark:text-slate-300" aria-hidden="true">
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.sms }} /> SMS units {formatGhs(totalSms)}</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.data }} /> Data {formatGhs(totalData)}</span>
        </div>
      </div>
      <p className="sr-only">
        In the last {days} days you spent {formatGhs(totalSms)} on SMS units and {formatGhs(totalData)} on data bundles.
      </p>
      <div className="mt-4 h-[220px] relative" aria-hidden="true">
        {loading ? (
          <div className="h-full rounded-lg bg-slate-50 dark:bg-slate-800/50 animate-pulse" />
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -12 }} barCategoryGap="28%" accessibilityLayer={false}>
                <CartesianGrid vertical={false} stroke={c.grid} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: c.axis, fontSize: 10 }} interval="preserveStartEnd" minTickGap={18} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: c.axis, fontSize: 10 }} width={44} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v))} />
                <Tooltip
                  cursor={{ fill: theme === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.04)' }}
                  contentStyle={{ background: c.surface, border: `1px solid ${c.grid}`, borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: c.axis, fontWeight: 600 }}
                  itemStyle={{ color: theme === 'dark' ? '#e2e8f0' : '#0f172a' }}
                  formatter={(v, name) => [formatGhs(Number(v)), name === 'sms' ? 'SMS units' : 'Data bundles']}
                />
                <Bar dataKey="sms" stackId="s" fill={c.sms} stroke={c.surface} strokeWidth={2} maxBarSize={22} />
                <Bar dataKey="data" stackId="s" fill={c.data} stroke={c.surface} strokeWidth={2} radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
            {empty && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <Sparkles className="w-6 h-6 text-slate-400" />
                <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Nothing spent in this period yet</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Top up SMS units or buy a data bundle to see it here.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const SERVICE_ICON: Record<string, { icon: LucideIcon; tone: string }> = {
  sms: { icon: MessageSquare, tone: TONES.blue },
  data: { icon: Wifi, tone: TONES.emerald },
  billing: { icon: CreditCard, tone: TONES.purple },
};
const STATUS_DOT: Record<string, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-rose-500',
  info: 'bg-blue-500',
};
const STATUS_TEXT: Record<string, string> = { success: 'Done', warning: 'Partly done', error: 'Problem', info: 'In progress' };

function ActivityFeed({ items }: { items: AccountOverviewData['activity'] | null }) {
  return (
    <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Recent activity</h3>
        <Link to="/transactions" className="text-[#1764e0] dark:text-blue-400 hover:underline text-xs font-medium">History →</Link>
      </div>
      {items === null ? (
        <div className="mt-3 space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">No activity yet</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Messages, data bundles and top-ups will appear here.</p>
          <div className="mt-3 flex justify-center gap-3 text-xs font-bold">
            <Link to="/messaging/sms" className="text-[#1764e0] dark:text-blue-400 hover:underline">Send SMS</Link>
            <Link to="/services/data" className="text-emerald-700 dark:text-emerald-300 hover:underline">Buy data</Link>
          </div>
        </div>
      ) : (
        <ul className="mt-1 divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((a) => {
            const s = SERVICE_ICON[a.service];
            const Icon = s.icon;
            return (
              <li key={a.id}>
                <Link to={a.link} className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', s.tone)}>
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{a.title}</span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">{a.detail} · {timeAgo(a.at)}</span>
                  </span>
                  <span className="flex flex-col items-end shrink-0 gap-0.5">
                    {a.amountGhs !== null && <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{formatGhs(a.amountGhs)}</span>}
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[a.status])} /> {STATUS_TEXT[a.status]}
                    </span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
