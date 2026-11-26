/**
 * In-page checkout. The payment gateway's own window opens over our page
 * (an iframe the gateway hosts), so the buyer never leaves ProfJero
 * Connect. If the gateway script can't load (blocked, offline, old
 * browser), we fall back to the hosted checkout page — same transaction,
 * same reference, so nothing is charged twice.
 */

const SCRIPT_URL = 'https://js.paystack.co/v2/inline.js';

interface PaystackTransaction {
  reference?: string;
  status?: string;
}

interface PaystackPopInstance {
  resumeTransaction(
    accessCode: string,
    callbacks?: {
      onSuccess?: (tx: PaystackTransaction) => void;
      onCancel?: () => void;
      onError?: (err: { message?: string }) => void;
      onLoad?: () => void;
    },
  ): unknown;
}

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopInstance;
  }
}

let loading: Promise<boolean> | null = null;

function loadScript(timeoutMs = 8000): Promise<boolean> {
  if (window.PaystackPop) return Promise.resolve(true);
  if (loading) return loading;
  loading = new Promise<boolean>((resolve) => {
    const el = document.createElement('script');
    el.src = SCRIPT_URL;
    el.async = true;
    const timer = window.setTimeout(() => resolve(false), timeoutMs);
    el.onload = () => {
      window.clearTimeout(timer);
      resolve(Boolean(window.PaystackPop));
    };
    el.onerror = () => {
      window.clearTimeout(timer);
      resolve(false);
    };
    document.head.appendChild(el);
  }).then((ok) => {
    if (!ok) loading = null; // allow a later retry
    return ok;
  });
  return loading;
}

/** Warm the script up (e.g. when a bundle is picked) so the window opens instantly. */
export function preloadCheckout(): void {
  void loadScript();
}

export type CheckoutOutcome = 'paid' | 'closed' | 'redirected';

/**
 * Open the gateway window for an initialised transaction. Resolves when
 * the buyer pays or closes it. Without an access code, or if the window
 * can't open, sends the browser to `fallbackUrl` ('redirected').
 */
export async function openCheckout(accessCode: string | null | undefined, fallbackUrl: string): Promise<CheckoutOutcome> {
  const redirect = (): CheckoutOutcome => {
    window.location.assign(fallbackUrl);
    return 'redirected';
  };
  if (!accessCode) return redirect();
  const ok = await loadScript();
  if (!ok || !window.PaystackPop) return redirect();

  return new Promise<CheckoutOutcome>((resolve) => {
    try {
      const pop = new window.PaystackPop!();
      pop.resumeTransaction(accessCode, {
        onSuccess: () => resolve('paid'),
        onCancel: () => resolve('closed'),
        onError: () => resolve(redirect()),
      });
    } catch {
      resolve(redirect());
    }
  });
}
