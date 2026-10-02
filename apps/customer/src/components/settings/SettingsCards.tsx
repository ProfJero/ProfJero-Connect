import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { User, Building2, Lock, Bell, Wallet, Code2, Save, ChevronRight, Mail, KeyRound } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Notice, Spinner } from '../ui/States';
import { btnPrimary, btnSecondary, inputClass, labelClass } from '../ui/buttons';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useProfile } from '../../lib/hooks';
import { useApi } from '../../lib/useApi';
import { useWallet } from '../../lib/account';
import { formatDate } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { CustomerApiKey } from '../../lib/types';

/* ---------- Shared primitives ---------- */

function CardShell({
  icon: Icon,
  title,
  subtitle,
  children,
  id,
}: {
  icon: typeof User;
  title: string;
  subtitle: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs scroll-mt-24">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-[#1a6cf0] dark:text-blue-400 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange, disabled, label }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cn(
        'relative inline-flex items-center rounded-full w-9 h-5 shrink-0 transition-colors disabled:opacity-60',
        on ? 'bg-[#1a6cf0]' : 'bg-slate-300 dark:bg-slate-700',
      )}
    >
      <span className={cn('inline-block w-4 h-4 rounded-full bg-white shadow transform transition-transform', on ? 'translate-x-4' : 'translate-x-0.5')} />
    </button>
  );
}

function LinkRow({ to, icon: Icon, label, description }: { to: string; icon: typeof User; label: string; description: string }) {
  return (
    <Link to={to} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <span className="flex items-center gap-3 min-w-0">
        <Icon className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={2} />
        <span className="min-w-0">
          <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">{label}</span>
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">{description}</span>
        </span>
      </span>
      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2} />
    </Link>
  );
}

/* ---------- Profile ---------- */

export function ProfileCard() {
  const { data, loading, saving, update } = useProfile();
  const { refresh: refreshAuth } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const c = data?.customer;
  const nameValue = name ?? c?.displayName ?? '';
  const phoneValue = phone ?? c?.phone ?? '';
  const initials = nameValue.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase() || '?';
  const dirty = !!c && (nameValue.trim() !== c.displayName || (phoneValue.trim() || null) !== c.phone);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await update({ displayName: nameValue.trim(), phone: phoneValue.trim() || null });
      setName(null);
      setPhone(null);
      await refreshAuth();
      setMessage({ tone: 'success', text: 'Profile saved.' });
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) });
    }
  };

  return (
    <CardShell id="profile" icon={User} title="Profile" subtitle="Your personal details.">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-sm font-bold">
            {loading ? '·' : initials}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Member since {c ? formatDate(c.createdAt) : '—'}
          </div>
        </div>
        <div>
          <label htmlFor="p-name" className={labelClass}>Full name</label>
          <input id="p-name" required maxLength={100} disabled={loading} value={nameValue} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="p-email" className={labelClass}>Email</label>
          <input id="p-email" type="email" value={c?.email ?? ''} disabled className={inputClass} />
          <p className="text-[10px] text-slate-400 mt-1">Your sign-in email. Contact support to change it.</p>
        </div>
        <div>
          <label htmlFor="p-phone" className={labelClass}>Phone (optional)</label>
          <input id="p-phone" type="tel" maxLength={20} disabled={loading} value={phoneValue} onChange={(e) => setPhone(e.target.value)} placeholder="+233 24 123 4567" className={inputClass} />
        </div>
        {message && <Notice tone={message.tone}>{message.text}</Notice>}
        <div className="flex justify-end">
          <button type="submit" disabled={!dirty || saving} className={btnPrimary}>
            {saving ? <Spinner /> : <Save className="w-3.5 h-3.5" strokeWidth={2} />}
            Save changes
          </button>
        </div>
      </form>
    </CardShell>
  );
}

/* ---------- Organisation ---------- */

export function OrganisationCard() {
  const { user } = useAuth();
  return (
    <CardShell id="organisation" icon={Building2} title="Organisation" subtitle="The business you send messages for.">
      <div className="space-y-3">
        <div className="text-xs">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Organisation name</div>
          <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{user?.companyName ?? '—'}</div>
        </div>
        <LinkRow to="/settings/organisation" icon={Building2} label="Organisation profile" description="Name, contact person and account ID" />
        <LinkRow to="/messaging/sender-ids" icon={Mail} label="Sender IDs" description="Names your recipients see" />
      </div>
    </CardShell>
  );
}

