import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck, MailCheck, KeyRound } from 'lucide-react';
import { GoogleIcon } from './AuthCard';
import { useAuth } from '../../lib/auth';
import { cn } from '../../lib/utils';

export function LoginForm() {
  const { login, sendEmailLink, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'password' | 'link'>('password');
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const google = async () => {
    setError(null);
    setGoogleBusy(true);
    try {
      await signInWithGoogle(); // LoginPage's effect navigates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
      setGoogleBusy(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    if (mode === 'link') {
      try {
        await sendEmailLink(email);
        setLinkSentTo(email.trim());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not send the link.');
      } finally {
        setIsLoading(false);
      }
      return;
    }
    try {
      await login(email.trim(), password, remember);
      // Success. Do NOT call navigate() here and do NOT reset isLoading.
      //
      // Navigation is owned by LoginPage's effect, which watches
      // isAuthenticated / needsSetup. Doing it in two places was the
      // cause of the login blink: this component would navigate, then
      // ProtectedRoute would bounce back because the user state had
      // not yet propagated, then the effect would navigate again.
      //
      // isLoading stays true until this component unmounts, which keeps
      // the spinner visible through the whole transition.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Top switcher */}
      <div className="text-right text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
        Don't have an account?{' '}
        <Link
          to="/signup"
          className="text-[#1764e0] dark:text-blue-400 font-semibold hover:underline ml-1"
        >
          Sign up
        </Link>
        <span className="mx-2 text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
        <Link to="/developers" className="text-slate-600 dark:text-slate-300 font-semibold hover:underline">
          API docs
        </Link>
      </div>

      {/* Headings */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Welcome Back
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Sign in to your ProfJero Connect account to continue.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {linkSentTo ? (
        <div role="status" className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-5 text-center">
          <MailCheck className="w-10 h-10 mx-auto text-emerald-700 dark:text-emerald-300" strokeWidth={1.8} />
          <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">Check your inbox</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            We sent a sign-in link to <strong className="break-all">{linkSentTo}</strong>. Open it on this device to sign in.
          </p>
          <button type="button" onClick={() => setLinkSentTo(null)} className="mt-4 text-xs font-semibold text-[#1764e0] dark:text-blue-400 hover:underline">
            Back to sign in
          </button>
        </div>
      ) : (
      <>
      <button
        type="button"
        onClick={google}
        disabled={googleBusy || isLoading}
        className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium py-2.5 px-4 rounded-lg transition duration-150 flex items-center justify-center gap-3 shadow-xs disabled:opacity-60"
      >
        {googleBusy ? <span className="w-4 h-4 border-2 border-slate-300 border-t-[#1a6cf0] rounded-full animate-spin" /> : <GoogleIcon />}
        <span className="text-sm font-semibold">Continue with Google</span>
      </button>
      <div className="relative py-4 flex items-center justify-center">
        <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
        <span className="bg-white dark:bg-slate-900 px-3 text-xs uppercase font-medium text-slate-500 dark:text-slate-400 absolute">or</span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Email */}
        <div>
          <label
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
            htmlFor="login-email"
          >
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
              <Mail className="w-5 h-5" strokeWidth={1.8} />
            </span>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. info@yourcompany.com"
              disabled={isLoading}
              className="block w-full pl-11 pr-4 py-3 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1a6cf0]/30 focus:border-[#1a6cf0] transition disabled:opacity-60"
            />
          </div>
        </div>

        {mode === 'password' && (
          <>
        {/* Password */}
        <div>
          <label
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
            htmlFor="login-password"
          >
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
              <Lock className="w-5 h-5" strokeWidth={1.8} />
            </span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              className="block w-full pl-11 pr-11 py-3 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1a6cf0]/30 focus:border-[#1a6cf0] transition disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" strokeWidth={1.8} />
              ) : (
                <Eye className="w-5 h-5" strokeWidth={1.8} />
              )}
            </button>
          </div>
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
          <label className="flex items-center text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 text-[#1764e0] border-slate-300 rounded focus:ring-[#1a6cf0]"
            />
            <span className="ml-2 font-normal">Remember me</span>
          </label>
          <Link
            to="/forgot-password"
            className="text-[#1764e0] dark:text-blue-400 font-semibold hover:underline"
          >
            Forgot password?
          </Link>
        </div>

          </>
        )}

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'w-full bg-[#1a6cf0] hover:bg-[#155cd0] active:bg-[#124db0] text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 flex items-center justify-center gap-2 group',
              'disabled:opacity-70 disabled:cursor-not-allowed',
            )}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>{mode === 'link' ? 'Sending link…' : 'Signing in…'}</span>
              </>
            ) : (
              <>
                <span>{mode === 'link' ? 'Email me a sign-in link' : 'Sign In'}</span>
                <ArrowRight
                  className="w-4 h-4 transform group-hover:translate-x-1 transition"
                  strokeWidth={2.2}
                />
              </>
            )}
          </button>
        </div>
        <button
          type="button"
          onClick={() => { setMode(mode === 'password' ? 'link' : 'password'); setError(null); }}
          className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1764e0] dark:text-blue-400 hover:underline"
        >
          {mode === 'password' ? <><Mail className="w-3.5 h-3.5" /> Email me a sign-in link instead</> : <><KeyRound className="w-3.5 h-3.5" /> Sign in with a password instead</>}
        </button>
      </form>
      </>
      )}

      {/* Security notice */}
      <div className="pt-6 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-4 h-4 text-[#1764e0] dark:text-blue-400 shrink-0" strokeWidth={2} />
        <span className="font-medium">Your information is secure and encrypted.</span>
      </div>
    </div>
  );
}