import { Info } from 'lucide-react';
import { Card } from '../ui/Card';
import { unitDistribution, totalRemainingUnits } from '../../mock/wallets';

export function UnitDistribution() {
  // Build SVG donut segments (stroke-dasharray approach)
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <Card className="p-4" data-purpose="unit-distribution-card">
      <h4 className="text-xs font-bold text-slate-800 pb-3 border-b border-slate-100">
        Unit Distribution
      </h4>

      <div className="flex flex-col sm:flex-row items-center justify-between pt-3 gap-4">
        {/* Donut */}
        <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="4.5"
            />
            {unitDistribution.map((seg) => {
              const dash = (seg.value / 100) * circumference;
              const gap = circumference - dash;
              const offset = -cumulativeOffset;
              cumulativeOffset += dash;
              return (
                <circle
                  key={seg.name}
                  cx="18"
                  cy="18"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="4.5"
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={offset}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-extrabold text-slate-900 leading-tight">
              {totalRemainingUnits}
            </span>
            <span className="text-[9px] text-slate-400 font-medium">Remaining</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-1.5">
          {unitDistribution.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[11px] font-medium">{item.name}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-700">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 flex items-start gap-2">
        <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-2.5 h-2.5" strokeWidth={2.5} />
        </div>
        <p className="text-[10px] text-blue-800 leading-snug">
          <span className="font-semibold">Note:</span> ProfJero SMS units are internal project
          credits and are <span className="font-semibold">NOT</span> the same as your Arkesel
          provider balance (12,000 SMS credits).
        </p>
      </div>
    </Card>
  );
}