/* ---------- Security ---------- */

export function SecurityCard() {
  const { changePassword, resetPassword, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      setError('The new passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await changePassword(current, next);
      close();
      setMessage('Password changed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <CardShell id="security" icon={Lock} title="Security" subtitle="Keep your account safe.">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">Password</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Use at least 8 characters you don't use elsewhere.</div>
          </div>
          <button type="button" onClick={() => setOpen(true)} className={btnSecondary}>
            Change
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">Forgot your password?</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">We'll email a reset link to {user?.email}.</div>
          </div>
          <button
            type="button"
            onClick={async () => {
              setMessage(null);
              try {
                await resetPassword(user?.email ?? '');
                setMessage('Reset link sent — check your email.');
              } catch (err) {
                setMessage(err instanceof Error ? err.message : 'Could not send reset email.');
              }
            }}
            className={btnSecondary}
          >
            Send link
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">Two-factor authentication</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Coming soon.</div>
          </div>
        </div>
        {message && <Notice tone="info">{message}</Notice>}
      </div>

      <Modal open={open} title="Change password" onClose={close}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="pw-current" className={labelClass}>Current password</label>
            <input id="pw-current" type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="pw-new" className={labelClass}>New password</label>
            <input id="pw-new" type="password" required minLength={8} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="pw-confirm" className={labelClass}>Confirm new password</label>
            <input id="pw-confirm" type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
          </div>
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button type="button" onClick={close} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={busy} className={btnPrimary}>
              {busy && <Spinner />}
              Change password
            </button>
          </div>
        </form>
      </Modal>
    </CardShell>
  );
}

/* ---------- Notifications ---------- */

export function NotificationsCard() {
  const { data, refresh } = useProfile();
  const [pending, setPending] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const on = pending ?? data?.customer.emailNotifications ?? true;

  const toggle = async (next: boolean) => {
    setPending(next);
    setError(null);
    try {
      await api.put('/customer/me/preferences', { emailNotifications: next });
      refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(null);
    }
  };

  return (
    <CardShell id="notifications" icon={Bell} title="Notifications" subtitle="How we keep you informed.">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">Email notifications</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Payment receipts, Sender ID decisions, low-balance alerts and new API keys.
            </div>
          </div>
          <Toggle on={on} onChange={toggle} disabled={!data || pending !== null} label="Email notifications" />
        </div>
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">In-app notifications</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Always on — see the bell at the top of the page.</div>
          </div>
          <Toggle on onChange={() => {}} disabled label="In-app notifications" />
        </div>
        <LinkRow to="/wallet" icon={Wallet} label="Low-balance alert level" description="Set it on the Wallet page" />
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </CardShell>
  );
}

/* ---------- Billing ---------- */

export function BillingCard() {
  const { data: wallet } = useWallet();
  return (
    <CardShell id="billing" icon={Wallet} title="Billing" subtitle="Pay as you go — no subscription.">
      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Wallet balance</div>
          <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            {wallet ? `${wallet.availableUnits.toLocaleString()} units` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Buy units with Mobile Money or card whenever you need them.
          </div>
        </div>
        <LinkRow to="/wallet/add-funds" icon={Wallet} label="Add funds" description="Buy a package or a custom amount" />
        <LinkRow to="/transactions" icon={Wallet} label="Payment history" description="Receipts and wallet activity" />
      </div>
    </CardShell>
  );
}

/* ---------- API ---------- */

export function ApiSettingsCard() {
  const { data } = useApi<{ apiKeys: CustomerApiKey[] }>('/customer/api-keys');
  const active = data?.apiKeys.filter((k) => k.status === 'active').length;
  return (
    <CardShell id="api" icon={Code2} title="API" subtitle="Connect your own systems.">
      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Active API keys</div>
          <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{active ?? '—'}</div>
        </div>
        <LinkRow to="/api" icon={KeyRound} label="Manage API keys" description="Create, view and revoke keys" />
      </div>
    </CardShell>
  );
}
