import { useState, type FormEvent } from 'react';
import { UserPlus, Copy, Check, KeyRound } from 'lucide-react';
import type { AdminRole } from '@profjero/shared';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { TableScroll } from '../ui/TableScroll';
import { Field, inputCls } from './fields';
import { apiFetch, ApiError } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { timeAgo } from '../../lib/datetime';
import { cn } from '../../lib/utils';

interface AdminRow {
  uid: string;
  email: string;
  displayName: string | null;
  role: AdminRole;
  status: 'active' | 'disabled';
  createdAt: string;
  lastSeenAt: string | null;
}

const ROLE_INFO: Record<AdminRole, { label: string; can: string }> = {
  super_admin: { label: 'Super Admin', can: 'Everything, including team, security settings and ledger operations.' },
  admin: { label: 'Admin', can: 'Projects, API keys, Sender IDs, sending, pricing, most settings.' },
  finance: { label: 'Finance', can: 'Payments, wallet credits/debits, pricing, payment settings.' },
  support: { label: 'Support', can: 'Read-only access to everything, for helping customers.' },
  viewer: { label: 'Viewer', can: 'Read-only access to everything.' },
};
const ROLES = Object.keys(ROLE_INFO) as AdminRole[];

/** Settings → Team: invite operators, change roles, disable access. */
export function TeamSection() {
  const { user } = useAuth();
  const isSuper = user?.role === 'super_admin';
  const { data, loading, error, reload } = useApi<{ admins: AdminRow[] }>('/admin/admins');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [link, setLink] = useState<{ email: string; url: string; emailed: boolean } | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const update = async (uid: string, patch: Partial<Pick<AdminRow, 'role' | 'status'>>) => {
    setBusy(uid);
    setRowError(null);
    try {
      await apiFetch(`/admin/admins/${encodeURIComponent(uid)}`, { method: 'PATCH', body: JSON.stringify(patch) });
      reload();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : 'Update failed.');
    } finally {
      setBusy(null);
    }
  };

  const resetLink = async (row: AdminRow) => {
    setBusy(row.uid);
    setRowError(null);
    try {
      const res = await apiFetch<{ setupLink: string; emailed: boolean }>(`/admin/admins/${encodeURIComponent(row.uid)}/reset-link`, { method: 'POST' });
      setLink({ email: row.email, url: res.setupLink, emailed: res.emailed });
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : 'Could not create link.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <div className="px-6 py-5 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Team / Admin users</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Everyone who can sign in to this dashboard. {isSuper ? '' : 'Only super admins can make changes.'}
          </p>
        </div>
        {isSuper && (
          <button type="button" onClick={() => setInviteOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1976d2] hover:bg-[#1565c0] text-white text-xs font-semibold">
            <UserPlus className="w-3.5 h-3.5" /> Invite admin
          </button>
        )}
      </div>

      {rowError && <p role="alert" className="mx-6 mt-4 text-xs text-rose-600">{rowError}</p>}

      {loading && !data ? (
        <p className="px-6 py-8 text-xs text-slate-500">Loading team…</p>
      ) : error ? (
        <p className="px-6 py-8 text-xs text-rose-600">{error.message}</p>
      ) : (
        <TableScroll>
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/70">
              <tr>
                <th className="px-6 py-3">Person</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last active</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.admins.map((a) => {
                const self = a.uid === user?.uid;
                return (
                  <tr key={a.uid} className={cn(a.status === 'disabled' && 'opacity-60')}>
                    <td className="px-6 py-3">
                      <div className="font-semibold text-slate-800">{a.displayName ?? '—'} {self && <span className="text-[10px] text-slate-500 font-normal">(you)</span>}</div>
                      <div className="text-[11px] text-slate-500">{a.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {isSuper && !self ? (
                        <select
                          aria-label={`Role for ${a.email}`}
                          value={a.role}
                          disabled={busy === a.uid}
                          onChange={(e) => update(a.uid, { role: e.target.value as AdminRole })}
                          className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_INFO[r].label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-medium text-slate-700">{ROLE_INFO[a.role].label}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold', a.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', a.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400')} />
                        {a.status === 'active' ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{a.lastSeenAt ? timeAgo(a.lastSeenAt) : 'Never'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {isSuper && !self && (
                        <div className="flex justify-end gap-3">
                          <button type="button" disabled={busy === a.uid} onClick={() => resetLink(a)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline">
                            <KeyRound className="w-3 h-3" /> Reset link
                          </button>
                          <button
                            type="button"
                            disabled={busy === a.uid}
                            onClick={() => update(a.uid, { status: a.status === 'active' ? 'disabled' : 'active' })}
                            className={cn('text-[11px] font-semibold hover:underline', a.status === 'active' ? 'text-rose-600' : 'text-emerald-700')}
                          >
                            {a.status === 'active' ? 'Disable' : 'Re-enable'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      )}

      <div className="px-6 py-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {ROLES.map((r) => (
          <div key={r} className="text-[11px]">
            <div className="font-bold text-slate-700">{ROLE_INFO[r].label}</div>
            <div className="text-slate-500 leading-snug">{ROLE_INFO[r].can}</div>
          </div>
        ))}
      </div>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={(email, url, emailed) => {
          setInviteOpen(false);
          setLink({ email, url, emailed });
          reload();
        }}
      />
      <LinkModal link={link} onClose={() => setLink(null)} />
    </Card>
  );
}

function InviteModal({ open, onClose, onInvited }: { open: boolean; onClose: () => void; onInvited: (email: string, url: string, emailed: boolean) => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<AdminRole>('support');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ setupLink: string; emailed: boolean }>('/admin/admins', {
        method: 'POST',
        body: JSON.stringify({ email, displayName: name, role }),
      });
      onInvited(email, res.setupLink, res.emailed);
      setEmail('');
      setName('');
      setRole('support');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invite failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title="Invite admin" onClose={onClose} locked={busy}>
      <form onSubmit={submit} className="p-5 space-y-4">
        <Field label="Email" htmlFor="inv-email">
          <input id="inv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Name" htmlFor="inv-name">
          <input id="inv-name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Role" htmlFor="inv-role" hint={ROLE_INFO[role].can}>
          <select id="inv-role" value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className={inputCls}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_INFO[r].label}</option>
            ))}
          </select>
        </Field>
        {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">Cancel</button>
          <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-[#1976d2] text-white text-xs font-semibold disabled:opacity-60">
            {busy ? 'Inviting…' : 'Send invite'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function LinkModal({ link, onClose }: { link: { email: string; url: string; emailed: boolean } | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <Modal open={link !== null} title="Password setup link" onClose={() => { setCopied(false); onClose(); }}>
      {link && (
        <div className="p-5 space-y-3 text-xs text-slate-600">
          <p>
            {link.emailed
              ? <>We emailed this link to <strong>{link.email}</strong>. You can also share it directly:</>
              : <>Email isn't configured, so share this link with <strong>{link.email}</strong> yourself (e.g. by chat). They'll set a password, then sign in.</>}
          </p>
          <div className="flex gap-2">
            <code className="flex-1 min-w-0 break-all bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] select-all">{link.url}</code>
            <button
              type="button"
              aria-label="Copy link"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link.url);
                  setCopied(true);
                } catch {
                  /* select-all fallback */
                }
              }}
              className="px-3 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">The link expires after about an hour. Use “Reset link” to issue a new one.</p>
        </div>
      )}
    </Modal>
  );
}
