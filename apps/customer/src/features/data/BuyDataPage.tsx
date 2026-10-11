import { useDeferredValue, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Check, Loader2, Lock, RotateCcw, ShieldCheck, User, Users, Wifi, Zap } from 'lucide-react';
import { detectGhanaNetwork } from '@profjero/shared/networks';
import { PageHeader } from '../../components/ui/PageHeader';
import { PaymentMethodSelector } from '../../components/add-funds/PaymentMethodSelector';
import { api, errorMessage, newIdempotencyKey } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useProfile } from '../../lib/hooks';
import { formatGhs, formatPhone } from '../../lib/format';
import { normalizePhone } from '../../lib/phone';
import { networkStyle } from '../../lib/services';
import { inputClass } from '../../components/ui/buttons';
import { cn } from '../../lib/utils';
import type { DataBundle, DataCatalog, DataOrder } from '../../lib/types';

const NETWORK_ORDER = ['MTN', 'Telecel', 'AirtelTigo'];

/** Size in GB for sorting and "per GB" hints ("500MB" → 0.5). */
function sizeGb(size: string): number | null {
  const m = size.replace(/\s/g, '').match(/^([\d.]+)(GB|MB|TB)$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2].toUpperCase();
  return unit === 'MB' ? n / 1000 : unit === 'TB' ? n * 1000 : n;
}

function isGhanaMobile(raw: string): boolean {
  const n = normalizePhone(raw);
  return /^233[2-5]\d{8}$/.test(n);
}

