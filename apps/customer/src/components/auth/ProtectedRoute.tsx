import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

export function ProtectedRoute() {
  const { isAuthenticated, isReady, needsSetup } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f5f7fb] dark:bg-slate-950">
        <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-700 border-t-[#1a6cf0] rounded-full animate-spin" />
      </div>
    );
  }

  // Firebase user exists but the customer doc doesn't — recovery path.
  if (needsSetup) {
    return <Navigate to="/complete-setup" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}