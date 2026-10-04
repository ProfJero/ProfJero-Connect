import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { LoginHero } from '../../components/auth/LoginHero';
import { LoginForm } from '../../components/auth/LoginForm';
import { BrandMark } from '../../components/brand/BrandMark';

interface LocationState {
  from?: { pathname?: string };
}

export function LoginPage() {
  const { isAuthenticated, isReady, needsSetup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as LocationState)?.from?.pathname ?? '/dashboard';

  useEffect(() => {
    if (!isReady) return;

    // User authenticated with Firebase but has no customer doc.
    // Send them to the recovery form. This is the same destination
    // ProtectedRoute would pick, but reachable directly from /login.
    if (needsSetup) {
      navigate('/complete-setup', { replace: true });
      return;
    }

    // Fully authenticated and profiled — go to the intended page.
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isReady, isAuthenticated, needsSetup, navigate, redirectTo]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1400px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[720px]">
          <div className="hidden lg:block lg:col-span-7">
            <LoginHero />
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
            <div className="w-full max-w-md mx-auto">
              <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                <BrandMark className="w-10 h-10" />
                <div>
                  <h1 className="text-slate-900 dark:text-slate-100 font-bold text-base leading-tight">
                    ProfJero Connect
                  </h1>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Connect. Communicate. Grow.
                  </p>
                </div>
              </div>

              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}