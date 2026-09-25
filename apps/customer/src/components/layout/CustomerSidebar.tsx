import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ChevronDown, LifeBuoy, ExternalLink, X } from 'lucide-react';
import { navItems, type NavItem } from '../../lib/nav';
import { cn } from '../../lib/utils';

export function CustomerSidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'w-[260px] bg-[#0c192c] text-slate-300 flex flex-col justify-between shrink-0 h-screen overflow-y-auto custom-scrollbar border-r border-slate-800/40',
          'fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out',
          'lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div>
          <div className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <span className="font-extrabold text-2xl tracking-tighter italic">P</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-base tracking-tight leading-tight">
                ProfJero Connect
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Connect. Communicate. Grow.
              </p>
            </div>
            <button
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition shrink-0"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav aria-label="Main Sidebar Navigation" className="mt-2 px-3 space-y-1">
            {navItems.map((item) => (
              <NavEntry key={item.label} item={item} onNavigate={onClose} />
            ))}
          </nav>
        </div>

        <div className="p-4 mb-2">
          <div className="bg-[#12233c]/80 border border-slate-700/60 rounded-xl p-3.5 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center text-blue-400 shrink-0">
                <LifeBuoy className="w-4 h-4" strokeWidth={2} />
              </div>
              <div>
                <h4 className="text-white font-semibold text-xs leading-snug">Need help?</h4>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                  Visit our documentation or contact support.
                </p>
              </div>
            </div>
            <button className="mt-3 w-full py-1.5 px-3 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-lg border border-slate-700 font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors">
              <span>View Docs</span>
              <ExternalLink className="w-3 h-3 text-slate-400" strokeWidth={2} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavEntry({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const location = useLocation();
  const hasActiveChild =
    item.children?.some((c) => location.pathname === c.path) ?? false;
  const [expanded, setExpanded] = useState(hasActiveChild);

  // Auto-expand the section when a child becomes active (e.g. on navigation)
  useEffect(() => {
    if (hasActiveChild) setExpanded(true);
  }, [hasActiveChild]);

  const Icon = item.icon;

  if (item.path) {
    return (
      <NavLink
        to={item.path}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive
              ? 'bg-[#1a6cf0] text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/50',
          )
        }
      >
        <span className="flex items-center gap-3 min-w-0">
          <Icon
            className={cn('w-4 h-4 shrink-0', hasActiveChild && 'text-white')}
            strokeWidth={2}
          />
          <span className="truncate">{item.label}</span>
        </span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className="bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  }

  return (
    <div className="pt-0.5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-sm font-medium transition-colors',
          hasActiveChild
            ? 'bg-[#1a6cf0] text-white shadow-sm'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/50',
        )}
      >
        <span className="flex items-center gap-3 min-w-0">
          <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
          <span className="truncate">{item.label}</span>
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 transition-transform shrink-0',
            hasActiveChild ? 'text-white' : 'text-slate-400',
            expanded && 'rotate-180',
          )}
          strokeWidth={2}
        />
      </button>

      {expanded && item.children && (
        <div className="mt-1 ml-4 pl-4 space-y-1 text-xs border-l border-slate-700/40">
          {item.children.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center py-1.5 transition-colors',
                  isActive ? 'text-white font-medium' : 'text-slate-400 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full mr-2.5 shrink-0',
                      isActive ? 'bg-[#1a6cf0]' : 'bg-transparent',
                    )}
                  />
                  <span className="truncate">{child.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}