import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { LoginBrandPanel } from '../../components/auth/LoginBrandPanel';
import { LoginForm } from '../../components/auth/LoginForm';

export function LoginPage() {
  const { isAuthenticated, isReady } = useAuth();
  const navigate = useNavigate();

  // If already signed in, skip the login page.
  useEffect(() => {
    if (isReady && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isReady, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex bg-white">
        {/* Brand panel — hidden on very small screens, compact on medium */}
        <div className="hidden lg:flex lg:w-1/2">
            <LoginBrandPanel />
        </div>

        {/* Form panel */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[#f8fafc]">
        <div className="w-full max-w-[420px]">
          {/* Compact brand header for mobile/tablet */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1976d2] to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <h1 className="text-slate-900 font-bold text-base leading-tight">
                ProfJero Connect
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                One Platform. Multiple Projects.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <LoginForm />
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-6">
            ProfJero Connect · © {new Date().getFullYear()} ProfJero Digital Studio
          </p>
        </div>
      </div>
    </div>
  );
}