export function BuyDataPage() {
  const [params] = useSearchParams();
  const catalog = useApi<DataCatalog>('/customer/data/bundles');
  const profile = useProfile();

  const [number, setNumber] = useState(params.get('number') ?? '');
  const [pickedNetwork, setPickedNetwork] = useState<string | null>(params.get('network'));
  const [bundleId, setBundleId] = useState<string | null>(params.get('bundle'));
  const [method, setMethod] = useState<'mobile_money' | 'card'>('mobile_money');
  const [portedOk, setPortedOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One key per (bundle, number) so a double click or retry reuses the checkout.
  const [keyFor, setKeyFor] = useState<{ sig: string; key: string } | null>(null);

  const bundles = useMemo(() => catalog.data?.bundles ?? [], [catalog.data]);
  const networks = useMemo(() => {
    const present = new Set(bundles.map((b) => b.networkKey));
    return [...NETWORK_ORDER.filter((n) => present.has(n)), ...[...present].filter((n) => !NETWORK_ORDER.includes(n))];
  }, [bundles]);

  const validNumber = isGhanaMobile(number);
  const detected = validNumber ? detectGhanaNetwork(number) : null;
  const selectedBundle = bundles.find((b) => b.id === bundleId) ?? null;
  const activeNetwork = selectedBundle?.networkKey ?? pickedNetwork ?? detected ?? networks[0] ?? null;
  const shown = bundles
    .filter((b) => b.networkKey === activeNetwork)
    .sort((a, b) => (sizeGb(a.size) ?? 1e9) - (sizeGb(b.size) ?? 1e9) || a.displayOrder - b.displayOrder);
  const mismatch = Boolean(selectedBundle && detected && selectedBundle.networkKey !== detected);

  const chooseNetwork = (n: string) => {
    setPickedNetwork(n);
    if (selectedBundle && selectedBundle.networkKey !== n) setBundleId(null);
  };
  const onNumber = (v: string) => {
    setNumber(v);
    setPortedOk(false);
    setError(null);
    // Follow the number's network unless the buyer already chose a bundle.
    if (!selectedBundle) setPickedNetwork(null);
  };

  const canPay = Boolean(selectedBundle && validNumber && (!mismatch || portedOk) && catalog.data?.checkoutEnabled && !busy);

  const pay = async () => {
    if (!selectedBundle || !canPay) return;
    setBusy(true);
    setError(null);
    const sig = `${selectedBundle.id}|${normalizePhone(number)}`;
    const key = keyFor?.sig === sig ? keyFor.key : newIdempotencyKey('data');
    setKeyFor({ sig, key });
    try {
      const res = await api.post<{ order: DataOrder; checkoutUrl: string }>(
        '/customer/data/orders',
        { bundleId: selectedBundle.id, recipientNumber: number, method },
        { idempotencyKey: key },
      );
      window.location.assign(res.checkoutUrl);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const myPhone = profile.data?.customer.phone ?? null;

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 max-w-7xl w-full mx-auto">
      <PageHeader
        icon={Wifi}
        title="Buy data"
        subtitle="Send a data bundle to any MTN, Telecel or AirtelTigo number. Pay only for what you buy."
        actions={
          <Link to="/services/data/orders" className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
            My orders
          </Link>
        }
      />

      {catalog.data && !catalog.data.checkoutEnabled && (
        <div role="alert" className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-px" strokeWidth={2} />
          {catalog.data.checkoutMessage ?? 'Payments are paused right now. Please check back shortly.'}
        </div>
      )}

      {catalog.error && !catalog.data ? (
        <div role="alert" className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300">
          Couldn't load bundles. {errorMessage(catalog.error)}{' '}
          <button type="button" onClick={catalog.refresh} className="font-semibold text-[#1764e0] dark:text-blue-400 hover:underline">Try again</button>
        </div>
      ) : catalog.data && bundles.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <Wifi className="w-10 h-10 mx-auto text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
          <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">Bundles are being stocked</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Data bundles will be available to buy here shortly. Please check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1 — who */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6">
              <StepTitle n={1} title="Who is it for?" hint="Enter the phone number that should receive the data." />
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label htmlFor="data-number" className="sr-only">Phone number</label>
                  <input
                    id="data-number"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="e.g. 024 123 4567"
                    value={number}
                    onChange={(e) => onNumber(e.target.value)}
                    className={cn(inputClass, 'text-base sm:text-sm py-3 font-mono tracking-wide')}
                    aria-describedby="data-number-hint"
                  />
                </div>
                {myPhone && isGhanaMobile(myPhone) && normalizePhone(myPhone) !== normalizePhone(number) && (
                  <button type="button" onClick={() => onNumber(myPhone)} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <User className="w-3.5 h-3.5" strokeWidth={2} /> My number
                  </button>
                )}
              </div>
              <ContactQuickPick onPick={onNumber} />
              <p id="data-number-hint" className="mt-2 text-[11px] min-h-4">
                {number.trim() === '' ? (
                  <span className="text-slate-500 dark:text-slate-400">Local (024…) or international (+233…) format.</span>
                ) : !validNumber ? (
                  <span className="text-rose-600 dark:text-rose-400">That doesn't look like a Ghana mobile number yet.</span>
                ) : detected ? (
                  <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className={cn('px-1.5 py-px rounded text-[10px] font-bold', networkStyle(detected).chip)}>{detected}</span>
                    number — showing {detected} bundles.
                  </span>
                ) : (
                  <span className="text-slate-600 dark:text-slate-300">Choose the number's network below.</span>
                )}
              </p>
            </section>

            {/* Step 2 — what */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6">
              <StepTitle n={2} title="Choose a bundle" hint="Prices include everything. No hidden fees." />
              <div role="tablist" aria-label="Network" className="mt-4 flex flex-wrap gap-2">
                {networks.map((n) => {
                  const on = n === activeNetwork;
                  return (
                    <button
                      key={n}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => chooseNetwork(n)}
                      className={cn(
                        'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-bold transition',
                        on ? 'border-transparent ring-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white ' + networkStyle(n).ring : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
                      )}
                    >
                      <span className={cn('w-2.5 h-2.5 rounded-full', networkStyle(n).dot)} />
                      {n}
                      {detected === n && <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">· this number</span>}
                    </button>
                  );
                })}
              </div>

              {!catalog.data ? (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
                </div>
              ) : shown.length === 0 ? (
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">No {activeNetwork} bundles on sale right now.</p>
              ) : (
                <div role="radiogroup" aria-label={`${activeNetwork} bundles`} className="mt-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {shown.map((b) => (
                    <BundleCard key={b.id} bundle={b} selected={b.id === bundleId} onSelect={() => { setBundleId(b.id); setError(null); }} />
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6">
              <PaymentMethodSelector selected={method} onSelect={setMethod} step={3} />
            </section>
          </div>

          {/* Summary */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Order summary</h2>
              <dl className="mt-4 space-y-3 text-xs">
                <Row label="Bundle" value={selectedBundle ? `${selectedBundle.size} · ${selectedBundle.networkKey}` : '—'} />
                <Row label="Send to" value={validNumber ? formatPhone(normalizePhone(number)) : '—'} mono />
                <Row label="Pay with" value={method === 'card' ? 'Card' : 'Mobile money'} />
              </dl>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Total</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{selectedBundle ? formatGhs(selectedBundle.sellPriceGhs) : '—'}</span>
              </div>

              {mismatch && selectedBundle && (
                <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                  <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-snug">
                    This looks like a <strong>{detected}</strong> number, but the bundle is for <strong>{selectedBundle.networkKey}</strong>. Data
                    only works on the network the number is on today.
                  </p>
                  <label className="mt-2 flex items-start gap-2 text-[11px] font-semibold text-amber-900 dark:text-amber-100">
                    <input type="checkbox" checked={portedOk} onChange={(e) => setPortedOk(e.target.checked)} className="mt-0.5" />
                    This number has moved to {selectedBundle.networkKey}
                  </label>
                </div>
              )}

              {error && (
                <p role="alert" className="mt-3 text-[11px] text-rose-600 dark:text-rose-400">{error}</p>
              )}

              <button
                type="button"
                onClick={pay}
                disabled={!canPay}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold px-4 py-3 rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" strokeWidth={2.5} />}
                {selectedBundle ? `Pay ${formatGhs(selectedBundle.sellPriceGhs)}` : 'Choose a bundle'}
              </button>
              <p className="mt-2 text-[10px] text-center text-slate-500 dark:text-slate-400">
                You'll confirm the payment on a secure checkout page.
              </p>
            </div>

            <ul className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
              {[
                { icon: Zap, text: 'Sent to the number seconds after you pay' },
                { icon: RotateCcw, text: 'Full refund if it can’t be delivered' },
                { icon: ShieldCheck, text: 'Secure mobile money and card payments' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}
    </main>
  );
}

function StepTitle({ n, title, hint }: { n: number; title: string; hint: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">{title}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={cn('font-semibold text-slate-800 dark:text-slate-100 text-right', mono && 'font-mono')}>{value}</dd>
    </div>
  );
}

function BundleCard({ bundle: b, selected, onSelect }: { bundle: DataBundle; selected: boolean; onSelect: () => void }) {
  const gb = sizeGb(b.size);
  const perGb = gb && gb >= 1 ? b.sellPriceGhs / gb : null;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${b.size} for ${formatGhs(b.sellPriceGhs)}`}
      onClick={onSelect}
      className={cn(
        'relative text-left rounded-xl border p-3.5 transition-all',
        selected
          ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/10'
          : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500/40 bg-white dark:bg-slate-900',
      )}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center">
          <Check className="w-3 h-3" strokeWidth={3} />
        </span>
      )}
      <span className="block text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{b.size}</span>
      <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">{b.label}</span>
      <span className="mt-2 block text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatGhs(b.sellPriceGhs)}</span>
      {perGb !== null && <span className="block text-[10px] text-slate-500 dark:text-slate-400">{formatGhs(perGb)} per GB</span>}
    </button>
  );
}

/** Search saved contacts by name or number and fill the number box. */
function ContactQuickPick({ onPick }: { onPick: (phone: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const deferred = useDeferredValue(q.trim());
  const search = useApi<{ contacts: Array<{ id: string; name: string; phone: string }> }>(
    open && deferred ? `/customer/contacts?q=${encodeURIComponent(deferred)}&limit=6` : null,
  );
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1764e0] dark:text-blue-400 hover:underline">
        <Users className="w-3.5 h-3.5" strokeWidth={2} /> Choose from my contacts
      </button>
    );
  }
  return (
    <div className="mt-3">
      <label htmlFor="data-contact-search" className="sr-only">Search contacts</label>
      <input
        id="data-contact-search"
        autoFocus
        placeholder="Search contacts by name or number…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className={inputClass}
      />
      {deferred && (
        <ul className="mt-1.5 border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
          {(search.data?.contacts ?? []).length === 0 ? (
            <li className="px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400">{search.loading ? 'Searching…' : `No contacts match "${deferred}".`}</li>
          ) : (
            search.data!.contacts.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => { onPick(c.phone); setOpen(false); setQ(''); }} className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{c.name}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono shrink-0">{formatPhone(c.phone)}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      <button type="button" onClick={() => { setOpen(false); setQ(''); }} className="mt-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:underline inline-flex items-center gap-1">
        Cancel
      </button>
    </div>
  );
}
