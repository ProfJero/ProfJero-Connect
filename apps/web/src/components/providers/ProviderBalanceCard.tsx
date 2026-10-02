import { useState } from 'react';
import { Wallet, RefreshCw, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { apiFetch, ApiError } from '../../lib/api';
import { splitDateTime } from '../../lib/datetime';
import { cn } from '../../lib/utils';
import type { Provider, ProviderResponse } from '@profjero/shared';

interface Props {
  provider: Provider;
  onChanged: () => void;
}

export function ProviderBalanceCard({ provider, onChanged }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await apiFetch<ProviderResponse>(
        `/admin/providers/${provider.id}/refresh-balance`,
        { method: 'POST', body: '{}' },
      );
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Refresh failed.',
      );
    } finally {
      setRefreshing(false);
    }
  };

  const lastChecked = provider.balanceCheckedAt
    ? splitDateTime(provider.balanceCheckedAt)
    : null;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Balance</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live from the provider account.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition disabled:opacity-50 shrink-0"
        >
          <RefreshCw
            className={cn('w-3 h-3', refreshing && 'animate-spin')}
            strokeWidth={2.5}
          />
          {refreshing ? 'Checking…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-[10px] text-slate-500 font-medium">Credits</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">
            {provider.credits !== null
              ? provider.credits.toLocaleString()
              : '—'}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-[10px] text-slate-500 font-medium">
            Main balance
          </div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">
            {provider.mainBalanceGhs !== null
              ? `GHS ${provider.mainBalanceGhs.toFixed(2)}`
              : '—'}
          </div>
        </div>
      </div>

      {lastChecked && (
        <div className="mt-3 text-[10px] text-slate-500">
          Last checked {lastChecked.date} {lastChecked.time}
        </div>
      )}
    </Card>
  );
}