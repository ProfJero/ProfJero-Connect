import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Spinner } from '../../components/ui/States';
import { btnPrimary, btnSecondary } from '../../components/ui/buttons';
import { api, errorMessage } from '../../lib/api';
import { useRefreshAccount } from '../../lib/account';
import { formatGhs } from '../../lib/format';
import type { CustomerPayment } from '../../lib/types';

/** Checks at 0s, 3s, 6s, … — a mobile money approval can take a while. */
const MAX_ATTEMPTS = 8;
const INTERVAL_MS = 3000;

type State =
  | { kind: 'checking' }
  | { kind: 'done'; payment: CustomerPayment }
  | { kind: 'error'; message: string };

/**
 * Return page after checkout (the gateway redirects to
 * /wallet/add-funds/complete?reference=…). Asks the API to verify the
 * payment, polling while it is still pending. The webhook credits the
 * wallet independently, so leaving this page early loses nothing.
 */
export function AddFundsCompletePage() {
  const [params] = useSearchParams();
  const reference = params.get('reference') ?? params.get('trxref');
  const refreshAccount = useRefreshAccount();
  const [state, setState] = useState<State>({ kind: 'checking' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    const timer = window.setTimeout(
      async () => {
        try {
          const res = await api.post<{ payment: CustomerPayment; walletCredited: boolean }>(
            `/customer/payments/${encodeURIComponent(reference)}/verify`,
          );
          if (cancelled) return;
          if (res.payment.status === 'pending' && attempt + 1 < MAX_ATTEMPTS) {
            setAttempt((a) => a + 1);
            return;
          }
          setState({ kind: 'done', payment: res.payment });
          if (res.payment.status === 'success') refreshAccount();
        } catch (err) {
          if (!cancelled) setState({ kind: 'error', message: errorMessage(err) });
        }
      },
      attempt === 0 ? 0 : INTERVAL_MS,
    );
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reference, attempt, refreshAccount]);

  const view = !reference
    ? { kind: 'error' as const, message: 'This link is missing a payment reference.' }
    : state;

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-10 flex-1">
      <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-8 text-center">
        {view.kind === 'checking' && (
          <>
            <Spinner className="w-8 h-8 text-[#1764e0]" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-4">Confirming your payment…</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              This usually takes a few seconds. If you're paying with Mobile Money, approve the prompt on your phone.
            </p>
          </>
        )}

        {view.kind === 'done' && view.payment.status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" strokeWidth={1.75} />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-3">Payment successful</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              {view.payment.units.toLocaleString()} units have been added to your wallet.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {formatGhs(view.payment.amountGhs)} · Ref {view.payment.reference}
            </p>
          </>
        )}

        {view.kind === 'done' && view.payment.status === 'pending' && (
          <>
            <Clock className="w-12 h-12 text-amber-500 mx-auto" strokeWidth={1.75} />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-3">Payment still processing</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              We haven't received confirmation yet. If you completed the payment, your units will be added
              automatically and you'll get a notification. You can safely leave this page.
            </p>
          </>
        )}

        {view.kind === 'done' && view.payment.status !== 'success' && view.payment.status !== 'pending' && (
          <>
            <XCircle className="w-12 h-12 text-rose-500 mx-auto" strokeWidth={1.75} />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-3">Payment not completed</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {view.payment.failureReason ?? 'The payment did not go through.'} No units were added.
            </p>
          </>
        )}

        {view.kind === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-rose-500 mx-auto" strokeWidth={1.75} />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-3">We couldn't check this payment</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{view.message}</p>
          </>
        )}

        {view.kind !== 'checking' && (
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <Link to="/wallet" className={btnPrimary}>Go to Wallet</Link>
            <Link to="/wallet/add-funds" className={btnSecondary}>Add more funds</Link>
          </div>
        )}
      </div>
    </main>
  );
}
