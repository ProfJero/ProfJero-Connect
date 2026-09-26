import { Wallet, Smartphone, Zap, ChevronRight, ShieldCheck } from 'lucide-react';
import {
  processingNotice,
  securityNotice,
  type PaymentMethod,
} from '../../mock/addFunds';

export function PaymentSummaryCard({
  amount,
  paymentMethodId,
}: {
  amount: number;
  paymentMethodId: PaymentMethod['id'];
}) {
  const methodName = paymentMethodId === 'mobile-money' ? 'Mobile Money' : 'Card';
  const methodDetail =
    paymentMethodId === 'mobile-money' ? 'MTN, Telecel, AirtelTigo' : 'Visa, Mastercard, etc.';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-[#1a6cf0] dark:text-blue-400 shrink-0">
          <Wallet className="w-4 h-4" strokeWidth={2} />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
          Payment Summary
        </h3>
      </div>

      {/* Amount */}
      <div className="py-5 border-b border-slate-100 dark:border-slate-800">
        <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">Amount</div>
        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
          GH₵ {amount.toFixed(2)}
        </div>
      </div>

      {/* Details */}
      <div className="py-4 space-y-4">
        <SummaryRow
          icon={Smartphone}
          label="Payment Method"
          value={methodName}
          detail={methodDetail}
        />
        <SummaryRow
          icon={Zap}
          label={processingNotice.title}
          value={processingNotice.shortLabel}
          detail={processingNotice.shortDetail}
        />
      </div>

      {/* Security card */}
      <div className="mt-2 p-4 rounded-xl bg-sky-50/60 dark:bg-blue-500/10 border border-sky-100 dark:border-blue-500/20 flex items-start gap-3">
        <div className="text-[#1a6cf0] dark:text-blue-400 mt-0.5 shrink-0">
          <ShieldCheck className="w-5 h-5" strokeWidth={2} />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {securityNotice.title}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {securityNotice.body}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 group cursor-pointer">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-[#1a6cf0] dark:text-blue-400 shrink-0">
          <Icon className="w-3.5 h-3.5" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-slate-400 dark:text-slate-500">{label}</div>
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
            {value}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
            {detail}
          </div>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition shrink-0" strokeWidth={2} />
    </div>
  );
}