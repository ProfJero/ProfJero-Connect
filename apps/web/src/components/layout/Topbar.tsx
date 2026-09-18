import { Calendar, ChevronDown, Bell, Menu } from 'lucide-react';

export function Topbar({
  subtitle = '',
  onMenuClick,
}: {
  subtitle?: string;
  onMenuClick?: () => void;
}) {
  return (
    <header
      className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3 sticky top-0 z-20 shadow-xs"
      data-purpose="top-header"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 transition shrink-0"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-1.5 truncate">
            Welcome back, Admin <span className="text-lg shrink-0">👋</span>
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 font-normal hidden sm:block truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium bg-white shadow-xs">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>Sep 15, 2025 - Sep 21, 2025</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </button>

        <button className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center leading-none">
            3
          </span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3 sm:pl-2 sm:border-l sm:border-slate-200">
          <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden ring-1 ring-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
            A
          </div>
          <div className="text-left leading-tight hidden sm:block">
            <div className="font-bold text-xs text-slate-800">Admin</div>
            <div className="text-[11px] text-slate-400 font-normal">Administrator</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
        </div>
      </div>
    </header>
  );
}