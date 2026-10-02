import { Link } from 'react-router-dom';
import { Wallet, Package, Calendar, Plus, Clock } from 'lucide-react';
import { useWallet } from '../../lib/hooks';
import { formatDate } from '../../lib/format';

export function BalanceCard() {
  const { data: wallet, loading, error } = useWallet();

  return (
    <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
      <div>
        <div className="bg-gradient-to-r from-[#0062ff] to-[#1a6cf0] rounded-xl p-5 text-white flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white shrink-0">
              <Wallet className="w-6 h-6" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-blue-100 font-medium">
                Available Balance
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
                {loading ? (
                  <span className="inline-block w-24 h-7 rounded bg-white/15 animate-pulse align-middle" />
                ) : error ? (
                  <span className="text-base">Unavailable</span>
                ) : (
                  <>
                    {(wallet?.availableUnits ?? 0).toLocaleString()}
                    <span className="text-sm font-medium text-blue-100 ml-1.5">units</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 shrink-0 self-start">
            Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <SubMetric
            icon={Package}
            label="Reserved Units"
            value={loading ? '—' : `${(wallet?.reservedUnits ?? 0).toLocaleString()} units`}
            sub="Held for in-flight SMS"
          />
          <SubMetric
            icon={Calendar}
            label="Last Updated"
            value={loading ? '—' : formatDate(wallet?.updatedAt)}
            sub="Wallet status"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Link
          to="/wallet/add-funds"
          className="bg-[#1a6cf0] hover:bg-[#155cd0] text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span>Add Funds</span>
        </Link>
        <Link
          to="/transactions"
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition"
        >
          <Clock className="w-4 h-4 text-[#1a6cf0] dark:text-blue-400" strokeWidth={2} />
          <span>Transaction History</span>
        </Link>
      </div>
    </div>
  );
}

function SubMetric({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-3.5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-[#1a6cf0] dark:text-blue-400 shrink-0">
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          {label}
        </div>
        <div className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
          {value}
        </div>
        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
          {sub}
        </div>
      </div>
    </div>
  );
}