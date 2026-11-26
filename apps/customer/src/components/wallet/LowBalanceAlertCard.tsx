import { useState, type FormEvent } from 'react';
import { BellRing } from 'lucide-react';
import { Notice, Spinner } from '../ui/States';
import { btnPrimary, cardClass, inputClass } from '../ui/buttons';
import { api, errorMessage } from '../../lib/api';
import { useWallet } from '../../lib/account';
import { cn } from '../../lib/utils';

/** Low-balance alert level (wallet.lowBalanceThreshold). */
export function LowBalanceAlertCard() {
  const { data: wallet, refresh } = useWallet();
  const current = wallet?.lowBalanceThreshold ?? null;
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const value = draft ?? (current === null ? '' : String(current));

  const save = async (threshold: number | null) => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/customer/wallet/threshold', { threshold });
      setDraft(null);
      refresh();
      setMessage({ tone: 'success', text: threshold === null ? 'Low-balance alerts turned off.' : 'Alert level saved.' });
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n < 1) {
      setMessage({ tone: 'error', text: 'Enter a whole number of units (1 or more).' });
      return;
    }
    void save(n);
  };

  return (
    <div className={cn(cardClass, 'p-5')}>
      <div className="flex items-center gap-2.5 mb-3">
        <BellRing className="w-4 h-4 text-amber-500" strokeWidth={2} />
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Low-balance alert</h3>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
        We'll notify you (in-app and by email) when a send takes your balance below this many units.
      </p>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="e.g. 200"
          value={value}
          onChange={(e) => setDraft(e.target.value)}
          className={cn(inputClass, 'flex-1')}
          aria-label="Alert level in units"
        />
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving && <Spinner />}
          Save
        </button>
      </form>
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>{current === null ? 'Alerts are off.' : `Alerting below ${current.toLocaleString()} units.`}</span>
        {current !== null && (
          <button type="button" onClick={() => save(null)} disabled={saving} className="font-semibold text-rose-600 dark:text-rose-400 hover:underline">
            Turn off
          </button>
        )}
      </div>
      {message && <Notice tone={message.tone} className="mt-3">{message.text}</Notice>}
    </div>
  );
}
