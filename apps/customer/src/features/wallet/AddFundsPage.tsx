import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ArrowRight, Info } from 'lucide-react';
import { AmountSelector } from '../../components/add-funds/AmountSelector';
import { PaymentMethodSelector } from '../../components/add-funds/PaymentMethodSelector';
import { PaymentSummaryCard } from '../../components/add-funds/PaymentSummaryCard';
import { processingNotice, type PaymentMethod } from '../../mock/addFunds';

export function AddFundsPage() {
  const navigate = useNavigate();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(20);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod['id']>('mobile-money');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resolve the effective amount (preset or custom)
  const effectiveAmount = useMemo(() => {
    if (selectedAmount !== null) return selectedAmount;
    const parsed = parseFloat(customAmount);
    return isNaN(parsed) ? 0 : parsed;
  }, [selectedAmount, customAmount]);

  const canContinue = effectiveAmount >= 5;

  const handleContinue = async () => {
    if (!canContinue) return;
    setIsSubmitting(true);
    // ⚠️ STUB — replace with POST /customer/wallet/topup (returns checkout URL).
    // Then window.location.href = checkoutUrl to redirect to the gateway.
    await new Promise((r) => setTimeout(r, 700));
    setIsSubmitting(false);
    // For now, navigate back to wallet
    navigate('/wallet');
  };

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 flex-1">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Link
              to="/wallet"
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition text-[#1a6cf0] dark:text-blue-400 shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Add Funds
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-7">
            Top up your wallet to purchase services and keep your communication running.
          </p>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT: Steps + Continue */}
          <div className="lg:col-span-7 space-y-7">
            <AmountSelector
              selectedAmount={selectedAmount}
              customAmount={customAmount}
              onAmountChange={(amount, custom) => {
                setSelectedAmount(amount);
                setCustomAmount(custom);
              }}
            />

            <PaymentMethodSelector
              selected={paymentMethod}
              onSelect={setPaymentMethod}
            />

            {/* Processing info box */}
            <div className="bg-sky-50/70 dark:bg-blue-500/10 border border-sky-100 dark:border-blue-500/20 rounded-xl p-3.5 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#1a6cf0] dark:text-blue-400 shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {processingNotice.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {processingNotice.body}
                </div>
              </div>
            </div>

            {/* Continue button */}
            <button
              onClick={handleContinue}
              disabled={!canContinue || isSubmitting}
              className="w-full bg-[#1a6cf0] hover:bg-[#155cd0] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs transition text-xs tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Redirecting…</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" strokeWidth={2} />
                </>
              )}
            </button>
          </div>

          {/* RIGHT: Summary */}
          <div className="lg:col-span-5">
            <PaymentSummaryCard amount={effectiveAmount} paymentMethodId={paymentMethod} />
          </div>
        </div>
      </div>
    </main>
  );
}