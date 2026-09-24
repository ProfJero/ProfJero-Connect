import { Pencil, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import type { PricingSettings } from '@profjero/shared';

interface Props {
  settings: PricingSettings;
  onEdit: () => void;
}

export function UnitRateCard({ settings, onEdit }: Props) {
  const hasRate = settings.unitPriceGhs !== null;
  const rate = hasRate ? settings.unitPriceGhs!.toFixed(4) : null;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Unit Rate</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Reference price per unit for arbitrary purchase amounts.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition shrink-0"
        >
          <Pencil className="w-3 h-3" strokeWidth={2.5} />
          Edit
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat
          label="Price per unit"
          value={hasRate ? `GHS ${rate}` : 'Not set'}
        />
        <Stat
          label="Currency"
          value={settings.currency}
        />
        <Stat
          label="Min purchase"
          value={
            settings.minPurchaseUnits !== null
              ? `${settings.minPurchaseUnits.toLocaleString()} units`
              : '—'
          }
        />
        <Stat
          label="Max purchase"
          value={
            settings.maxPurchaseUnits !== null
              ? `${settings.maxPurchaseUnits.toLocaleString()} units`
              : 'No limit'
          }
        />
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            settings.active ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
        />
        <span className="text-[11px] text-slate-600">
          {settings.active
            ? 'Visible to clients via /v1/pricing'
            : 'Hidden from the public pricing endpoint'}
        </span>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
      <div className="text-[10px] text-slate-500 font-medium">{label}</div>
      <div className="text-sm font-bold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}