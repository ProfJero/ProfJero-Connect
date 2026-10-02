import { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { apiFetch, ApiError } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { useAdminData } from '../../lib/adminData';
import { timeAgo } from '../../lib/datetime';
import { cn } from '../../lib/utils';

interface JobRun {
  lastRunAt: string;
  ok: boolean;
  summary: string;
  durationMs: number;
}
interface SystemResponse {
  environment: string;
  time: string;
  firestoreMs: number;
  config: {
    smsMode: 'live' | 'sandbox' | 'mock';
    deliveryWebhookConfigured: boolean;
    deliveryWebhookAuthenticated: boolean;
    paymentsConfigured: boolean;
    paymentsMode: 'live' | 'test' | 'off';
    emailConfigured: boolean;
    customerAppUrl: string | null;
  };
  jobs: Partial<Record<'reconciliation' | 'providerCleanup' | 'balanceRefresh', JobRun>>;
  queues: {
    unknownRecords: number;
    unknownOlderThanHour: number;
    unitsHeldByUnknown: number;
    strandedQueuedBatches: number;
    pendingPayments: number;
  };
}

type Health = 'ok' | 'warn' | 'bad';
const HEALTH_ICON = { ok: CheckCircle2, warn: AlertTriangle, bad: XCircle };
const HEALTH_TONE = { ok: 'text-emerald-600', warn: 'text-amber-600', bad: 'text-rose-600' };

function Row({ label, value, health, hint }: { label: string; value: string; health: Health; hint?: string }) {
  const Icon = HEALTH_ICON[health];
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <div>
        <div className="text-xs font-semibold text-slate-800">{label}</div>
        {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
      </div>
      <div className={cn('flex items-center gap-1.5 text-xs font-semibold shrink-0', HEALTH_TONE[health])}>
        <Icon className="w-4 h-4" /> {value}
      </div>
    </div>
  );
}

/** Settings → System: configuration, background jobs and recovery tools. */
export function SystemSection() {
  const { user } = useAuth();
  const { refreshAlerts } = useAdminData();
  const { data, loading, error, reload } = useApi<SystemResponse>('/admin/system');
  const [openedAt] = useState(() => Date.now());
  const [action, setAction] = useState<{ busy: string | null; result: string | null }>({ busy: null, result: null });
  const isSuper = user?.role === 'super_admin';

  const run = async (path: string, label: string, body: unknown) => {
    setAction({ busy: label, result: null });
    try {
      const res = await apiFetch<Record<string, unknown>>(path, { method: 'POST', body: JSON.stringify(body) });
      const summary = ['scanned', 'confirmed', 'released', 'keptUnknown', 'deleted', 'cleaned', 'errors']
        .filter((k) => typeof res[k] === 'number')
        .map((k) => `${k} ${res[k]}`)
        .join(' · ');
      setAction({ busy: null, result: `${label} finished${summary ? `: ${summary}` : '.'}` });
      reload();
      refreshAlerts();
    } catch (err) {
      setAction({ busy: null, result: `${label} failed: ${err instanceof ApiError ? err.message : 'error'}` });
    }
  };

  if (loading && !data) return <Card className="p-6 text-xs text-slate-500">Loading system status…</Card>;
  if (error || !data) return <Card className="p-6 text-xs text-rose-600">{error?.message ?? 'Unavailable'}</Card>;

  const recon = data.jobs.reconciliation;
  const reconAgeMin = recon ? Math.max(0, openedAt - new Date(recon.lastRunAt).getTime()) / 60000 : Infinity;
  const isProd = data.environment === 'production';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-900">Configuration</h3>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{data.environment}</span>
        </div>
        <div className="divide-y divide-slate-100">
          <Row label="SMS sending" value={data.config.smsMode === 'live' ? 'Live' : data.config.smsMode === 'sandbox' ? 'Sandbox' : 'Mock (nothing sent)'} health={data.config.smsMode === 'live' ? 'ok' : isProd ? 'bad' : 'warn'} hint="Set by SMS_PROVIDER / ARKESEL_SANDBOX in the Worker." />
          <Row label="Delivery receipts webhook" value={data.config.deliveryWebhookConfigured ? 'Configured' : 'Not set'} health={data.config.deliveryWebhookConfigured ? 'ok' : 'warn'} hint="Without it, messages stay “Sent” until polled." />
          {data.config.deliveryWebhookConfigured && (
            <Row label="Webhook token" value={data.config.deliveryWebhookAuthenticated ? 'Required' : 'Not set'} health={data.config.deliveryWebhookAuthenticated ? 'ok' : 'warn'} hint="Set ARKESEL_WEBHOOK_SECRET so forged delivery callbacks are rejected." />
          )}
          <Row label="Payments" value={data.config.paymentsMode === 'live' ? 'Live' : data.config.paymentsMode === 'test' ? 'Test mode' : 'Not configured'} health={data.config.paymentsMode === 'live' ? 'ok' : isProd ? 'bad' : 'warn'} />
          <Row label="Email (Resend)" value={data.config.emailConfigured ? 'Configured' : 'Not configured'} health={data.config.emailConfigured ? 'ok' : 'warn'} hint="Needed for customer receipts and admin alert emails." />
          <Row label="Database latency" value={`${data.firestoreMs} ms`} health={data.firestoreMs < 1500 ? 'ok' : 'warn'} hint="Time to run this page's four status queries." />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-900">Background jobs</h3>
          <button type="button" onClick={reload} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Refresh status">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          <Row
            label="Reconciliation (every 15 min)"
            value={recon ? timeAgo(recon.lastRunAt) : 'Never run'}
            health={!recon ? (isProd ? 'bad' : 'warn') : !recon.ok || reconAgeMin > 45 ? 'bad' : 'ok'}
            hint={recon?.summary}
          />
          <Row
            label="Provider balance refresh (every 15 min)"
            value={data.jobs.balanceRefresh ? timeAgo(data.jobs.balanceRefresh.lastRunAt) : 'Never run'}
            health={data.jobs.balanceRefresh ? (data.jobs.balanceRefresh.ok ? 'ok' : 'bad') : 'warn'}
            hint={data.jobs.balanceRefresh?.summary}
          />
          <Row
            label="Provider log cleanup (daily)"
            value={data.jobs.providerCleanup ? timeAgo(data.jobs.providerCleanup.lastRunAt) : 'Never run'}
            health={data.jobs.providerCleanup ? (data.jobs.providerCleanup.ok ? 'ok' : 'bad') : 'warn'}
            hint={data.jobs.providerCleanup?.summary}
          />
        </div>
      </Card>

      <Card className="p-6 xl:col-span-2">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Queues &amp; recovery</h3>
        <p className="text-xs text-slate-500 mb-3">
          “Unknown” messages hold units until the provider confirms or denies them. Reconciliation resolves them; stranded
          queued batches never reserved units and are safe to clean up.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          {[
            ['Unknown messages', data.queues.unknownRecords],
            ['Unknown > 1 hour', data.queues.unknownOlderThanHour],
            ['Units held by unknown', data.queues.unitsHeldByUnknown],
            ['Stranded queued batches', data.queues.strandedQueuedBatches],
            ['Pending payments', data.queues.pendingPayments],
          ].map(([label, n]) => (
            <div key={label as string} className="bg-slate-50 rounded-lg p-3">
              <div className="text-[11px] text-slate-500">{label}</div>
              <div className="text-lg font-bold text-slate-900">{(n as number).toLocaleString()}</div>
            </div>
          ))}
        </div>
        {isSuper ? (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={!!action.busy} onClick={() => run('/admin/sms/reconcile', 'Reconciliation', { olderThanMinutes: 30, limit: 200, dryRun: false })} className="px-3.5 py-2 rounded-lg bg-[#1976d2] text-white text-xs font-semibold disabled:opacity-50">
              {action.busy === 'Reconciliation' ? 'Running…' : 'Run reconciliation now'}
            </button>
            <button type="button" disabled={!!action.busy} onClick={() => run('/admin/sms/cleanup-orphans', 'Cleanup', { olderThanMinutes: 10, limit: 200, dryRun: false })} className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-50">
              {action.busy === 'Cleanup' ? 'Running…' : 'Clean up stranded batches'}
            </button>
            {action.result && <span role="status" className="text-xs text-slate-600">{action.result}</span>}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">Recovery actions are available to super admins.</p>
        )}
        <p className="text-[11px] text-slate-400 mt-4">
          External uptime monitors can poll <code className="font-mono">GET /health/ready</code> (checks the database; returns 503 when unhealthy).
        </p>
      </Card>
    </div>
  );
}
