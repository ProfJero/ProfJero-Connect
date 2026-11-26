import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ChevronDown, LifeBuoy, ExternalLink, X } from 'lucide-react';
import { navSections, type NavItem, type NavChild } from '../../lib/nav';
import { useAccount } from '../../lib/account';
import { usePlatformConfig } from '../../lib/account';
import { cn } from '../../lib/utils';
import { BrandMark } from '../brand/BrandMark';

export function CustomerSidebar({
  open = false,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const { supportEmail } = usePlatformConfig();
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
            <BrandMark className="w-10 h-10" />
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-base tracking-tight leading-tight">
                ProfJero Connect
              </div>
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

          <nav aria-label="Main Sidebar Navigation" className="mt-1 px-3 pb-2">
            {navSections.map((section, i) => (
              <div key={section.heading ?? i} className={cn(i > 0 && 'mt-5')}>
                {section.heading && (
                  <div className="px-3.5 mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{section.heading}</span>
                    {section.action && (
                      <Link to={section.action.path} onClick={onClose} className="text-[10px] font-semibold text-blue-300 hover:text-white">
                        {section.action.label}
                      </Link>
                    )}
                  </div>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavEntry key={item.label} item={item} onNavigate={onClose} />
                  ))}
                </div>
              </div>
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
                  {supportEmail
                    ? `Email us at ${supportEmail} and we'll get back to you.`
                    : 'See the API guide or reply to any email from us.'}
                </p>
              </div>
            </div>
            {supportEmail ? (
              <a
                href={`mailto:${supportEmail}`}
                className="mt-3 w-full py-1.5 px-3 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-lg border border-slate-700 font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Contact Support</span>
                <ExternalLink className="w-3 h-3 text-slate-400" strokeWidth={2} />
              </a>
            ) : (
              <Link
                to="/developers"
                onClick={onClose}
                className="mt-3 w-full py-1.5 px-3 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-lg border border-slate-700 font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>API Documentation</span>
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function NavEntry({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const location = useLocation();
  const activeChild = item.children ? pickActiveChild(item.children, location.pathname) : null;
  const isParentActive = item.path ? location.pathname === item.path : false;
  const inSection = (item.match ?? []).some((m) => location.pathname === m || location.pathname.startsWith(`${m}/`));
  const isHighlighted = activeChild !== null || isParentActive || inSection;

  // null = follow the route (open when active); a click pins it.
  const [toggled, setToggled] = useState<boolean | null>(null);
  const expanded = toggled ?? isHighlighted;
  const setExpanded = (fn: (v: boolean) => boolean) => setToggled(fn(expanded));

  const { unreadCount } = useAccount();
  const badge = item.badge === 'unreadNotifications' ? unreadCount : 0;

  const Icon = item.icon;

  // Leaf item — no children
  if (item.path && !item.children) {
    return (
      <NavLink
        to={item.path}
        end
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
          <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
          <span className="truncate">{item.label}</span>
          <NavTag item={item} active={isParentActive} />
        </span>
        {badge > 0 && (
          <span className="bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </NavLink>
    );
  }

  // Section with children
  return (
    <div className="pt-0.5">
      <div
        className={cn(
          'flex items-center rounded-lg text-sm font-medium transition-colors',
          isHighlighted
            ? 'bg-[#1a6cf0] text-white shadow-sm'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/50',
        )}
      >
        {item.path ? (
          <NavLink
            to={item.path}
            onClick={onNavigate}
            className="flex-1 flex items-center gap-2.5 pl-3.5 pr-1 py-2.5 rounded-l-lg min-w-0"
          >
            <Icon
              className={cn('w-4 h-4 shrink-0', isHighlighted && 'text-white')}
              strokeWidth={2}
            />
            <span className="truncate">{item.label}</span>
            <NavTag item={item} active={isHighlighted} />
          </NavLink>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex-1 flex items-center gap-3 px-3.5 py-2.5 rounded-l-lg min-w-0 text-left"
          >
            <Icon
              className={cn('w-4 h-4 shrink-0', isHighlighted && 'text-white')}
              strokeWidth={2}
            />
            <span className="truncate">{item.label}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="px-2 py-2.5 rounded-r-lg shrink-0"
          aria-label={expanded ? 'Collapse section' : 'Expand section'}
        >
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 transition-transform',
              isHighlighted ? 'text-white' : 'text-slate-400',
              expanded && 'rotate-180',
            )}
            strokeWidth={2}
          />
        </button>
      </div>

      {expanded && item.children && (
        <div className="mt-1 ml-4 pl-4 space-y-1 text-xs border-l border-slate-700/40">
          {item.children.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              end
              onClick={onNavigate}
              aria-current={activeChild === child ? 'page' : undefined}
              className={cn(
                'flex items-center py-1.5 transition-colors',
                activeChild === child ? 'text-white font-medium' : 'text-slate-400 hover:text-white',
              )}
            >
              {() => (
                <>
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full mr-2.5 shrink-0',
                      activeChild === child ? 'bg-[#1a6cf0]' : 'bg-transparent',
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
/** The child whose path is the longest prefix of the current path. */
function pickActiveChild(children: NavChild[], pathname: string): NavChild | null {
  let best: NavChild | null = null;
  for (const c of children) {
    if (pathname === c.path || pathname.startsWith(`${c.path}/`)) {
      if (!best || c.path.length > best.path.length) best = c;
    }
  }
  return best;
}

function NavTag({ item, active }: { item: NavItem; active: boolean }) {
  if (!item.tag) return null;
  return (
    <span
      className={cn(
        'px-1.5 py-px rounded text-[9px] font-bold uppercase shrink-0',
        item.tag.tone === 'new'
          ? active ? 'bg-white text-[#1764e0]' : 'bg-emerald-500/20 text-emerald-300'
          : active ? 'bg-white text-[#1764e0]' : 'bg-slate-700/70 text-slate-300',
      )}
    >
      {item.tag.label}
    </span>
  );
}
