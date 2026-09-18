import { TowerControl as Tower, Info, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { providerBalance } from '../../mock/arkesel';

export function ProviderBalanceCard() {
  return (
    <Card className="p-5 space-y-4" data-purpose="sms-provider-balance">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">SMS Provider Balance</h3>
        <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" strokeWidth={2} />
      </div>

      {/* Gradient hero card */}
      <div className="bg-gradient-to-r from-blue-600 to-[#0052cc] rounded-xl p-5 text-white relative shadow-lg shadow-blue-600/20 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
            <Tower className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs text-blue-100 font-medium">Arkesel Balance</p>
            <h2 className="text-2xl font-black tracking-tight mt-0.5">
              {providerBalance.amount}
            </h2>
          </div>
        </div>
        <p className="text-[11px] text-blue-200 mt-3">(Provider / Infrastructure Balance)</p>
      </div>

      <div className="bg-blue-50/80 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-blue-800">
        <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" strokeWidth={2} />
        <p>This is the Arkesel provider balance, not the sum of client/project wallets.</p>
      </div>

      <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" strokeWidth={2} />
          <div>
            <h4 className="text-xs font-bold text-amber-900">Low Balance Alert</h4>
            <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
              Your Arkesel balance is below the recommended threshold (
              {providerBalance.lowBalanceThreshold}). Consider topping up soon.
            </p>
            <button className="mt-3 bg-[#1976d2] hover:bg-blue-600 text-white font-semibold text-xs py-1.5 px-4 rounded-lg shadow-xs transition">
              Top Up Balance
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}