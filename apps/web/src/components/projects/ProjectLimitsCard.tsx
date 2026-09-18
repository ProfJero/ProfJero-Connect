import { Card, ViewAllLink } from '../ui/Card';
import { limitsInfo } from '../../mock/projectDetails';

export function ProjectLimitsCard() {
  return (
    <Card className="p-4 lg:col-span-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h4 className="font-bold text-slate-900 text-sm">Limits</h4>
        <ViewAllLink />
      </div>

      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <LimitBlock
            label="Daily SMS Limit"
            limit={limitsInfo.daily.limit}
            percent={limitsInfo.daily.percent}
            usedLabel={limitsInfo.daily.usedLabel}
          />
          <LimitBlock
            label="Monthly SMS Limit"
            limit={limitsInfo.monthly.limit}
            percent={limitsInfo.monthly.percent}
            usedLabel={limitsInfo.monthly.usedLabel}
          />
        </div>

        <div className="pt-3 border-t border-slate-100">
          <span className="text-[11px] text-slate-500 font-medium block">Remaining Allowance</span>
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            {limitsInfo.remaining.value}
          </span>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${limitsInfo.remaining.percent}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-1.5 block font-medium">
            {limitsInfo.remaining.label}
          </span>
        </div>
      </div>
    </Card>
  );
}

function LimitBlock({
  label,
  limit,
  percent,
  usedLabel,
}: {
  label: string;
  limit: string;
  percent: number;
  usedLabel: string;
}) {
  return (
    <div>
      <span className="text-[10px] text-slate-400 font-medium block">{label}</span>
      <span className="text-base font-bold text-slate-900">{limit}</span>
      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[9px] text-slate-400 mt-1 block">{usedLabel}</span>
    </div>
  );
}