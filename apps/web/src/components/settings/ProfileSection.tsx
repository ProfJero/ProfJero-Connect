import { useState, type FormEvent } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { firebaseAuth } from '../../lib/firebase';
import { apiFetch, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Field, SectionCard, inputCls } from './fields';

function authMessage(err: unknown): string {
  const code = (err as { code?: string } | null)?.code ?? '';
  if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'Your current password is incorrect.';
  if (code.includes('weak-password')) return 'Choose a stronger password (at least 8 characters).';
  if (code.includes('too-many-requests')) return 'Too many attempts. Try again in a few minutes.';
  if (code.includes('requires-recent-login')) return 'Please sign out and in again, then retry.';
  return 'Could not change your password.';
}

/** Settings → My profile: display name and password for the signed-in admin. */
export function ProfileSection() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  const nameValue = name ?? user?.displayName ?? '';

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    setNameMsg(null);
    try {
      await apiFetch('/admin/me', { method: 'PATCH', body: JSON.stringify({ displayName: nameValue.trim() }) });
      await refresh();
      setName(null);
      setNameMsg({ ok: true, text: 'Name updated.' });
    } catch (err) {
      setNameMsg({ ok: false, text: err instanceof ApiError ? err.message : 'Update failed.' });
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (next.length < 8) return setPwMsg({ ok: false, text: 'New password must be at least 8 characters.' });
    if (next !== confirm) return setPwMsg({ ok: false, text: 'The new passwords do not match.' });
    const fbUser = firebaseAuth.currentUser;
    if (!fbUser?.email) return setPwMsg({ ok: false, text: 'You are not signed in.' });
    setSavingPw(true);
    try {
      await reauthenticateWithCredential(fbUser, EmailAuthProvider.credential(fbUser.email, current));
      await updatePassword(fbUser, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      setPwMsg({ ok: true, text: 'Password changed.' });
    } catch (err) {
      setPwMsg({ ok: false, text: authMessage(err) });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <SectionCard title="My profile" description="How you appear in the dashboard and the audit log.">
        <form onSubmit={saveName} className="space-y-4">
          <Field label="Display name" htmlFor="me-name">
            <input id="me-name" required maxLength={100} value={nameValue} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Email" htmlFor="me-email" hint="Your sign-in email. Ask a super admin to change it.">
            <input id="me-email" value={user?.email ?? ''} disabled className={inputCls} />
          </Field>
          <Field label="Role" htmlFor="me-role">
            <input id="me-role" value={user?.role.replace('_', ' ') ?? ''} disabled className={inputCls + ' capitalize'} />
          </Field>
          <div className="flex items-center justify-between gap-3">
            <span aria-live="polite" className={nameMsg?.ok ? 'text-xs text-emerald-600' : 'text-xs text-rose-600'}>{nameMsg?.text}</span>
            <button type="submit" disabled={savingName || nameValue.trim() === (user?.displayName ?? '')} className="px-4 py-2 rounded-lg bg-[#1976d2] text-white text-xs font-semibold disabled:opacity-50">
              {savingName ? 'Saving…' : 'Save name'}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Password" description="Use at least 8 characters you don't use anywhere else.">
        <form onSubmit={savePassword} className="space-y-4">
          <Field label="Current password" htmlFor="pw-cur">
            <input id="pw-cur" type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
          </Field>
          <Field label="New password" htmlFor="pw-new">
            <input id="pw-new" type="password" required minLength={8} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Confirm new password" htmlFor="pw-conf">
            <input id="pw-conf" type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
          </Field>
          <div className="flex items-center justify-between gap-3">
            <span aria-live="polite" className={pwMsg?.ok ? 'text-xs text-emerald-600' : 'text-xs text-rose-600'}>{pwMsg?.text}</span>
            <button type="submit" disabled={savingPw} className="px-4 py-2 rounded-lg bg-[#1976d2] text-white text-xs font-semibold disabled:opacity-50">
              {savingPw ? 'Changing…' : 'Change password'}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
