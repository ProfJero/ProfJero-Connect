import { Link, NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, LogIn, Moon, Search, Sun, Wifi } from 'lucide-react';
import { BrandMark } from '../brand/BrandMark';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { cn } from '../../lib/utils';

/**
 * Shell for the no-account data shop (/data, /data/track, /data/orders/:id).
 * Same look as the app, without the sidebar: logo, Buy data, Track order,
 * and Sign in (or Dashboard when signed in).
 */
export function GuestLayout() {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const tab = ({ isActive }: { isActive: boolean }) =>
    cn(
      'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition',
      isActive
        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
    );
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fb] dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased font-sans">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link to="/data" className="flex items-center gap-2.5 min-w-0" aria-label="ProfJero Connect — buy data">
            <BrandMark className="w-9 h-9" />
            <span className="hidden sm:block leading-tight">
              <span className="block text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">ProfJero Connect</span>
              <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">Data bundles · MTN · Telecel · AirtelTigo</span>
            </span>
          </Link>
          <nav aria-label="Data shop" className="flex items-center gap-1">
            <NavLink to="/data" end className={tab}><Wifi className="w-3.5 h-3.5" strokeWidth={2} /><span>Buy data</span></NavLink>
            <NavLink to="/data/track" className={tab}><Search className="w-3.5 h-3.5" strokeWidth={2} /><span>Track order</span></NavLink>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isAuthenticated ? (
              <Link to="/dashboard" className="ml-1 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1764e0] hover:bg-[#1257c4] text-white text-xs font-bold">
                <LayoutDashboard className="w-3.5 h-3.5" strokeWidth={2} /><span className="hidden sm:inline">Dashboard</span>
              </Link>
            ) : (
              <Link to="/login" className="ml-1 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1764e0] hover:bg-[#1257c4] text-white text-xs font-bold">
                <LogIn className="w-3.5 h-3.5" strokeWidth={2} /><span className="hidden sm:inline">Sign in</span>
              </Link>
            )}
          </nav>
        </div>
      </header>
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
      <footer className="border-t border-slate-200/80 dark:border-slate-800 py-5 text-center text-[11px] text-slate-500 dark:text-slate-400">
        No account needed to buy data.{' '}
        <Link to="/signup" className="font-semibold text-[#1764e0] dark:text-blue-400 hover:underline">Create a free account</Link>
        {' '}for bulk SMS, saved contacts and order history.
      </footer>
    </div>
  );
}
