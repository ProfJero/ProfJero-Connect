import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Server, AlertCircle } from 'lucide-react';
import { ProviderBalanceCard } from '../../components/providers/ProviderBalanceCard';
import { ProviderSettingsCard } from '../../components/providers/ProviderSettingsCard';
import { ProviderRequestsTable } from '../../components/providers/ProviderRequestsTable';
import { useApi } from '../../lib/useApi';
import { cn } from '../../lib/utils';
import type {
  Provider,
  ProviderResponse,
  ProviderRequestListResponse,
  ProviderService,
} from '@profjero/shared';

const SERVICE_LABELS: Record<ProviderService, string> = {
  sms: 'SMS',
  data: 'Data Bundles',
  airtime: 'Airtime',
  payment: 'Payments',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  error: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function ProviderDetailPage() {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();

  const providerApi = useApi<ProviderResponse>(
    providerId ? `/admin/providers/${providerId}` : null,
  );
  const requestsApi = useApi<ProviderRequestListResponse>(
    providerId
      ? `/admin/providers/${providerId}/requests?limit=50`
      : null,
  );

  if (!providerId) {
    return (
      <main className="p-4 sm:p-6 lg:p-7 flex-1">
        <div className="text-sm text-slate-500">No provider ID in the URL.</div>
      </main>
    );
  }

  if (providerApi.loading && !providerApi.data) {
    return (
      <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
        <div className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-48 bg-white rounded-xl border border-slate-200 animate-pulse" />
          <div className="h-48 bg-white rounded-xl border border-slate-200 animate-pulse" />
        </div>
      </main>
    );
  }

  if (providerApi.error || !providerApi.data) {
    return (
      <main className="p-4 sm:p-6 lg:p-7 flex-1 space-y-4">
        <button
          onClick={() => navigate('/providers')}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#1976d2] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Providers
        </button>
        <div className="flex items-start gap-2.5 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <div className="font-medium">Could not load provider.</div>
            {providerApi.error && (
              <div className="mt-0.5 text-xs opacity-80">
                {providerApi.error.message}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  const provider: Provider = providerApi.data.provider;
  const requests = requestsApi.data?.requests ?? [];

  const reloadAll = () => {
    providerApi.reload();
    requestsApi.reload();
  };

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      <Link
        to="/providers"
        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#1976d2] transition w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Providers
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Server className="w-6 h-6" strokeWidth={2} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {provider.label}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {provider.id}
                </p>
              </div>
              <div className="flex items-center gap-2 self-start shrink-0">
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border',
                    STATUS_STYLES[provider.status] ?? STATUS_STYLES.inactive,
                  )}
                >
                  {provider.status.charAt(0).toUpperCase() +
                    provider.status.slice(1)}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {SERVICE_LABELS[provider.service]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProviderBalanceCard provider={provider} onChanged={reloadAll} />
        <ProviderSettingsCard provider={provider} onChanged={reloadAll} />
      </div>

      {/* Requests table */}
      <ProviderRequestsTable
        requests={requests}
        loading={requestsApi.loading && !requestsApi.data}
        onRefresh={reloadAll}
      />
    </main>
  );
}