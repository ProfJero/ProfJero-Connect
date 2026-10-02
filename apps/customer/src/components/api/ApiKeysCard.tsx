import { useState, type FormEvent } from 'react';
import { KeyRound, Plus, Copy, Check, AlertTriangle } from 'lucide-react';
import { Modal, ConfirmModal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { EmptyState, ErrorState, Notice, SkeletonRows, Spinner } from '../ui/States';
import { btnPrimary, btnSecondary, cardClass, inputClass, labelClass } from '../ui/buttons';
import { TableScroll } from '../ui/TableScroll';
import { api, errorMessage } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useAccount } from '../../lib/account';
import { formatDate, timeAgo } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { CustomerApiKey } from '../../lib/types';

export function ApiKeysCard() {
  const { data, loading, error, refresh } = useApi<{ apiKeys: CustomerApiKey[] }>('/customer/api-keys');
  const { refreshNotifications } = useAccount();
  const [createOpen, setCreateOpen] = useState(false);
  const [revoking, setRevoking] = useState<CustomerApiKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const keys = data?.apiKeys ?? [];
  const active = keys.filter((k) => k.status === 'active');

  const revoke = async () => {
    if (!revoking) return;
    setBusy(true);
    setRevokeError(null);
    try {
      await api.post(`/customer/api-keys/${encodeURIComponent(revoking.id)}/revoke`);
      setRevoking(null);
      refresh();
    } catch (err) {
      setRevokeError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={cn(cardClass, 'overflow-hidden')}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <KeyRound className="w-4 h-4 text-[#1a6cf0] dark:text-blue-400" strokeWidth={2} />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">API keys</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Secret keys give full access to your wallet and sending. Use them only on your server.
            </p>
          </div>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className={btnPrimary}>
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Create key
        </button>
      </div>

      {loading && !data ? (
        <SkeletonRows rows={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : keys.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No API keys yet"
          description="Create a key to send SMS and check your balance from your own application."
        />
      ) : (
        <TableScroll>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-5 whitespace-nowrap">Name</th>
                <th className="py-3 px-4 whitespace-nowrap">Key</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 whitespace-nowrap">Created</th>
                <th className="py-3 px-4 whitespace-nowrap">Last used</th>
                <th className="py-3 px-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
              {keys.map((k) => (
                <tr key={k.id}>
                  <td className="py-3 px-5 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{k.name}</td>
                  <td className="py-3 px-4 font-mono whitespace-nowrap">{k.maskedKey}</td>
                  <td className="py-3 px-4">
                    <Badge tone={k.status === 'active' ? 'success' : 'neutral'} label={k.status === 'active' ? 'Active' : 'Revoked'} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">{formatDate(k.createdAt)}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{k.lastUsedAt ? timeAgo(k.lastUsedAt) : 'Never'}</td>
                  <td className="py-3 px-4 text-right">
                    {k.status === 'active' && (
                      <button type="button" onClick={() => setRevoking(k)} className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline">
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}

      <CreateKeyModal
        open={createOpen}
        atLimit={active.length >= 5}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          refresh();
          refreshNotifications();
        }}
      />
      <ConfirmModal
        open={revoking !== null}
        title={`Revoke "${revoking?.name ?? ''}"?`}
        message="Any application using this key stops working immediately. This can't be undone — you'd need to create a new key."
        confirmLabel="Revoke key"
        busy={busy}
        error={revokeError}
        onConfirm={revoke}
        onClose={() => {
          setRevoking(null);
          setRevokeError(null);
        }}
      />
    </section>
  );
}

function CreateKeyModal({
  open,
  atLimit,
  onClose,
  onCreated,
}: {
  open: boolean;
  atLimit: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const close = () => {
    setName('');
    setError(null);
    setPlaintext(null);
    setCopied(false);
    onClose();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ apiKey: CustomerApiKey & { plaintext: string } }>('/customer/api-keys', {
        name: name.trim(),
      });
      setPlaintext(res.apiKey.plaintext);
      onCreated();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!plaintext) return;
    try {
      await navigator.clipboard.writeText(plaintext);
      setCopied(true);
    } catch {
      /* Clipboard blocked — the key is selectable in the box. */
    }
  };

  return (
    <Modal open={open} title={plaintext ? 'Your new API key' : 'Create API key'} onClose={close}>
      {plaintext ? (
        <div className="space-y-4">
          <Notice tone="warning">
            <span className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2} />
              <span>
                Copy this key now — <strong>it won't be shown again</strong>. Store it in your server's environment
                variables. Never put it in a website, mobile app, or public code repository.
              </span>
            </span>
          </Notice>
          <div className="flex items-stretch gap-2">
            <code className="flex-1 min-w-0 break-all select-all font-mono text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-slate-100">
              {plaintext}
            </code>
            <button type="button" onClick={copy} className={btnSecondary} aria-label="Copy key">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={close} className={btnPrimary}>
              I've stored it safely
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {atLimit ? (
            <Notice tone="warning">You already have 5 active keys. Revoke one you no longer use first.</Notice>
          ) : (
            <div>
              <label htmlFor="key-name" className={labelClass}>Key name</label>
              <input
                id="key-name"
                required
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production server"
                className={inputClass}
              />
              <p className="text-[11px] text-slate-400 mt-1">A label so you can tell keys apart later.</p>
            </div>
          )}
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button type="button" onClick={close} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={busy || atLimit} className={btnPrimary}>
              {busy && <Spinner />}
              Create key
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
