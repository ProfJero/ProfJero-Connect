import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, Sparkles, X } from 'lucide-react';

const CHECK_EVERY_MS = 5 * 60_000;
const MIN_GAP_MS = 60_000;

/**
 * Tells the user when a newer version has been deployed and lets them load
 * it with one click — so nobody keeps using an old copy from cache.
 *
 * Checks /version.json (a tiny static file, no database reads) every few
 * minutes, when the tab regains focus and on navigation.
 */
export function UpdateBanner() {
  const [update, setUpdate] = useState<{ version: string; notes: string[] } | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const lastCheck = useRef(0);
  const { pathname } = useLocation();

  const check = useCallback(async () => {
    if (__APP_VERSION__ === 'dev' || document.visibilityState === 'hidden') return;
    if (Date.now() - lastCheck.current < MIN_GAP_MS) return;
    lastCheck.current = Date.now();
    try {
      const res = await fetch(`/version.json?ts=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const v = (await res.json()) as { version?: string; notes?: string[] };
      if (!v.version || v.version === __APP_VERSION__) return;
      let dismissed: string | null = null;
      try {
        dismissed = sessionStorage.getItem('pja.updateDismissed');
      } catch {
        /* ignore */
      }
      if (dismissed === v.version) return;
      setUpdate({ version: v.version, notes: Array.isArray(v.notes) ? v.notes.slice(0, 6) : [] });
    } catch {
      /* offline — try later */
    }
  }, []);

  useEffect(() => {
    // Checks run off the render path (timers and events only).
    const first = window.setTimeout(() => void check(), 3000);
    const id = window.setInterval(() => void check(), CHECK_EVERY_MS);
    const onFocus = () => void check();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [check]);

  useEffect(() => {
    const t = window.setTimeout(() => void check(), 0);
    return () => window.clearTimeout(t);
  }, [pathname, check]);

  if (!update) return null;

  const later = () => {
    try {
      sessionStorage.setItem('pja.updateDismissed', update.version);
    } catch {
      /* ignore */
    }
    setUpdate(null);
  };

  return (
    <div role="status" aria-live="polite" className="fixed z-[60] bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[380px]">
      <div className="rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 p-4">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-[#1a6cf0] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">A new version is ready</p>
            <p className="text-xs text-slate-300 mt-0.5">Update to get the latest improvements. It only takes a second.</p>
            {update.notes.length > 0 && (
              <>
                <button type="button" onClick={() => setShowNotes((v) => !v)} className="mt-2 text-[11px] font-semibold text-blue-300 hover:underline" aria-expanded={showNotes}>
                  {showNotes ? 'Hide what’s new' : 'What’s new?'}
                </button>
                {showNotes && (
                  <ul className="mt-2 space-y-1 text-xs text-slate-200 list-disc pl-4">
                    {update.notes.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                )}
              </>
            )}
          </div>
          <button type="button" onClick={later} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Remind me later">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white text-slate-900 hover:bg-blue-50 text-xs font-bold py-2 rounded-lg"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Update now
          </button>
          <button type="button" onClick={later} className="px-4 text-xs font-semibold text-slate-300 hover:text-white">
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
