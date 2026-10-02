import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { CustomerSidebar } from './CustomerSidebar';
import { CustomerTopbar } from './CustomerTopbar';
import { AccountProvider } from '../../lib/account';

export function CustomerLayout() {
  const { pathname } = useLocation();
  // The drawer is "open on this path". Navigating changes the path, which
  // closes it without resetting state inside an effect.
  const [openOnPath, setOpenOnPath] = useState<string | null>(null);
  const sidebarOpen = openOnPath === pathname;

  useEffect(() => {
    if (!sidebarOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenOnPath(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sidebarOpen]);

  return (
    <AccountProvider>
      <div className="bg-[#f5f7fb] dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased h-screen flex overflow-hidden font-sans">
        <CustomerSidebar open={sidebarOpen} onClose={() => setOpenOnPath(null)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <CustomerTopbar onMenuClick={() => setOpenOnPath(pathname)} />
          <Outlet />
        </div>
      </div>
    </AccountProvider>
  );
}
