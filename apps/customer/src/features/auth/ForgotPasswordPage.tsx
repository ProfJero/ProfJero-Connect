import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { Notice, Spinner } from '../../components/ui/States';
import { useAuth } from '../../lib/auth';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a6cf0] dark:text-blue-400 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
          Back to sign in
        </Link>

        {sent ? (
          <div className="text-center mt-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" strokeWidth={1.75} />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-3">Check your email</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              If an account exists for <strong>{email}</strong>, we've sent a link to reset your password. It may take
              a minute — check your spam folder too.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Reset your password</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter the email you signed up with and we'll send you a reset link.
              </p>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={2} />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1a6cf0]/30 focus:border-[#1a6cf0]"
              />
            </div>
            {error && <Notice tone="error">{error}</Notice>}
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-[#1a6cf0] hover:bg-[#155cd0] text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {busy && <Spinner />}
              Send reset link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
