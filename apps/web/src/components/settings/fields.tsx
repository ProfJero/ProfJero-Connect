import { useState, type ReactNode } from 'react';
import { Save, Lock } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

export const inputCls =
  'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500';

export function SectionCard({
  title,
  description,
  children,
  readOnly,
}: {
  title: string;
  description: string;
  children: ReactNode;
  readOnly?: boolean;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
        {readOnly && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md shrink-0">
            <Lock className="w-3 h-3" /> Read-only for your role
          </span>
        )}
      </div>
      {children}
    </Card>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[11px] font-semibold text-slate-600 mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-500 mt-1 leading-snug">{hint}</p>}
    </div>
  );
}

export function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div>
        <label htmlFor={id} className="text-xs font-semibold text-slate-800">
          {label}
        </label>
        {description && <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex w-9 h-5 rounded-full shrink-0 transition-colors disabled:opacity-50',
          checked ? 'bg-[#1976d2]' : 'bg-slate-300',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}

export function SaveBar({
  dirty,
  saving,
  onReset,
  message,
  disabled,
}: {
  dirty: boolean;
  saving: boolean;
  onReset: () => void;
  message: { tone: 'success' | 'error'; text: string } | null;
  disabled?: boolean;
}) {
  return (
    <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
      <div aria-live="polite" className={cn('text-xs', message?.tone === 'error' ? 'text-rose-600' : 'text-emerald-700')}>
        {message?.text}
      </div>
      {!disabled && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReset}
            disabled={!dirty || saving}
            className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1976d2] hover:bg-[#1565c0] text-white text-xs font-semibold disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}
    </div>
  );
}

/** Draft state over a saved value, with dirty tracking. */
// eslint-disable-next-line react-refresh/only-export-components
export function useDraft<T>(saved: T) {
  const [draft, setDraft] = useState<T | null>(null);
  const value = draft ?? saved;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(saved);
  const set = <K extends keyof T>(key: K, v: T[K]) => setDraft({ ...value, [key]: v });
  return { value, dirty, set, reset: () => setDraft(null) };
}
