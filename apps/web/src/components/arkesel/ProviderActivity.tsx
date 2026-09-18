import { UserCheck, MessageSquare, X, Pencil, Check, type LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { providerEvents, type ProviderEvent } from '../../mock/arkesel';
import { cn } from '../../lib/utils';

const ICONS: Record<ProviderEvent['icon'], LucideIcon> = {
  'user-check': UserCheck,
  sms: MessageSquare,
  x: X,
  pen: Pencil,
  check: Check,
};

const TONE_STYLES: Record<
  ProviderEvent['tone'],
  { bg: string; text: string; rowText: string }
> = {
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', rowText: 'text-slate-700' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', rowText: 'text-slate-700' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-600', rowText: 'text-rose-600' },
};

export function ProviderActivity() {
  return (
    <Card className="p-5 flex flex-col justify-between" data-purpose="provider-activity">
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex gap-4 text-xs font-semibold">
            <button className="text-blue-600 border-b-2 border-blue-600 pb-2 -mb-2">
              Recent Events
            </button>
            <button className="text-slate-400 hover:text-slate-600 pb-2 -mb-2">
              API Errors
            </button>
          </div>
          <a className="text-[11px] font-semibold text-blue-600 hover:underline" href="#">
            View All →
          </a>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          {providerEvents.map((event, i) => {
            const Icon = ICONS[event.icon];
            const tone = TONE_STYLES[event.tone];
            return (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                    tone.bg,
                    tone.text,
                  )}
                >
                  <Icon className="w-3 h-3" strokeWidth={2} />
                </div>
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="text-[11px] text-slate-400 font-medium">{event.date}</span>
                  <span className={cn('text-[11px] font-medium truncate ml-2', tone.rowText)}>
                    {event.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}