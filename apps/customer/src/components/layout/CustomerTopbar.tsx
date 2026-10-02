import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  Settings,
  Wallet,
  Building2,
    Menu,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { useAccount } from '../../lib/account';

export function CustomerTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const { wallet, unreadCount } = useAccount();

  const displayName = user?.displayName ?? 'Guest';
  const companyName = user?.companyName ?? 'My Organisation';
  const initials = displayName.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

      </div>

      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" strokeWidth={2} /> : <Moon className="w-5 h-5" strokeWidth={2} />}
        </button>

        <Link
          to="/notifications"
          className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        >
          <Bell className="w-5 h-5" strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white font-bold text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <Link
          to="/wallet/add-funds"
          className="hidden md:flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Wallet className="w-3.5 h-3.5" strokeWidth={2} />
          </div>
          <div className="text-left leading-tight">
            <div className="font-bold text-slate-800 dark:text-slate-100 text-[11px]">
              {wallet.data ? `${wallet.data.availableUnits.toLocaleString()} units` : '—'}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">
              Wallet Balance <span className="text-blue-600 dark:text-blue-400 font-semibold">→</span>
            </div>
          </div>
        </Link>

        <Link
          to="/settings/organisation"
          className="hidden lg:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors max-w-[200px]"
        >
          <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" strokeWidth={2} />
          <span className="font-medium text-xs truncate">{companyName}</span>
        </Link>

        <div className="relative flex items-center gap-2.5 pl-1">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 p-1 -m-1 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="text-left hidden sm:block leading-tight">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[110px]">
                {displayName}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">Account owner</div>
            </div>
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 py-1 z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{displayName}</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</div>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}