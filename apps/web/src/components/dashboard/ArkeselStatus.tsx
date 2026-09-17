import { Database, Send, Archive, type LucideIcon } from 'lucide-react';
import { Card, ViewAllLink } from '../ui/Card';
import { arkeselStatus } from '../../mock/dashboard';

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-2 text-slate-600">
        <Icon className="w-4 h-4 text-slate-400" /> {label}
      </span>
      <span className="font-bold text-slate-800">{value}</span>
    </div>
  );
}

export function ArkeselStatus() {
  return (
    <Card className="p-5" data-purpose="arkesel-status-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 text-sm">Arkesel Account</h3>
        <ViewAllLink label="View details" />
      </div>
      <div className="space-y-3">
        <Row
          icon={Database}
          label="Available SMS Credits"
          value={arkeselStatus.availableCredits}
        />
        <Row icon={Send} label="SMS Sent This Month" value={arkeselStatus.smsThisMonth} />
        <Row
          icon={Archive}
          label="Estimated Remaining Capacity"
          value={arkeselStatus.estimatedCapacity}
        />

        <div className="mt-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-800">API Connection: Active</span>
        </div>
      </div>
    </Card>
  );
}