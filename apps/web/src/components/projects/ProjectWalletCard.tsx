import { Wallet } from 'lucide-react';
import { Card, ViewAllLink } from '../ui/Card';
import { walletInfo } from '../../mock/projectDetails';
import { cn } from '../../lib/utils';

export function ProjectWalletCard() {
  return (
    <Card className="p-4 lg:col-span-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h4 className="font-bold text-slate-900 text-sm">Wallet</h4>
        <ViewAllLink />
      </div>

      <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 mt-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Wallet className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] text-slate-500 font-medium">Current Balance</span>
          <div className="text-sm font-bold text-slate-900 tracking-tight">
            {walletInfo.currentBalance}{' '}
            <span className="text-xs font-semibold text-slate-700">Units</span>
          </div>
          <div className="text-[10px] text-blue-700 font-medium mt-0.5">
            ≈ {walletInfo.ghsEquivalent}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <h5 className="text-[11px] font-bold text-slate-700 mb-1">Transaction History</h5>
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-100">
              <th className="py-1 font-medium">Date</th>
              <th className="py-1 font-medium">Type</th>
              <th className="py-1 font-medium">Units</th>
              <th className="py-1 font-medium text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
            {walletInfo.transactions.map((tx, i) => {
              const isPurchase = tx.type === 'Purchase';
              return (
                <tr key={i}>
                  <td className="py-1.5 text-slate-400 whitespace-nowrap">{tx.date}</td>
                  <td className="py-1.5">
                    <span
                      className={cn(
                        'inline-block w-1.5 h-1.5 rounded-full mr-1',
                        isPurchase ? 'bg-emerald-500' : 'bg-red-400',
                      )}
                    />
                    {tx.type}
                  </td>
                  <td
                    className={cn(
                      'py-1.5',
                      isPurchase ? 'text-emerald-600 font-semibold' : 'text-red-500',
                    )}
                  >
                    {tx.units}
                  </td>
                  <td className="py-1.5 text-right text-slate-700">{tx.balance}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}