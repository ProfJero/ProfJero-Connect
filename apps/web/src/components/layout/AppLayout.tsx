import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AdminDataProvider } from '../../lib/adminData';

const SUBTITLES: Record<string, string> = {
  '/dashboard': "Here's what's happening with your SMS platform today.",
  '/projects': 'Manage your projects, clients and SMS integrations from one place.',
  '/sms-logs': 'Monitor and manage all SMS activity across your projects.',
  '/wallets': 'Manage project balances, units and transactions across all your clients.',
  '/payments': 'Track and manage all payments from your projects and clients.',
  '/reports': 'Analytics and insights for your SMS platform.',
  '/settings': 'Manage your platform configuration, preferences and system settings.',
  '/send-sms': 'Send SMS messages to your recipients quickly and easily.',
};

function resolveSubtitle(pathname: string): string {
  if (SUBTITLES[pathname]) return SUBTITLES[pathname];
  if (/^\/projects\/[^/]+$/.test(pathname)) {
    return "Here's the complete overview of this project.";
  }
  return '';
}

export function AppLayout() {
  const { pathname } = useLocation();
  // Drawer is open "on this path"; navigating closes it without an effect.
  const [openOnPath, setOpenOnPath] = useState<string | null>(null);
  const sidebarOpen = openOnPath === pathname;
  const setSidebarOpen = (open: boolean) => setOpenOnPath(open ? pathname : null);
  const subtitle = resolveSubtitle(pathname);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenOnPath(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sidebarOpen]);

  return (
    <AdminDataProvider>
    <div className="bg-[#f1f5f9] text-slate-800 antialiased h-screen flex overflow-hidden text-[13px]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <Outlet />
      </div>
    </div>
    </AdminDataProvider>
  );
}