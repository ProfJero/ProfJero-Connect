import { Wallet, Mail, Clock, Plus } from 'lucide-react';
import { balanceCard } from '../../mock/dashboard';

export function BalanceCard() {
  return (
    <div className="lg:col-span-5 bg-gradient-to-br from-[#1860ea] via-[#1a68f0] to-[#1253c7] rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
      {/* Decorative circle */}
      <div
        className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/5 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span className="text-xs text-blue-100 font-medium tracking-wide">
              Available Balance
            </span>
          </div>
          <button className="bg-white hover:bg-blue-50 text-[#1a6cf0] font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm flex items-center gap-1 transition-all">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>Add Funds</span>
          </button>
        </div>

        <div className="mt-4">
          <div className="text-3xl sm:text-[34px] font-extrabold tracking-tight leading-none">
            {balanceCard.amount}
          </div>
        </div>
      </div>

      {/* Bottom split stats */}
      <div className="relative mt-6 pt-4 border-t border-white/20 grid grid-cols-2 gap-3 sm:gap-4 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center shrink-0">
            <Mail className="w-3.5 h-3.5 text-blue-100" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-blue-200">SMS Credits</p>
            <div className="flex items-baseline gap-1 font-bold text-white text-xs">
              <span className="truncate">{balanceCard.smsUnits}</span>
              <span className="font-normal text-[11px] text-blue-100">units</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 pl-3 border-l border-white/15 min-w-0">
          <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5 text-blue-100" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-blue-200">Last transaction</p>
            <p className="font-semibold text-white text-[11px] whitespace-nowrap truncate">
              {balanceCard.lastTransaction}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}