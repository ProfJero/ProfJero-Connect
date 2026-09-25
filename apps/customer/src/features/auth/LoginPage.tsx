import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { LoginHero } from '../../components/auth/LoginHero';
import { LoginForm } from '../../components/auth/LoginForm';

export function LoginPage() {
  const { isAuthenticated, isReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isReady && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isReady, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1400px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[720px]">
          {/* Hero — desktop only; hidden on mobile for a focused form */}
          <div className="hidden lg:block lg:col-span-7">
            <LoginHero />
          </div>

          {/* Form panel */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
            <div className="w-full max-w-md mx-auto">
              {/* Compact brand header for mobile */}
              <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-[#1a6cf0] flex items-center justify-center">
                  <span className="text-white font-extrabold text-lg italic">P</span>
                </div>
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