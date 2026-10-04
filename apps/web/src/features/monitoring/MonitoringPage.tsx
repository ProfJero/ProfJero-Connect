import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertOctagon,
  Bug,
  CheckCircle2,
  Clock,
  Database,
  Gauge,
  MessageSquare,
  Pause,
  Play,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../../components/ui/Card';
import { TableScroll } from '../../components/ui/TableScroll';
import { useApi } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { timeAgo } from '../../lib/datetime';
import { cn } from '../../lib/utils';

type Range = '1h' | '24h' | '7d';

interface JobRun {
  lastRunAt: string;
  ok: boolean;
  summary: string;
  durationMs: number;
}

interface MonitorEvent {
  id: string;
  kind: string;
  type: string;
  message: string;
  status: number | null;
  ip: string | null;
  method: string | null;
  path: string | null;
  requestId: string | null;
  userAgent: string | null;
  detail: { stack?: string | null; url?: string | null } | null;
  createdAt: string;
}

interface Report {
  range: Range;
  generatedAt: string;
  health: {
    dbLatencyMs: number;
    jobs: Partial<Record<'reconciliation' | 'dispatcher' | 'balanceRefresh' | 'providerCleanup', JobRun>>;
    sendingBatches: number;
    oldestSendingAt: string | null;
    unknownMessages: number;
  };
  totals: {
    requests: number;
    errors5xx: number;
    errors4xx: number;
    errorRate: number;
    avgMs: number | null;
    p50Ms: number | null;
    p95Ms: number | null;
    p99Ms: number | null;
    slowRequests: number;
    clientErrors: number;
  };
  latencyHistogram: Array<{ le: string; count: number }>;
  routes: Array<{ route: string; requests: number; errors: number; avgMs: number }>;
  security: { byType: Record<string, number>; topIps: Array<{ ip: string; events: number }> };
  sms: {
    sent: number;
    failed: number;
    unknown: number;
    successRate: number | null;
    providerCalls: number;
    providerErrors: number;
    providerAvgMs: number | null;
  };
  series: Array<{
    t: string;
    requests: number;
    errors5xx: number;
    errors4xx: number;
    avgMs: number | null;
    p95Ms: number | null;
    security: number;
    smsSent: number;
    smsFailed: number;
    clientErrors: number;
  }>;
  events: { errors: MonitorEvent[]; security: MonitorEvent[]; client: MonitorEvent[] };
}

const BLUE = '#1976d2';
const RED = '#c62828';
const AMBER = '#b45309';
const GRID = '#eef2f7';
const AXIS = '#64748b';

const SECURITY_LABELS: Record<string, string> = {
  auth_failed: 'Failed sign-ins',
  bad_api_key: 'Invalid API keys',
  forbidden: 'Forbidden (no permission)',
  rate_limited: 'Rate limited',
  webhook_rejected: 'Rejected webhooks',
};

