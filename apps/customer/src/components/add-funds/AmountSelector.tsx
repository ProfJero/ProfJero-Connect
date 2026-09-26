import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { amountPresets, minAmount, maxAmount } from '../../mock/addFunds';
import { cn } from '../../lib/utils';

export function AmountSelector({
  selectedAmount,
  customAmount,
  onAmountChange,
}: {
  selectedAmount: number | null;
  customAmount: string;
  onAmountChange: (amount: number | null, custom: string) => void;
}) {
  const [customMode, setCustomMode] = useState(false);

  const handlePreset = (amount: number) => {
    setCustomMode(false);
    onAmountChange(amount, '');
  };

  const handleCustomMode = () => {
    setCustomMode(true);
    onAmountChange(null, customAmount);
  };

  const handleCustomInput = (value: string) => {
    // Allow digits and one decimal point
    const cleaned = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    onAmountChange(null, cleaned);
  };

  return (
    <section>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3.5">
        <span className="w-6 h-6 rounded-full bg-[#1a6cf0] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
          1
        </span>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
            Select Amount
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Choose a preset amount or enter a custom amount.
          </p>
        </div>
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {amountPresets.map((preset) => {
          const isActive = !customMode && selectedAmount === preset.amount;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePreset(preset.amount)}
              className={cn(
                'rounded-xl p-3.5 text-left transition relative border',
                isActive
                  ? 'border-2 border-[#1a6cf0] bg-blue-50/20 dark:bg-blue-500/10'
                  : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs',
              )}
            >
              <div className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                {preset.label}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                {preset.sublabel}
              </div>
            </button>
          );
        })}

        {/* Custom amount card */}
        <button
          type="button"
          onClick={handleCustomMode}
          className={cn(
            'rounded-xl p-3.5 text-left transition flex items-center justify-between gap-2 border',
            customMode
              ? 'border-2 border-[#1a6cf0] bg-blue-50/20 dark:bg-blue-500/10'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs',
          )}
        >
          <div className="min-w-0">
            <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
              Custom Amount
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
              Enter your amount
            </div>
          </div>
          <Pencil className="w-4 h-4 text-[#1a6cf0] dark:text-blue-400 shrink-0" strokeWidth={2} />
        </button>
      </div>

      {/* Custom amount input — appears when custom is selected */}
      {customMode && (
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Enter Amount (GH₵)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 dark:text-slate-400 font-semibold text-sm">
              GH₵
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={customAmount}
              onChange={(e) => handleCustomInput(e.target.value)}
              placeholder="0.00"
              className="w-full pl-14 pr-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a6cf0]/20 focus:border-[#1a6cf0]"
            />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
            Minimum GH₵{minAmount}.00 · Maximum GH₵{maxAmount.toLocaleString()}.00
          </p>
        </div>
      )}
    </section>
  );
}