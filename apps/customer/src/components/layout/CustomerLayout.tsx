import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { CustomerSidebar } from './CustomerSidebar';
import { CustomerTopbar } from './CustomerTopbar';

export function CustomerLayout() {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sidebarOpen]);

  return (
    <div className="bg-[#f5f7fb] dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased h-screen flex overflow-hidden font-sans">
      <CustomerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <CustomerTopbar onMenuClick={() => setSidebarOpen(true)} />
        <Outlet />
      </div>
    </div>
  );
}