const fmt = (n: number) => n.toLocaleString('en-US');
const pct = (n: number | null) => (n === null ? '—' : `${(n * 100).toFixed(n >= 0.995 || n === 0 ? 0 : 1)}%`);
const ms = (n: number | null) => (n === null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)} s` : `${n} ms`);

/**
 * Monitoring: live health, performance, errors, security/abuse and SMS
 * delivery for the whole platform. Refreshes every 10 seconds.
 */
export function MonitoringPage() {
  const { user } = useAuth();
  const [range, setRange] = useState<Range>('1h');
  const [live, setLive] = useState(true);
  const [tab, setTab] = useState<'errors' | 'security' | 'client'>('errors');
  const { data, loading, error, reload } = useApi<Report>(`/admin/monitoring?range=${range}`);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') reload();
    }, 10_000);
    return () => window.clearInterval(id);
  }, [live, reload]);

  if (user && !['super_admin', 'admin'].includes(user.role)) {
    return (
      <main className="p-4 sm:p-6 lg:p-7 flex-1">
        <h1 className="text-xl font-bold text-slate-900">Monitoring</h1>
        <p className="text-sm text-slate-500 mt-2">Monitoring is available to admins and super admins.</p>
      </main>
    );
  }

  const label = (iso: string) => {
    const d = new Date(iso);
    return range === '1h'
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : range === '24h'
        ? d.toLocaleTimeString([], { hour: '2-digit' })
        : d.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
  };
  const series = (data?.series ?? []).map((p) => ({ ...p, label: label(p.t) }));
  const securityTotal = data ? Object.values(data.security.byType).reduce((a, b) => a + b, 0) : 0;

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#1976d2] flex items-center justify-center text-white shadow-sm shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Monitoring</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Health, performance, errors, security and delivery across the whole platform.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Time range" className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            {(['1h', '24h', '7d'] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={range === r}
                onClick={() => setRange(r)}
                className={cn('px-3 py-1.5 rounded-md text-xs font-semibold', range === r ? 'bg-[#1976d2] text-white' : 'text-slate-600 hover:bg-slate-50')}
              >
                {r === '1h' ? 'Last hour' : r === '24h' ? '24 hours' : '7 days'}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLive((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {live ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {live ? 'Pause live' : 'Resume live'}
          </button>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500" aria-live="polite">
            <span className={cn('w-2 h-2 rounded-full', live ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300')} />
            {data ? `Updated ${timeAgo(data.generatedAt)}` : loading ? 'Loading…' : ''}
          </span>
        </div>
      </div>

      {error && !data && (
        <Card className="p-5 text-sm text-rose-700">Couldn't load monitoring data: {error.message}</Card>
      )}

      {data && (
        <>
          {/* Headline numbers */}
          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <Stat icon={<Activity className="w-4 h-4" />} label="Requests" value={fmt(data.totals.requests)} hint={data.totals.avgMs !== null ? `avg ${ms(data.totals.avgMs)}` : 'no traffic'} />
            <Stat
              icon={<AlertOctagon className="w-4 h-4" />}
              label="Server error rate"
              value={pct(data.totals.errorRate)}
              hint={`${fmt(data.totals.errors5xx)} errors`}
              status={data.totals.errorRate >= 0.05 ? 'bad' : data.totals.errorRate > 0.01 ? 'warn' : 'good'}
            />
            <Stat
              icon={<Gauge className="w-4 h-4" />}
              label="p95 latency"
              value={data.totals.p95Ms === null ? '—' : `≤ ${ms(data.totals.p95Ms)}`}
              hint={`p50 ≤ ${ms(data.totals.p50Ms)} · p99 ≤ ${ms(data.totals.p99Ms)}`}
              status={(data.totals.p95Ms ?? 0) > 1000 ? 'warn' : 'good'}
            />
            <Stat
              icon={<ShieldAlert className="w-4 h-4" />}
              label="Blocked requests"
              value={fmt(securityTotal)}
              hint={`${fmt(data.security.topIps.length)} source IPs`}
              status={securityTotal >= 100 ? 'warn' : 'good'}
            />
            <Stat
              icon={<MessageSquare className="w-4 h-4" />}
              label="SMS success"
              value={pct(data.sms.successRate)}
              hint={`${fmt(data.sms.sent)} sent · ${fmt(data.sms.failed)} failed`}
              status={data.sms.successRate !== null && data.sms.successRate < 0.9 ? 'warn' : 'good'}
            />
            <Stat
              icon={<Bug className="w-4 h-4" />}
              label="App crashes"
              value={fmt(data.totals.clientErrors)}
              hint="reported by browsers"
              status={data.totals.clientErrors >= 20 ? 'warn' : 'good'}
            />
          </section>

          {/* System health */}
          <Card className="p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3">System health</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
              <Health
                icon={<Database className="w-4 h-4" />}
                label="Database"
                ok={data.health.dbLatencyMs < 1500}
                value={`${data.health.dbLatencyMs} ms round-trip`}
              />
              <JobHealth label="Dispatcher (every minute)" run={data.health.jobs.dispatcher} maxAgeMin={5} />
              <JobHealth label="Reconciliation (15 min)" run={data.health.jobs.reconciliation} maxAgeMin={45} />
              <Health
                icon={<Clock className="w-4 h-4" />}
                label="Messages sending"
                ok={!data.health.oldestSendingAt || Date.parse(data.generatedAt) - Date.parse(data.health.oldestSendingAt) < 10 * 60_000}
                value={
                  data.health.sendingBatches === 0
                    ? 'Nothing queued'
                    : `${data.health.sendingBatches} batch${data.health.sendingBatches === 1 ? '' : 'es'}, oldest ${timeAgo(data.health.oldestSendingAt)}`
                }
              />
              <Health
                icon={<MessageSquare className="w-4 h-4" />}
                label="Provider"
                ok={data.sms.providerErrors === 0}
                value={
                  data.sms.providerCalls === 0
                    ? 'No calls in range'
                    : `${fmt(data.sms.providerCalls)} calls · avg ${ms(data.sms.providerAvgMs)} · ${fmt(data.sms.providerErrors)} errors`
                }
                link={
                  data.health.unknownMessages > 0 ? (
                    <Link to="/sms-logs" className="text-[11px] text-blue-700 hover:underline">
                      {fmt(data.health.unknownMessages)} awaiting outcome
                    </Link>
                  ) : null
                }
              />
            </div>
          </Card>

          {/* Charts */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartCard title="Traffic" subtitle="API requests per interval">
              <AreaChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: AXIS }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} minTickGap={24} />
                <YAxis tick={{ fontSize: 10, fill: AXIS }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [fmt(Number(v)), 'Requests']} />
                <Area type="monotone" dataKey="requests" stroke={BLUE} strokeWidth={2} fill={BLUE} fillOpacity={0.12} isAnimationActive={false} />
              </AreaChart>
            </ChartCard>
            <ChartCard title="Server errors" subtitle="5xx responses per interval">
              <BarChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: AXIS }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} minTickGap={24} />
                <YAxis tick={{ fontSize: 10, fill: AXIS }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [fmt(Number(v)), 'Server errors']} />
                <Bar dataKey="errors5xx" fill={RED} radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false} />
              </BarChart>
            </ChartCard>
            <ChartCard title="Latency (p95)" subtitle="95% of requests finished within">
              <AreaChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: -4 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: AXIS }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} minTickGap={24} />
                <YAxis tick={{ fontSize: 10, fill: AXIS }} tickLine={false} axisLine={false} tickFormatter={(v) => ms(Number(v))} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [v === null ? '—' : `≤ ${ms(Number(v))}`, 'p95']} />
                <Area type="stepAfter" dataKey="p95Ms" stroke={BLUE} strokeWidth={2} fill={BLUE} fillOpacity={0.08} connectNulls isAnimationActive={false} />
              </AreaChart>
            </ChartCard>
            <ChartCard title="Blocked requests" subtitle="Failed sign-ins, bad API keys, rate limits, forbidden">
              <BarChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: AXIS }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} minTickGap={24} />
                <YAxis tick={{ fontSize: 10, fill: AXIS }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [fmt(Number(v)), 'Blocked']} />
                <Bar dataKey="security" fill={AMBER} radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false} />
              </BarChart>
            </ChartCard>
          </section>

          {/* Routes + security */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <div className="px-5 pt-5 pb-3">
                <h2 className="text-sm font-bold text-slate-900">Endpoints</h2>
                <p className="text-xs text-slate-500">Busiest routes and any route with server errors.</p>
              </div>
              <TableScroll label="Endpoints">
                <table className="w-full text-xs">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/70">
                    <tr>
                      <th className="text-left px-5 py-2.5">Route</th>
                      <th className="text-right px-4 py-2.5">Requests</th>
                      <th className="text-right px-4 py-2.5">Server errors</th>
                      <th className="text-right px-5 py-2.5">Avg time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.routes.length === 0 && (
                      <tr><td colSpan={4} className="px-5 py-6 text-center text-slate-500">No traffic in this range.</td></tr>
                    )}
                    {data.routes.map((r) => (
                      <tr key={r.route}>
                        <td className="px-5 py-2.5 font-mono text-slate-800">/{r.route}</td>
                        <td className="px-4 py-2.5 text-right text-slate-700">{fmt(r.requests)}</td>
                        <td className={cn('px-4 py-2.5 text-right', r.errors > 0 ? 'text-rose-700 font-semibold' : 'text-slate-500')}>{fmt(r.errors)}</td>
                        <td className={cn('px-5 py-2.5 text-right', r.avgMs > 1000 ? 'text-amber-700 font-semibold' : 'text-slate-700')}>{ms(r.avgMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </Card>

            <Card className="p-5 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Security</h2>
                <p className="text-xs text-slate-500">Requests the API refused.</p>
              </div>
              <dl className="space-y-2">
                {Object.entries(SECURITY_LABELS).map(([k, l]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <dt className="text-slate-600">{l}</dt>
                    <dd className="font-semibold text-slate-900">{fmt(data.security.byType[k] ?? 0)}</dd>
                  </div>
                ))}
              </dl>
              <div>
                <h3 className="text-xs font-bold text-slate-800 mb-2">Top source IPs</h3>
                {data.security.topIps.length === 0 ? (
                  <p className="text-xs text-slate-500">None in this range.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {data.security.topIps.map((x) => (
                      <li key={x.ip} className="flex justify-between text-xs">
                        <span className="font-mono text-slate-700">{x.ip}</span>
                        <span className="font-semibold text-slate-900">{fmt(x.events)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 mb-2">Response times</h3>
                <ul className="space-y-1">
                  {data.latencyHistogram.map((b) => {
                    const max = Math.max(...data.latencyHistogram.map((x) => x.count), 1);
                    return (
                      <li key={b.le} className="flex items-center gap-2 text-[11px]">
                        <span className="w-12 text-slate-600">{b.le === '>2.5s' ? '> 2.5 s' : `≤ ${b.le}`}</span>
                        <span className="flex-1 h-2 rounded bg-slate-100 overflow-hidden">
                          <span className="block h-full rounded bg-[#1976d2]" style={{ width: `${(b.count / max) * 100}%` }} />
                        </span>
                        <span className="w-12 text-right text-slate-700">{fmt(b.count)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Card>
          </section>

          {/* Events */}
          <Card>
            <div className="px-5 pt-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
              <div role="tablist" aria-label="Events" className="flex gap-1">
                {(
                  [
                    ['errors', 'Server errors', data.events.errors.length],
                    ['security', 'Security events', data.events.security.length],
                    ['client', 'App crashes', data.events.client.length],
                  ] as const
                ).map(([id, l, n]) => (
                  <button
                    key={id}
                    role="tab"
                    type="button"
                    aria-selected={tab === id}
                    onClick={() => setTab(id)}
                    className={cn('px-3 py-2.5 text-xs font-semibold border-b-2 -mb-px', tab === id ? 'border-[#1976d2] text-[#1565c0]' : 'border-transparent text-slate-600 hover:text-slate-900')}
                  >
                    {l} <span className="ml-1 text-slate-500 font-normal">{n}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 pb-2">Latest first · sampled during bursts</p>
            </div>
            <EventList events={data.events[tab]} kind={tab} />
          </Card>
        </>
      )}
    </main>
  );
}

function Stat({ icon, label, value, hint, status }: { icon: ReactNode; label: string; value: string; hint: string; status?: 'good' | 'warn' | 'bad' }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-slate-500">
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
        {status && <StatusDot status={status} />}
        {hint}
      </div>
    </Card>
  );
}

function StatusDot({ status }: { status: 'good' | 'warn' | 'bad' }) {
  const Icon = status === 'good' ? CheckCircle2 : status === 'warn' ? AlertOctagon : XCircle;
  const label = status === 'good' ? 'Healthy' : status === 'warn' ? 'Needs attention' : 'Problem';
  return (
    <Icon
      aria-label={label}
      className={cn('w-3.5 h-3.5 shrink-0', status === 'good' ? 'text-emerald-700' : status === 'warn' ? 'text-amber-700' : 'text-rose-700')}
    />
  );
}

function Health({ icon, label, ok, value, link }: { icon: ReactNode; label: string; ok: boolean; value: string; link?: ReactNode }) {
  return (
    <div className={cn('rounded-lg border p-3', ok ? 'border-slate-200' : 'border-rose-200 bg-rose-50/60')}>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
        <span className="text-slate-500">{icon}</span>
        {label}
        <span className="ml-auto">
          <StatusDot status={ok ? 'good' : 'bad'} />
        </span>
      </div>
      <div className={cn('mt-1.5 text-[11px]', ok ? 'text-slate-600' : 'text-rose-700 font-semibold')}>{value}</div>
      {link && <div className="mt-1">{link}</div>}
    </div>
  );
}

function JobHealth({ label, run, maxAgeMin }: { label: string; run: JobRun | undefined; maxAgeMin: number }) {
  const [now] = useState(() => Date.now());
  const fresh = !!run && now - new Date(run.lastRunAt).getTime() < maxAgeMin * 60_000;
  return (
    <Health
      icon={<Clock className="w-4 h-4" />}
      label={label}
      ok={!!run && run.ok && fresh}
      value={!run ? 'Never ran' : `${run.ok ? 'OK' : 'Failed'} · ${timeAgo(run.lastRunAt)}${run.summary ? ` · ${run.summary}` : ''}`}
    />
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactElement }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      <p className="text-xs text-slate-500 mb-3">{subtitle}</p>
      <div className="h-48" role="img" aria-label={`${title} chart. Exact figures are in the tables below.`}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function EventList({ events, kind }: { events: MonitorEvent[]; kind: 'errors' | 'security' | 'client' }) {
  const [open, setOpen] = useState<string | null>(null);
  if (events.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-xs text-slate-500">
        {kind === 'errors' ? 'No server errors in this range.' : kind === 'security' ? 'No security events in this range.' : 'No app crashes reported in this range.'}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-slate-100">
      {events.map((e) => (
        <li key={e.id} className="px-5 py-3">
          <button type="button" className="w-full text-left" aria-expanded={open === e.id} onClick={() => setOpen(open === e.id ? null : e.id)}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold', kind === 'errors' ? 'bg-rose-50 text-rose-700' : kind === 'security' ? 'bg-amber-50 text-amber-800' : 'bg-violet-50 text-violet-800')}>
                {kind === 'security' ? SECURITY_LABELS[e.type] ?? e.type : kind === 'client' ? `${e.type} app` : e.type}
              </span>
              <span className="text-xs font-medium text-slate-800 break-all">{e.message}</span>
              <span className="ml-auto text-[11px] text-slate-500 whitespace-nowrap">{timeAgo(e.createdAt)}</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 flex flex-wrap gap-x-4">
              {e.path && <span className="font-mono">{e.method} {e.path}</span>}
              {e.ip && <span>IP {e.ip}</span>}
              {e.requestId && <span className="font-mono">req {e.requestId.slice(0, 8)}</span>}
            </div>
          </button>
          {open === e.id && (
            <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-700 space-y-1">
              <div>Time: {new Date(e.createdAt).toLocaleString()}</div>
              {e.requestId && <div>Request ID: <span className="font-mono select-all">{e.requestId}</span></div>}
              {e.userAgent && <div className="break-all">Browser: {e.userAgent}</div>}
              {e.detail?.url && <div>Page: {e.detail.url}</div>}
              {e.detail?.stack && <pre className="whitespace-pre-wrap break-all font-mono text-[10px] text-slate-600 mt-1">{e.detail.stack}</pre>}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
