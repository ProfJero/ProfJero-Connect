import { Mail, Users, MessageSquare, Eye, Pencil, Wallet, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import {
  summary,
  availableUnits,
  recipientChips,
  recipientOverflow,
} from '../../mock/sendSms';
import { cn } from '../../lib/utils';

export function SendSmsSidebar() {
  return (
    <div className="sm:col-span-5 space-y-5">
      <SummaryCard />
      <AvailableUnitsBanner />
      <MessagePreviewCard />
      <RecipientListCard />
    </div>
  );
}

function SummaryCard() {
  return (
    <Card className="p-5 space-y-4">
      <h3 className="text-sm font-bold text-slate-900">Message Summary</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SummaryPill
          icon={
            <div
              className={cn(
                'w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center',
                summary.projectAvatarBg,
              )}
            >
              {summary.project.charAt(0)}
            </div>
          }
          label="Project"
          value={summary.project}
          sub={summary.projectClient}
        />
        <SummaryPill
          icon={
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail className="w-4 h-4" strokeWidth={2} />
            </div>
          }
          label="Sender ID"
          value={summary.senderId}
          sub="GABS"
        />
        <SummaryPill
          icon={
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" strokeWidth={2} />
            </div>
          }
          label="Recipients"
          value={summary.recipientsCount.toString()}
          sub="Total recipients"
        />
        <SummaryPill
          icon={
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" strokeWidth={2} />
            </div>
          }
          label="Message Units"
          value={summary.messageUnits.toString()}
          sub="Total units required"
        />
      </div>
    </Card>
  );
}

function SummaryPill({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="p-3 bg-slate-50/90 rounded-lg border border-slate-100 flex items-center gap-2.5">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] text-slate-500 font-medium">{label}</div>
        <div className="text-xs font-bold text-slate-900 leading-tight truncate">{value}</div>
        <div className="text-[10px] text-slate-400 leading-tight truncate">{sub}</div>
      </div>
    </div>
  );
}

function AvailableUnitsBanner() {
  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <Wallet className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-emerald-800">
            Available Units (Project Balance)
          </div>
          <div className="text-lg font-bold text-slate-900 tracking-tight leading-none mt-0.5">
            {availableUnits.balance.toLocaleString()}
          </div>
        </div>
      </div>
      {availableUnits.sufficient && (
        <span className="px-2.5 py-1 rounded-md bg-white border border-emerald-200 text-emerald-600 text-[11px] font-semibold shadow-xs shrink-0">
          Sufficient
        </span>
      )}
    </div>
  );
}

function MessagePreviewCard() {
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-600" strokeWidth={2} />
          <h3 className="text-sm font-bold text-slate-900">Message Preview</h3>
        </div>
        <button
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          type="button"
        >
          <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Edit</span>
        </button>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs leading-relaxed text-slate-700 font-normal whitespace-pre-line">
        {'Hello! This is a friendly reminder from GABS.\nYour appointment is scheduled for tomorrow at 9:00 AM.\nThank you!'}
      </div>

      <div className="text-[11px] text-slate-400">97 characters • 2 units</div>
    </Card>
  );
}

function RecipientListCard() {
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" strokeWidth={2} />
          <h3 className="text-sm font-bold text-slate-900">
            Recipient List{' '}
            <span className="text-slate-400 font-normal text-xs">(Preview)</span>
          </h3>
        </div>
        <a
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          href="#"
        >
          View All →
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
          +233
        </span>
        {recipientChips.map((chip) => (
          <span
            key={chip.initials}
            className={cn(
              'w-7 h-7 rounded-full text-white font-semibold text-[11px] flex items-center justify-center',
              chip.bg,
            )}
          >
            {chip.initials}
          </span>
        ))}
        <span className="text-xs font-medium text-slate-500 ml-1">
          +{recipientOverflow} more
        </span>
      </div>
    </Card>
  );
}