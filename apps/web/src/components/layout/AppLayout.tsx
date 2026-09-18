import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const SUBTITLES: Record<string, string> = {
  '/dashboard': "Here's what's happening with your SMS platform today.",
  '/projects': 'Manage your projects, clients and SMS integrations from one place.',
  '/sms-logs': 'Monitor and manage all SMS activity across your projects.',
};

export function AppLayout() {
  const { pathname } = useLocation();
  const subtitle = SUBTITLES[pathname] ?? '';

  return (
    <div className="bg-[#f1f5f9] text-slate-800 antialiased h-screen flex overflow-hidden text-[13px]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar subtitle={subtitle} />
        <Outlet />
      </div>
    </div>
  );
}