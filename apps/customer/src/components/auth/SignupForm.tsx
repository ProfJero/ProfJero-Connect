import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Check,
  MailCheck,
  KeyRound,
} from 'lucide-react';
import { GoogleIcon } from './AuthCard';
import { useAuth } from '../../lib/auth';
import { useApi } from '../../lib/useApi';
import { cn } from '../../lib/utils';

export function SignupForm() {
  const { signUp, sendEmailLink, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  // Operators can pause new sign-ups from the admin dashboard.
  const platform = useApi<{ customerSignupsEnabled: boolean }>('/v1/platform');
  const signupsClosed = platform.data?.customerSignupsEnabled === false;

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Default: a sign-up link (no password, proves the email in one click).
  const [mode, setMode] = useState<'link' | 'password'>('link');
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);

  const google = async () => {
    setError(null);
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
      // SignupPage's effect routes to the dashboard or Finish setup.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
      setGoogleBusy(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreedToTerms) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }
    if (mode === 'password' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'link') {
        await sendEmailLink(email, { displayName: fullName, companyName, acceptedTerms: agreedToTerms });
        setLinkSentTo(email.trim());
      } else {
        await signUp({ email, password, displayName: fullName, companyName, acceptedTerms: agreedToTerms });
        navigate('/verify-email', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordHint = password.length === 0 ? null : password.length < 8 ? 'weak' : 'ok';

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Top switcher */}
      <div className="text-right text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-[#1764e0] dark:text-blue-400 font-semibold hover:underline ml-1"
        >
          Sign in
        </Link>
        <span className="mx-2 text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
        <Link to="/developers" className="text-slate-600 dark:text-slate-300 font-semibold hover:underline">
          API docs
        </Link>
      </div>

      {/* Headings */}
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Create Account
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Get started with ProfJero Connect in under a minute.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {signupsClosed && (
        <div role="status" className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <span className="font-medium leading-relaxed">New sign-ups are paused right now. Please check back later — existing customers can still sign in.</span>
        </div>
      )}

      {linkSentTo ? (
        <div role="status" className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-5 text-center">
          <MailCheck className="w-10 h-10 mx-auto text-emerald-700 dark:text-emerald-300" strokeWidth={1.8} />
          <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">Check your inbox</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            We sent a sign-up link to <strong className="break-all">{linkSentTo}</strong>. Open it on this device to finish creating
            your account — no password needed.
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Can't find it? Check spam or promotions. The link works once.</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
            <button type="button" onClick={() => void handleSubmit({ preventDefault() {} } as FormEvent)} disabled={isLoading} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800">
              Send again
            </button>
            <button type="button" onClick={() => setLinkSentTo(null)} className="px-4 py-2 rounded-lg text-xs font-semibold text-[#1764e0] dark:text-blue-400 hover:underline">
              Use a different email
            </button>
          </div>
        </div>
      ) : (
      <>
      <button
        type="button"
        onClick={google}
        disabled={googleBusy || signupsClosed}
        className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium py-2.5 px-4 rounded-lg transition duration-150 flex items-center justify-center gap-3 shadow-xs disabled:opacity-60"
      >
        {googleBusy ? <span className="w-4 h-4 border-2 border-slate-300 border-t-[#1a6cf0] rounded-full animate-spin" /> : <GoogleIcon />}
        <span className="text-sm font-semibold">Sign up with Google</span>
      </button>
      <div className="relative py-4 flex items-center justify-center">
        <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
        <span className="bg-white dark:bg-slate-900 px-3 text-xs uppercase font-medium text-slate-500 dark:text-slate-400 absolute">or with your email</span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full name + Company — side by side on wider screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            id="signup-name"
            label="Full Name"
            icon={User}
            type="text"
            autoComplete="name"
            placeholder="Prof Jero"
            value={fullName}
            onChange={setFullName}
          />
          <Field
            id="signup-company"
            label="Company / Organisation"
            icon={Building2}
            type="text"
            autoComplete="organization"
            placeholder="ProfJero Digital Studio"
            value={companyName}
            onChange={setCompanyName}
          />
        </div>

        {/* Email */}
        <Field
          id="signup-email"
          label="Email Address"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="info@yourcompany.com"
          value={email}
          onChange={setEmail}
        />

        {mode === 'password' ? (
          <>
        {/* Password */}
        <div>
          <label
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
            htmlFor="signup-password"
          >
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
              <Lock className="w-5 h-5" strokeWidth={1.8} />
            </span>
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="block w-full pl-11 pr-11 py-3 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1a6cf0]/30 focus:border-[#1a6cf0] transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.8} /> : <Eye className="w-5 h-5" strokeWidth={1.8} />}
            </button>
          </div>
          {passwordHint && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px]">
              <div className="flex-1 flex gap-1">
                <div className={cn('h-1 flex-1 rounded-full', password.length >= 8 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700')} />
                <div className={cn('h-1 flex-1 rounded-full', password.length >= 12 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700')} />
                <div className={cn('h-1 flex-1 rounded-full', password.length >= 16 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700')} />
              </div>
              <span className={cn('font-medium', password.length >= 8 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-500')}>
                {password.length >= 8 ? 'Good' : 'Too short'}
              </span>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
            htmlFor="signup-confirm"
          >
            Confirm Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
              <Lock className="w-5 h-5" strokeWidth={1.8} />
            </span>
            <input
              id="signup-confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className={cn(
                'block w-full pl-11 pr-11 py-3 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition',
                confirmPassword && confirmPassword !== password
                  ? 'border-rose-300 focus:ring-rose-500/30 focus:border-rose-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-[#1a6cf0]/30 focus:border-[#1a6cf0]',
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff className="w-5 h-5" strokeWidth={1.8} /> : <Eye className="w-5 h-5" strokeWidth={1.8} />}
            </button>
            {confirmPassword && confirmPassword === password && (
              <span className="absolute inset-y-0 right-11 flex items-center text-emerald-500">
                <Check className="w-4 h-4" strokeWidth={2.5} />
              </span>
            )}
          </div>
        </div>

          </>
        ) : null}

        <button
          type="button"
          onClick={() => setMode(mode === 'link' ? 'password' : 'link')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1764e0] dark:text-blue-400 hover:underline"
        >
          <KeyRound className="w-3.5 h-3.5" strokeWidth={2} />
          {mode === 'link' ? 'Prefer a password? Set one instead' : 'No password — email me a sign-up link instead'}
        </button>

        {/* Terms */}
        <label className="flex items-start gap-2 cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="w-4 h-4 mt-0.5 text-[#1764e0] border-slate-300 dark:border-slate-600 rounded focus:ring-[#1a6cf0]"
          />
          <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            I agree to the{' '}
            <a href="#" className="text-[#1764e0] dark:text-blue-400 font-semibold hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-[#1764e0] dark:text-blue-400 font-semibold hover:underline">
              Privacy Policy
            </a>
            .
          </span>
        </label>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || signupsClosed}
            className={cn(
              'w-full bg-[#1a6cf0] hover:bg-[#155cd0] active:bg-[#124db0] text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 flex items-center justify-center gap-2 group',
              'disabled:opacity-70 disabled:cursor-not-allowed',
            )}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>{mode === 'link' ? 'Sending link…' : 'Creating account…'}</span>
              </>
            ) : (
              <>
                <span>{mode === 'link' ? 'Email me a sign-up link' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" strokeWidth={2.2} />
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          We confirm your email before the account opens — one account per real email address.
        </p>
      </form>
      </>
      )}

      {/* Security notice */}
      <div className="pt-5 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-4 h-4 text-[#1764e0] dark:text-blue-400 shrink-0" strokeWidth={2} />
        <span className="font-medium">Your information is secure and encrypted.</span>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  type,
  autoComplete,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  icon: typeof User;
  type: string;
  autoComplete: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label
        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </span>
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-11 pr-4 py-3 text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1a6cf0]/30 focus:border-[#1a6cf0] transition"
        />
      </div>
    </div>
  );
}