import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { cn } from '../../lib/utils';

interface LocationState {
  from?: { pathname?: string };
}

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as LocationState)?.from?.pathname ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
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
          className="text-[#1a6cf0] dark:text-blue-400 font-semibold hover:underline ml-1"
        >
          Sign up
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
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
              className="block w-full pl-11 pr-4 py-3 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1a6cf0]/30 focus:border-[#1a6cf0] transition"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
            htmlFor="login-password"
          >
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
              className="block w-full pl-11 pr-11 py-3 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1a6cf0]/30 focus:border-[#1a6cf0] transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
              className="w-4 h-4 text-[#1a6cf0] border-slate-300 rounded focus:ring-[#1a6cf0]"
            />
            <span className="ml-2 font-normal">Remember me</span>
          </label>
          <a
            href="#"
            className="text-[#1a6cf0] dark:text-blue-400 font-semibold hover:underline"
          >
            Forgot password?
          </a>
        </div>

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
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight
                  className="w-4 h-4 transform group-hover:translate-x-1 transition"
                  strokeWidth={2.2}
                />
              </>
            )}
          </button>
        </div>

        {/* OR divider */}
        <div className="relative py-2 flex items-center justify-center">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          <span className="bg-white dark:bg-slate-900 px-3 text-xs uppercase font-medium text-slate-400 absolute">
            OR
          </span>
        </div>

        {/* Google sign-in — visual only for now; wire up later */}
        <button
          type="button"
          className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium py-2.5 px-4 rounded-lg transition duration-150 flex items-center justify-center gap-3 shadow-xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          <span className="text-sm font-semibold">Continue with Google</span>
        </button>
      </form>

      {/* Security notice */}
      <div className="pt-6 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-4 h-4 text-[#1a6cf0] dark:text-blue-400 shrink-0" strokeWidth={2} />
        <span className="font-medium">Your information is secure and encrypted.</span>
      </div>
    </div>
  );
}