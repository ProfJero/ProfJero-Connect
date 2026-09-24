import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
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
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Heading */}
      <div className="space-y-1.5">
        <h2 className="text-[26px] font-bold text-slate-900 tracking-tight">
          Welcome back
        </h2>
        <p className="text-sm text-slate-500">
          Sign in to your ProfJero Connect admin account.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
          Email address
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Mail className="w-4 h-4" strokeWidth={2} />
          </span>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@profjerosms.com"
            className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1976d2]/20 focus:border-[#1976d2] transition"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
            Password
          </label>
          <a
            href="#"
            className="text-[11px] font-semibold text-[#1976d2] hover:text-blue-700"
          >
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" strokeWidth={2} />
          </span>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1976d2]/20 focus:border-[#1976d2] transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Remember me */}
      <div className="flex items-center gap-2">
        <input
          id="remember"
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="w-3.5 h-3.5 rounded border-slate-300 text-[#1976d2] focus:ring-[#1976d2]"
        />
        <label htmlFor="remember" className="text-xs text-slate-600 select-none">
          Keep me signed in on this device
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition-all shadow-sm',
          'bg-gradient-to-r from-[#1976d2] to-blue-600 hover:from-blue-600 hover:to-blue-700',
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
            <span>Sign in</span>
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </>
        )}
      </button>

      {/* Footer note */}
      <p className="text-center text-[11px] text-slate-400 pt-2">
        Protected by industry-standard encryption. Contact your administrator if you
        need an account.
      </p>
    </form>
  );
}