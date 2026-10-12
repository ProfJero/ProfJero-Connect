import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { AuthCard } from '../../components/auth/AuthCard';

/** Where the email sign-in / sign-up link lands. */
export function EmailLinkPage() {
  const { isReady, completeEmailLink } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<'working' | 'needs_email' | 'error'>('working');
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const started = useRef(false);

  const finish = async (typed?: string) => {
    setState('working');
    setError(null);
    try {
      const r = await completeEmailLink(typed);
      if (r === 'needs_email') setState('needs_email');
      else navigate(r === 'ok' ? '/dashboard' : '/complete-setup', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign you in.');
      setState('error');
    }
  };

  useEffect(() => {
    if (!isReady || started.current) return;
    started.current = true;
    void finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void finish(email);
  };

  return (
    <AuthCard title="Signing you in" subtitle="ProfJero Connect">
      {state === 'working' && (
        <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Loader2 className="w-5 h-5 animate-spin text-[#1764e0]" /> Confirming your link…
        </p>
      )}
      {state === 'needs_email' && (
        <form onSubmit={onSubmit} className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            You opened the link on a different device or browser. For your security, enter the email address the link was sent to.
          </p>
          <label htmlFor="link-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Email address</label>
          <input
            id="link-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full px-3 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          />
          <button type="submit" className="w-full bg-[#1a6cf0] hover:bg-[#155cd0] text-white font-semibold py-2.5 rounded-lg text-sm">
            Continue
          </button>
        </form>
      )}
      {state === 'error' && (
        <div className="space-y-4">
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          <Link to="/login" className="inline-block bg-[#1a6cf0] hover:bg-[#155cd0] text-white font-semibold py-2.5 px-4 rounded-lg text-sm">
            Back to sign in
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
