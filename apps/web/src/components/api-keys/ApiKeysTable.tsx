import { useState } from 'react';
import { Key, Shield, Ban } from 'lucide-react';
import { Card } from '../ui/Card';
import { TableScroll } from '../ui/TableScroll';
import { cn } from '../../lib/utils';
import { splitDateTime } from '../../lib/datetime';
import { apiFetch, ApiError } from '../../lib/api';
import type { ApiKey } from '@profjero/shared';

interface Props {
  apiKeys: ApiKey[];
  loading: boolean;
  onChanged: () => void;
}

function summarizeRecipients(key: ApiKey): string {
  if (key.kind !== 'publishable') return '—';
  if (key.recipientMode === 'any') return 'Any recipient';
  if (key.recipientList.length === 0) return '(none configured)';
  if (key.recipientMode === 'allowlist') {
    return `${key.recipientList.length} number${key.recipientList.length === 1 ? '' : 's'}`;
  }
  // prefix
  return `${key.recipientList.length} prefix${key.recipientList.length === 1 ? '' : 'es'}`;
}

export function ApiKeysTable({ apiKeys, loading, onChanged }: Props) {
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRevoke = async (key: ApiKey) => {
    setBusyId(key.id);
    setError(null);
    try {
      await apiFetch(`/admin/projects/${key.projectId}/api-keys/${key.id}`, {
        method: 'DELETE',
      });
      setConfirmRevokeId(null);
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Revoke failed.',
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800">
          API keys
          <span className="ml-2 text-slate-400 font-normal text-xs">
            {apiKeys.length}
          </span>
        </h3>
      </div>

      {error && (
        <div className="px-4 py-2 border-b border-rose-100 bg-rose-50 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 space-y-3">
          <div className="h-8 bg-slate-100 rounded animate-pulse" />
          <div className="h-8 bg-slate-100 rounded animate-pulse" />
        </div>
      ) : (
        <TableScroll>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/70 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Kind</th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Prefix</th>
                <th className="py-3 px-3">Recipients</th>
                <th className="py-3 px-3 text-right">Rate limit</th>
                <th className="py-3 px-3 text-right">Spend</th>
                <th className="py-3 px-3">Last used</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {apiKeys.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                    No API keys yet.
                  </td>
                </tr>
              )}
              {apiKeys.map((k) => {
                const isRevoked = k.status === 'revoked';
                const isConfirming = confirmRevokeId === k.id;
                const busy = busyId === k.id;
                const lastUsed = k.lastUsedAt
                  ? splitDateTime(k.lastUsedAt)
                  : null;

                return (
                  <tr
                    key={k.id}
                    className={cn(
                      'transition-colors',
                      isRevoked ? 'opacity-60' : 'hover:bg-slate-50/70',
                    )}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border',
                          k.kind === 'secret'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200',
                        )}
                      >
                        {k.kind === 'secret' ? (
                          <Shield className="w-3 h-3" strokeWidth={2.5} />
                        ) : (
                          <Key className="w-3 h-3" strokeWidth={2.5} />
                        )}
                        {k.kind === 'secret' ? 'Secret' : 'Publishable'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {k.name}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {k.keyPrefix}…
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {summarizeRecipients(k)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 whitespace-nowrap">
                      {k.kind === 'publishable'
                        ? `${k.rateLimitPerMinute}/min`
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {k.kind === 'publishable' ? (
                        <div className="text-[11px]">
                          <span className="font-semibold text-slate-800">
                            {k.lifetimeUnitsSpent}
                          </span>
                          <span className="text-slate-400">
                            {' '}
                            / {k.lifetimeUnitCap}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {lastUsed ? (
                        <>
                          <div>{lastUsed.date}</div>
                          <div className="text-[10px]">{lastUsed.time}</div>
                        </>
                      ) : (
                        'Never'
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                          isRevoked
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        )}
                      >
                        {isRevoked ? 'Revoked' : 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {isRevoked ? (
                        <span className="text-[11px] text-slate-400">—</span>
                      ) : isConfirming ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRevoke(k)}
                            disabled={busy}
                            className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-semibold disabled:opacity-50 transition"
                          >
                            {busy ? 'Revoking…' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRevokeId(null)}
                            disabled={busy}
                            className="px-2 py-1 rounded border border-slate-200 text-slate-600 text-[10px] font-semibold disabled:opacity-50 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRevokeId(k.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-rose-200 text-rose-600 text-[10px] font-semibold hover:bg-rose-50 transition"
                        >
                          <Ban className="w-3 h-3" strokeWidth={2.5} />
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      )}
    </Card>
  );
}