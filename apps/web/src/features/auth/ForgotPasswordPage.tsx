import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { firebaseAuth } from '../../lib/firebase';

/**
 * Admin password reset. Always reports success (unless the request itself
 * failed) so the page can't be used to discover which emails are admins.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      setSent(true);
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      if (code.includes('user-not-found')) setSent(true);
      else if (code.includes('invalid-email')) setError('Enter a valid email address.');
      else if (code.includes('too-many-requests')) setError('Too many attempts. Try again in a few minutes.');
      else setError('Could not send the reset email. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] text-[13px]">
      <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-2xl shadow-sm p-7">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1976d2] hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </Link>
        {sent ? (
          <div className="text-center mt-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h1 className="text-lg font-bold text-slate-900 mt-3">Check your email</h1>
            <p className="text-xs text-slate-600 mt-2">
              If <strong>{email}</strong> has an admin account, a reset link is on its way.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Reset your password</h1>
              <p className="text-xs text-slate-500 mt-1">We'll email you a link to choose a new password.</p>
            </div>
            <label htmlFor="fp-email" className="block text-xs font-semibold text-slate-700">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input id="fp-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
            <button type="submit" disabled={busy} className="w-full py-2.5 rounded-lg bg-[#1976d2] hover:bg-[#1565c0] text-white text-sm font-semibold disabled:opacity-60">
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
