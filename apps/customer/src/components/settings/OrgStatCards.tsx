import { Link } from 'react-router-dom';
import {
  Users,
  CalendarDays,
  KeyRound,
  AtSign,
  Wallet,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { orgStatCards, type OrgStatCard } from '../../mock/organisation';
import { cn } from '../../lib/utils';

const ICONS: Record<OrgStatCard['icon'], LucideIcon> = {
  team: Users,
  projects: CalendarDays,
  keys: KeyRound,
  'sender-ids': AtSign,
  wallet: Wallet,
};

export function OrgStatCards() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {orgStatCards.map((card) => {
        const Icon = ICONS[card.icon];
        return (
          <Link
            key={card.id}
            to={card.path}
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-[#1a6cf0] dark:text-blue-400 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" strokeWidth={2} />
              </div>
              <ArrowRight
                className="w-4 h-4 text-[#1a6cf0] dark:text-blue-400 group-hover:translate-x-0.5 transition-transform"
                strokeWidth={2}
              />
            </div>
            <div className="mt-3">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                {card.label}
              </span>
              <span
                className={cn(
                  'font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none mt-1 block',
                  card.id === 'wallet' ? 'text-lg' : 'text-2xl',
                )}
              >
                {card.value}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-1.5 block">
                {card.footnote}
              </span>
            </div>
          </Link>
        );
      })}
    </section>
  );
}