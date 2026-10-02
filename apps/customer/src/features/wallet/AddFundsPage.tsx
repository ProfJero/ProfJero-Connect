import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, ArrowRight, Info, Check, Package, ShieldCheck, Receipt } from 'lucide-react';
import {
  PaymentMethodSelector,
  type PaymentMethod,
} from '../../components/add-funds/PaymentMethodSelector';
import { RecentPayments } from '../../components/add-funds/RecentPayments';
import { ErrorState, Notice, SkeletonRows, Spinner } from '../../components/ui/States';
import { inputClass } from '../../components/ui/buttons';
import { api, errorMessage, newIdempotencyKey } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useWallet } from '../../lib/account';
import { formatGhs } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { CustomerPayment, PricingCatalog, PricingPackage } from '../../lib/types';

type Selection = { kind: 'package'; pkg: PricingPackage } | { kind: 'custom' };

/**
 * CP3 — buy units. Prices always come from the live pricing catalog
 * (GET /v1/pricing); nothing here is hardcoded (customer-platform.md §8).
 * The wallet is credited by the payment webhook after checkout, never by
 * this page.
 */
export function AddFundsPage() {
  const pricing = useApi<PricingCatalog>('/v1/pricing');
  const { data: wallet } = useWallet();
  const sms = pricing.data?.services.find((s) => s.service === 'sms') ?? null;
  const packages = useMemo(
    () => [...(sms?.packages ?? [])].sort((a, b) => a.displayOrder - b.displayOrder || a.priceGhs - b.priceGhs),
    [sms],
  );
  const customAvailable = !!sms?.unitPriceGhs && sms.unitPriceGhs > 0;

  const [selection, setSelection] = useState<Selection | null>(null);
  const [customGhs, setCustomGhs] = useState('');
  const [method, setMethod] = useState<PaymentMethod['id']>('mobile_money');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One key per (selection, method). Retrying after an error reuses it, so a
  // double click can never open two checkouts for the same intent.
  const keyRef = useRef<{ intent: string; key: string } | null>(null);

  // Default to the first package once the catalog loads.
  const active: Selection | null = selection ?? (packages[0] ? { kind: 'package', pkg: packages[0] } : null);

  const custom = useMemo(() => {
    const amount = parseFloat(customGhs);
    if (!sms?.unitPriceGhs || !Number.isFinite(amount) || amount <= 0) return null;
    const units = Math.floor(amount / sms.unitPriceGhs);
    const price = Math.round(units * sms.unitPriceGhs * 100) / 100;
    let problem: string | null = null;
    if (units < 1) problem = 'Amount is too small for even one unit.';
    else if (sms.minPurchaseUnits && units < sms.minPurchaseUnits)
      problem = `Minimum purchase is ${sms.minPurchaseUnits.toLocaleString()} units (${formatGhs(sms.minPurchaseUnits * sms.unitPriceGhs)}).`;
    else if (sms.maxPurchaseUnits && units > sms.maxPurchaseUnits)
      problem = `Maximum purchase is ${sms.maxPurchaseUnits.toLocaleString()} units.`;
    return { units, price, problem };
  }, [customGhs, sms]);

  const summary =
    active?.kind === 'package'
      ? { name: active.pkg.name, units: active.pkg.units, price: active.pkg.priceGhs }
      : custom && !custom.problem
        ? { name: 'Custom amount', units: custom.units, price: custom.price }
        : null;

  const handleContinue = async () => {
    if (!summary || !active) return;
    const intent = JSON.stringify([active.kind === 'package' ? active.pkg.id : summary.units, method]);
    if (keyRef.current?.intent !== intent) {
      keyRef.current = { intent, key: newIdempotencyKey('topup') };
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<{ payment: CustomerPayment; checkoutUrl: string }>(
        '/customer/payments',
        active.kind === 'package'
          ? { packageId: active.pkg.id, method }
          : { units: summary.units, method },
        { idempotencyKey: keyRef.current.key },
      );
      window.location.assign(res.checkoutUrl);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 flex-1">
      <div className="max-w-6xl mx-auto">
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
            Buy units for your wallet. 1 unit sends one SMS page to one recipient.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-7 space-y-7">
            {/* Step 1: package */}
            <section>
              <StepHeader step={1} title="Choose units" subtitle="Bigger packages cost less per unit." />
              {pricing.loading && !pricing.data ? (
                <SkeletonRows rows={4} className="p-0" />
              ) : pricing.error ? (
                <ErrorState error={pricing.error} onRetry={pricing.refresh} className="m-0" />
              ) : packages.length === 0 && !customAvailable ? (
                <Notice tone="warning">
                  Unit purchases are temporarily unavailable. Please check back shortly.
                </Notice>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {packages.map((pkg) => {
                    const isActive = active?.kind === 'package' && active.pkg.id === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelection({ kind: 'package', pkg })}
                        className={cn(
                          'relative text-left rounded-xl p-3.5 border transition',
                          isActive
                            ? 'border-2 border-[#1a6cf0] bg-blue-50/40 dark:bg-blue-500/10'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs',
                        )}
                      >
                        {isActive && (
                          <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#1a6cf0] text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" strokeWidth={3} />
                          </span>
                        )}
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{pkg.name}</div>
                        <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                          {pkg.units.toLocaleString()} <span className="text-xs font-semibold text-slate-500">units</span>
                        </div>
                        <div className="text-xs font-bold text-[#1a6cf0] dark:text-blue-400 mt-0.5">{formatGhs(pkg.priceGhs)}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          GH₵{pkg.effectiveRate.toFixed(4)} / unit
                        </div>
                      </button>
                    );
                  })}

                  {customAvailable && (
                    <button
                      type="button"
                      onClick={() => setSelection({ kind: 'custom' })}
                      className={cn(
                        'text-left rounded-xl p-3.5 border transition',
                        active?.kind === 'custom'
                          ? 'border-2 border-[#1a6cf0] bg-blue-50/40 dark:bg-blue-500/10'
                          : 'border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400',
                      )}
                    >
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Custom</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">Enter an amount</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        GH₵{sms!.unitPriceGhs!.toFixed(4)} / unit
                      </div>
                    </button>
                  )}
                </div>
              )}

              {active?.kind === 'custom' && sms?.unitPriceGhs && (
                <div className="mt-4">
                  <label htmlFor="custom-amount" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount (GH₵)
                  </label>
                  <input
                    id="custom-amount"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={customGhs}
                    onChange={(e) => setCustomGhs(e.target.value)}
                    placeholder="e.g. 30"
                    className={cn(inputClass, 'text-sm py-2.5 max-w-xs')}
                  />
                  {custom && (
                    <p className={cn('text-[11px] mt-1.5', custom.problem ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400')}>
                      {custom.problem ??
                        `You'll get ${custom.units.toLocaleString()} units for ${formatGhs(custom.price)}.`}
                    </p>
                  )}
                </div>
              )}
            </section>

            <PaymentMethodSelector selected={method} onSelect={setMethod} />

            <div className="bg-sky-50/70 dark:bg-blue-500/10 border border-sky-100 dark:border-blue-500/20 rounded-xl p-3.5 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#1a6cf0] dark:text-blue-400 shrink-0 mt-0.5" strokeWidth={2} />
              <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-900 dark:text-slate-100">How it works: </span>
                you'll complete payment on our secure checkout page, then return here. Units are added
                as soon as the payment is confirmed — usually within a minute.
              </div>
            </div>

            {error && <Notice tone="error">{error}</Notice>}

            <button
              onClick={handleContinue}
              disabled={!summary || submitting}
              className="w-full bg-[#1a6cf0] hover:bg-[#155cd0] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs transition text-xs tracking-wide disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Spinner />
                  <span>Opening secure checkout…</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>{summary ? `Pay ${formatGhs(summary.price)}` : 'Continue to Payment'}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" strokeWidth={2} />
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-4 h-4 text-[#1a6cf0] dark:text-blue-400" strokeWidth={2} />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Order Summary</h3>
              </div>
              {summary ? (
                <dl className="space-y-2.5 text-xs">
                  <Row label="Package" value={summary.name} />
                  <Row label="Units" value={summary.units.toLocaleString()} />
                  <Row label="Payment method" value={method === 'card' ? 'Card' : 'Mobile Money'} />
                  {wallet && (
                    <Row
                      label="Balance after top-up"
                      value={`${(wallet.availableUnits + summary.units).toLocaleString()} units`}
                    />
                  )}
                  <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                    <dt className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total</dt>
                    <dd className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{formatGhs(summary.price)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Package className="w-4 h-4" strokeWidth={2} />
                  Choose a package or enter an amount.
                </p>
              )}
              <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2} />
                <span>Payments are processed by a PCI-DSS compliant payment partner. We never see your card or wallet PIN.</span>
              </div>
            </div>

            <RecentPayments />
          </div>
        </div>
      </div>
    </main>
  );
}

function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 mb-3.5">
      <span className="w-6 h-6 rounded-full bg-[#1a6cf0] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {step}
      </span>
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">{title}</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="font-semibold text-slate-800 dark:text-slate-100 text-right">{value}</dd>
    </div>
  );
}
