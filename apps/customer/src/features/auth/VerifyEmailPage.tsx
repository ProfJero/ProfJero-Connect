import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MailCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { AuthCard } from '../../components/auth/AuthCard';

/**
 * Password sign-ups land here until they click the link in their inbox.
 * Re-checks every few seconds (and when the tab regains focus), so the
 * account opens by itself once the email is confirmed — even if the link
 * was opened on another device.
 */
export function VerifyEmailPage() {
  const { isReady, isAuthenticated, needsVerification, needsSetup, firebaseEmail, checkVerification, resendVerification, logout } = useAuth();
  const navigate = useNavigate();
  const [cooldown, setCooldown] = useState(0);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    if (!isReady) return;
    if (isAuthenticated) navigate('/dashboard', { replace: true });
    else if (needsSetup) navigate('/complete-setup', { replace: true });
    else if (!needsVerification) navigate('/signup', { replace: true });
  }, [isReady, isAuthenticated, needsSetup, needsVerification, navigate]);

  useEffect(() => {
    if (!needsVerification) return;
    const check = async () => {
      if (busy.current || document.visibilityState === 'hidden') return;
      busy.current = true;
      try {
        await checkVerification();
      } catch {
        /* retry on the next tick */
      } finally {
        busy.current = false;
      }
    };
    void check();
    const id = window.setInterval(check, 4000);
    window.addEventListener('focus', check);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', check);
    };
  }, [needsVerification, checkVerification]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const resend = async () => {
    setNote(null);
    try {
      await resendVerification();
      setCooldown(60);
      setNote({ ok: true, text: 'Sent. Check your inbox (and spam folder).' });
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : 'Could not resend.' });
    }
  };

  const checkNow = async () => {
    setChecking(true);
    setNote(null);
    try {
      const ok = await checkVerification();
      if (!ok) setNote({ ok: false, text: "We haven't seen the confirmation yet. Open the link in the email, then try again." });
    } finally {
      setChecking(false);
    }
  };

  return (
    <AuthCard title="Confirm your email" subtitle="One step to activate your account">
      <div className="text-center">
        <span className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-500/15 text-[#1764e0] dark:text-blue-300 flex items-center justify-center mx-auto">
          <MailCheck className="w-7 h-7" strokeWidth={2} />
        </span>
        <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">Check your inbox</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          We sent a confirmation link to <strong className="break-all">{firebaseEmail ?? 'your email'}</strong>. Open it to activate your
          account — this page continues on its own.
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Waiting for confirmation…
        </p>
      </div>

      {note && (
        <p role="status" className={`mt-4 text-xs text-center ${note.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-300'}`}>
          {note.text}
        </p>
      )}

      <div className="mt-6 space-y-2">
        <button
          type="button"
          onClick={checkNow}
          disabled={checking}
          className="w-full bg-[#1a6cf0] hover:bg-[#155cd0] text-white font-semibold py-2.5 rounded-lg text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} I've confirmed my email
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="w-full border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend the email'}
        </button>
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/signup', { replace: true });
          }}
          className="w-full text-xs font-semibold text-slate-500 dark:text-slate-400 hover:underline py-2"
        >
          Use a different email
        </button>
      </div>
      <p className="mt-4 text-[11px] text-center text-slate-500 dark:text-slate-400">
        We confirm every email so each account belongs to a real person — that keeps free credit and Sender IDs from being abused.
      </p>
    </AuthCard>
  );
}
