import { Pencil, Plus, Send, KeyRound, Ban } from 'lucide-react';
import { Card } from '../ui/Card';
import { projectHeader } from '../../mock/projectDetails';
import { cn } from '../../lib/utils';

export function ProjectHeaderCard() {
  return (
    <Card className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={cn(
            'w-12 h-12 rounded-full text-white font-bold text-xl flex items-center justify-center shadow-sm shrink-0',
            projectHeader.avatarBg,
          )}
        >
          {projectHeader.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-lg font-bold text-slate-900 leading-none">
              {projectHeader.name}
            </h3>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {projectHeader.status}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2 font-medium">
            <span>
              Sender ID: <strong className="text-slate-700 font-semibold">{projectHeader.senderId}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Project ID:{' '}
              <strong className="text-blue-600 font-mono font-medium">{projectHeader.id}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span>Created: {projectHeader.created}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ActionBtn icon={Pencil} label="Edit Project" tone="neutral" />
        <ActionBtn icon={Plus} label="Add Units" tone="neutral" />
        <ActionBtn icon={Send} label="Send SMS" tone="primary" iconRotate />
        <ActionBtn icon={KeyRound} label="Regenerate API Key" tone="neutral" />
        <ActionBtn icon={Ban} label="Suspend Project" tone="danger" />
      </div>
    </Card>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  tone,
  iconRotate = false,
}: {
  icon: typeof Pencil;
  label: string;
  tone: 'primary' | 'neutral' | 'danger';
  iconRotate?: boolean;
}) {
  const styles =
    tone === 'primary'
      ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-sm'
      : tone === 'danger'
        ? 'bg-white hover:bg-red-50 text-red-600 border-red-200'
        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs';

  const iconColor =
    tone === 'primary'
      ? 'text-white'
      : tone === 'danger'
        ? 'text-red-500'
        : 'text-blue-500';

  return (
    <button
      className={cn(
        'rounded-lg text-xs font-medium px-3 py-1.5 flex items-center gap-1.5 transition-colors border',
        styles,
      )}
    >
      <Icon className={cn('w-3.5 h-3.5', iconColor, iconRotate && '-rotate-45')} strokeWidth={2} />
      <span>{label}</span>
    </button>
  );
}