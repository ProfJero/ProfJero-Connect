import { useNavigate } from 'react-router-dom';
import { Server, AlertCircle, ArrowRight } from 'lucide-react';
import { useApi } from '../../lib/useApi';
import { cn } from '../../lib/utils';
import { splitDateTime } from '../../lib/datetime';
import type { Provider, ProviderListResponse, ProviderService } from '@profjero/shared';

const SERVICE_LABELS: Record<ProviderService, string> = {
  sms: 'SMS',
  data: 'Data Bundles',
  airtime: 'Airtime',
  payment: 'Payments',
};

const SERVICE_COLORS: Record<ProviderService, string> = {
  sms: 'bg-blue-50 text-blue-700 border-blue-200',
  data: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  airtime: 'bg-amber-50 text-amber-700 border-amber-200',
  payment: 'bg-purple-50 text-purple-700 border-purple-200',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  error: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function ProvidersListPage() {
  const navigate = useNavigate();
  const api = useApi<ProviderListResponse>('/admin/providers');

  const providers = api.data?.providers ?? [];

  // Group by service so future services slot in naturally.
  const grouped: Record<string, Provider[]> = {};
  for (const p of providers) {
    (grouped[p.service] ??= []).push(p);
  }

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
          <Server className="w-5 h-5" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Providers
          </h1>
          <p className="text-xs text-slate-500">
            Manage service provider connections, balances and costs.
          </p>
        </div>
      </div>

      {api.error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="flex-1">
            <div className="font-medium">Could not load providers.</div>
            <div className="mt-0.5 opacity-80">{api.error.message}</div>
          </div>
          <button
            onClick={() => api.reload()}
            className="text-[11px] font-semibold underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {api.loading && !api.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 bg-white rounded-xl border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      )}

      {!api.loading && providers.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="text-sm text-slate-500">
            No providers configured yet.
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Providers are added when you enable a new service (SMS, Data,
            Airtime, etc.).
          </p>
        </div>
      )}

      {Object.entries(grouped).map(([service, list]) => (
        <section key={service} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">
              {SERVICE_LABELS[service as ProviderService] ?? service}
            </h3>
            <span className="text-[11px] text-slate-500">
              {list.length} provider{list.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((p) => (
              <ProviderCard
                key={p.id}
                provider={p}
                onClick={() => navigate(`/providers/${p.id}`)}
              />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

function ProviderCard({
  provider,
  onClick,
}: {
  provider: Provider;
  onClick: () => void;
}) {
  const balanceUpdated = provider.balanceCheckedAt
    ? splitDateTime(provider.balanceCheckedAt)
    : null;

  return (
    <button
      onClick={onClick}
      className="group text-left bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm p-5 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-semibold border',
                SERVICE_COLORS[provider.service],
              )}
            >
              {SERVICE_LABELS[provider.service]}
            </span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-semibold border',
                STATUS_STYLES[provider.status] ?? STATUS_STYLES.inactive,
              )}
            >
              {provider.status}
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {provider.label}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            {provider.id}
          </div>
        </div>
        <ArrowRight
          className="w-4 h-4 text-slate-300 group-hover:text-[#1976d2] group-hover:translate-x-0.5 transition shrink-0"
          strokeWidth={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
        <div>
          <div className="text-[10px] text-slate-500 font-medium">Credits</div>
          <div className="text-sm font-bold text-slate-800 mt-0.5">
            {provider.credits !== null
              ? provider.credits.toLocaleString()
              : '—'}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 font-medium">
            Cost / unit
          </div>
          <div className="text-sm font-bold text-slate-800 mt-0.5">
            {provider.costPerUnitGhs !== null
              ? `GHS ${provider.costPerUnitGhs.toFixed(4)}`
              : '—'}
          </div>
        </div>
      </div>

      {balanceUpdated && (
        <div className="text-[10px] text-slate-500 mt-3">
          Balance updated {balanceUpdated.date} {balanceUpdated.time}
        </div>
      )}
    </button>
  );
}