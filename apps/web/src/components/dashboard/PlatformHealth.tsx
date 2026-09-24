// apps/web/src/components/dashboard/PlatformHealth.tsx (new)
import { Card } from '../ui/Card';
import type { DashboardResponse } from '@profjero/shared';

interface Props {
  smsTotals: DashboardResponse['smsTotals'];
}

export function PlatformHealth({ smsTotals }: Props) {
  const totalOutcomes =
    smsTotals.totalSubmitted + smsTotals.totalFailed + smsTotals.totalUnknown;

  const pct = (n: number) =>
    totalOutcomes > 0 ? ((n / totalOutcomes) * 100).toFixed(1) : '—';

  const rows: Array<{
    label: string;
    value: string;
    tone: 'emerald' | 'rose' | 'amber' | 'slate';
    bar?: number;
  }> = [
    {
      label: 'Success Rate',
      value: totalOutcomes > 0 ? `${pct(smsTotals.totalSubmitted)}%` : '—',
      tone: 'emerald',
      bar:
        totalOutcomes > 0
          ? (smsTotals.totalSubmitted / totalOutcomes) * 100
          : 0,
    },
    {
      label: 'Failure Rate',
      value: totalOutcomes > 0 ? `${pct(smsTotals.totalFailed)}%` : '—',
      tone: 'rose',
      bar:
        totalOutcomes > 0 ? (smsTotals.totalFailed / totalOutcomes) * 100 : 0,
    },
    {
      label: 'Unknown Rate',
      value: totalOutcomes > 0 ? `${pct(smsTotals.totalUnknown)}%` : '—',
      tone: 'amber',
      bar:
        totalOutcomes > 0 ? (smsTotals.totalUnknown / totalOutcomes) * 100 : 0,
    },
  ];

  return (
    <Card className="p-4" data-purpose="platform-health">
      <h4 className="text-xs font-bold text-slate-800 pb-3 border-b border-slate-100">
        Platform Health
      </h4>

      <div className="pt-3 space-y-3">
        {rows.map((r) => {
          const barColor =
            r.tone === 'emerald'
              ? 'bg-emerald-500'
              : r.tone === 'rose'
                ? 'bg-rose-500'
                : r.tone === 'amber'
                  ? 'bg-amber-500'
                  : 'bg-slate-400';
          const valueColor =
            r.tone === 'emerald'
              ? 'text-emerald-600'
              : r.tone === 'rose'
                ? 'text-rose-600'
                : r.tone === 'amber'
                  ? 'text-amber-600'
                  : 'text-slate-600';
          return (
            <div key={r.label}>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-600 font-medium">{r.label}</span>
                <span className={`font-bold ${valueColor}`}>{r.value}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${r.bar ?? 0}%` }}
                />
              </div>
            </div>
          );
        })}

        <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400">
          Based on {totalOutcomes.toLocaleString()} SMS outcomes all-time.
        </div>
      </div>
    </Card>
  );
}