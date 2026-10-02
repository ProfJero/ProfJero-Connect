import { useState } from 'react';
import { Menu, LogOut, UserRound, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { AlertsBell } from './AlertsBell';

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  finance: 'Finance',
  support: 'Support',
  viewer: 'Viewer',
};

export function Topbar({
  subtitle = '',
  onMenuClick,
}: {
  subtitle?: string;
  onMenuClick?: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.displayName ?? 'Admin';
  const displayRole = user ? ROLE_LABEL[user.role] ?? user.role : '';
  const initials = displayName
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header
      className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3 sticky top-0 z-20 shadow-xs"
      data-purpose="top-header"
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 transition shrink-0"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 truncate">
            Welcome back, {displayName.split(' ')[0]}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 font-normal hidden sm:block truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <AlertsBell />

        <div className="relative sm:pl-2 sm:border-l sm:border-slate-200">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 sm:gap-3 rounded-lg p-1 -m-1 hover:bg-slate-50"
          >
            <span className="w-9 h-9 rounded-full bg-slate-200 ring-1 ring-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
              {initials}
            </span>
            <span className="text-left leading-tight hidden sm:block">
              <span className="block font-bold text-xs text-slate-800">{displayName}</span>
              <span className="block text-[11px] text-slate-400 font-normal">{displayRole}</span>
            </span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div role="menu" className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-40">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-xs font-semibold text-slate-800 truncate">{displayName}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                </div>
                <Link role="menuitem" to="/settings?tab=profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                  <UserRound className="w-3.5 h-3.5" /> My profile
                </Link>
                <Link role="menuitem" to="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                  <Settings className="w-3.5 h-3.5" /> Settings
                </Link>
                <button role="menuitem" type="button" onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-rose-50 hover:text-rose-600">
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
