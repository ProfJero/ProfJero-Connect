import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Send } from 'lucide-react';
import { getSegmentInfo } from '@profjero/shared/sms-segments';
import { ComposeForm } from '../../components/send-sms/ComposeForm';
import { MessageSummary } from '../../components/send-sms/MessageSummary';
import { ScheduledResult, SendResult } from '../../components/send-sms/SendResult';
import { hasVariables } from '@profjero/shared/template';
import { inputClass } from '../../components/ui/buttons';
import { cn } from '../../lib/utils';
import { ErrorState, SkeletonRows } from '../../components/ui/States';
import { api, errorMessage, newIdempotencyKey } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { usePlatformConfig, useRefreshAccount, useWallet } from '../../lib/account';
import { parsePhoneList } from '../../lib/phone';
import { emptyRecipients, summarizeRecipients, type RecipientDraft } from '../../lib/recipients';
import type { BatchWithRecords, ContactGroup, CustomerSenderId } from '../../lib/types';

/**
 * CP4 — compose and send. Uses the same reserve → send → confirm/release
 * flow as the API (state.md §7). The cost preview uses the shared segment
 * calculator, the same code the server bills with.
 */
export function SendSmsPage() {
  const { maxRecipientsPerSend } = usePlatformConfig();
  const senderIds = useApi<{ senderIds: CustomerSenderId[] }>('/customer/sender-ids');
  const groupsRes = useApi<{ groups: ContactGroup[] }>('/customer/contact-groups');
  const { data: wallet } = useWallet();
  const refreshAccount = useRefreshAccount();

  const [senderChoice, setSenderChoice] = useState<string | null>(null);
  // "Message this group" links pre-select groups via router state.
  const location = useLocation();
  const [recipients, setRecipients] = useState<RecipientDraft>(() => {
    const state = location.state as { groupIds?: unknown } | null;
    const groupIds = Array.isArray(state?.groupIds) ? state.groupIds.filter((g): g is string => typeof g === 'string') : [];
    return { ...emptyRecipients, groupIds };
  });
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchWithRecords | null>(null);
  const [scheduled, setScheduled] = useState<{ name: string; at: string } | null>(null);
  const [when, setWhen] = useState<'now' | 'later'>('now');
  const [scheduleAt, setScheduleAtRaw] = useState('');
  const [scheduleTooSoon, setScheduleTooSoon] = useState(false);
  // "Now" is read when the time is picked (render must stay pure).
  const setScheduleAt = (v: string) => {
    setScheduleAtRaw(v);
    setScheduleTooSoon(!!v && new Date(v).getTime() < Date.now() + 60_000);
  };
  const [minLocal] = useState(() => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16));
  // One key per composed message: a retry after a network error reuses it,
  // so the server returns the original batch instead of sending twice.
  const keyRef = useRef<string | null>(null);

  const groups = groupsRes.data?.groups ?? [];
  const approved = (senderIds.data?.senderIds ?? []).filter((s) => s.status === 'approved');
  const senderId = senderChoice && approved.some((s) => s.value === senderChoice) ? senderChoice : approved[0]?.value ?? null;

  const segments = useMemo(() => getSegmentInfo(message), [message]);
  const summary = summarizeRecipients(recipients, groups);
  const audience = useMemo(
    () => ({
      recipients: [...parsePhoneList(recipients.manualText).valid, ...recipients.uploaded],
      contactIds: recipients.contacts.map((c) => c.id),
      groupIds: recipients.groupIds,
    }),
    [recipients],
  );

  // Personalised messages differ per person: ask the server for the exact
  // units, sample messages and any missing fields (debounced).
  const personalized = hasVariables(message);
  const previewKey = personalized && summary.count > 0 ? JSON.stringify({ message, ...audience }) : null;
  const [preview, setPreview] = useState<{ key: string; units?: number; samples?: Array<{ phone: string; message: string }>; error?: string } | null>(null);
  useEffect(() => {
    if (!previewKey) return;
    const t = window.setTimeout(() => {
      api
        .post<{ units: number; samples: Array<{ phone: string; message: string }> }>('/customer/sms/preview', JSON.parse(previewKey))
        .then((r) => setPreview({ key: previewKey, units: r.units, samples: r.samples }))
        .catch((err) => setPreview({ key: previewKey, error: errorMessage(err) }));
    }, 500);
    return () => window.clearTimeout(t);
  }, [previewKey]);
  const currentPreview = preview && preview.key === previewKey ? preview : null;
  const units = currentPreview?.units ?? summary.count * segments.segmentCount;
  const balance = wallet?.availableUnits ?? null;

  const blockers: string[] = [];
  if (!senderId) blockers.push('An approved Sender ID is required.');
  if (summary.count === 0) blockers.push('Add at least one recipient.');
  if (summary.invalidManual.length > 0) blockers.push('Fix or remove the invalid phone numbers.');
  if (!message.trim()) blockers.push('Write a message.');
  if (summary.count > maxRecipientsPerSend && !summary.isUpperBound)
    blockers.push(`Up to ${maxRecipientsPerSend.toLocaleString()} recipients per send — split your list.`);
  if (balance !== null && !summary.isUpperBound && units > balance && when === 'now') blockers.push('Top up your wallet to cover this send.');
  if (currentPreview?.error) blockers.push(currentPreview.error);
  if (personalized && previewKey && !currentPreview) blockers.push('Checking personalised messages…');
  const scheduleTime = scheduleAt ? new Date(scheduleAt) : null;
  if (when === 'later' && (!scheduleTime || Number.isNaN(scheduleTime.getTime()))) blockers.push('Choose a date and time to send.');
  else if (when === 'later' && scheduleTooSoon) blockers.push('Choose a time at least a minute from now.');

  const touch = <T,>(setter: (v: T) => void) => (v: T) => {
    keyRef.current = null; // Content changed → this is a new send.
    setError(null);
    setter(v);
  };

  const handleSchedule = async () => {
    if (blockers.length > 0 || !senderId || !scheduleTime) return;
    setSending(true);
    setError(null);
    const name = `${message.trim().slice(0, 40)}${message.trim().length > 40 ? '…' : ''}`;
    try {
      await api.post('/customer/campaigns', {
        name,
        kind: 'once',
        senderId,
        message,
        ...audience,
        scheduledAt: scheduleTime.toISOString(),
      });
      setScheduled({ name, at: scheduleTime.toISOString() });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (when === 'later') return handleSchedule();
    if (blockers.length > 0 || !senderId) return;
    keyRef.current ??= newIdempotencyKey('send');
    setSending(true);
    setError(null);
    try {
      const res = await api.post<BatchWithRecords>(
        '/customer/sms/send',
        { senderId, message, ...audience },
        { idempotencyKey: keyRef.current },
      );
      setResult(res);
      refreshAccount();
    } catch (err) {
      setError(errorMessage(err));
      refreshAccount();
    } finally {
      setSending(false);
    }
  };

  const startNew = () => {
    keyRef.current = null;
    setResult(null);
    setScheduled(null);
    setWhen('now');
    setScheduleAtRaw('');
    setRecipients(emptyRecipients);
    setMessage('');
  };

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-5 flex-1">
      <div>
        <nav aria-label="Breadcrumb" className="flex text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
          <Link to="/messaging" className="text-[#1764e0] dark:text-blue-400 hover:underline">
            Messaging
          </Link>
          <span className="mx-1.5 text-slate-500 dark:text-slate-500">&gt;</span>
          <span className="text-slate-600 dark:text-slate-300">Send SMS</span>
        </nav>
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-[#1764e0] dark:text-blue-400 shrink-0">
            <Send className="w-5 h-5 -rotate-45" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Send SMS</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Send a message to one person or your whole list.
            </p>
          </div>
        </div>
      </div>

      {scheduled ? (
        <ScheduledResult name={scheduled.name} at={scheduled.at} onNew={startNew} />
      ) : result ? (
        <SendResult batch={result.batch} onNew={startNew} />
      ) : senderIds.loading && !senderIds.data ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <SkeletonRows rows={6} />
        </div>
      ) : senderIds.error ? (
        <ErrorState error={senderIds.error} onRetry={senderIds.refresh} className="m-0" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <ComposeForm
            senderIds={senderIds.data?.senderIds ?? []}
            senderId={senderId ?? ''}
            onSenderIdChange={touch(setSenderChoice)}
            recipients={recipients}
            onRecipientsChange={touch(setRecipients)}
            groups={groups}
            message={message}
            onMessageChange={touch(setMessage)}
            segments={segments}
          />
          <MessageSummary
            senderId={senderId}
            recipientCount={summary.count}
            isUpperBound={summary.isUpperBound}
            segments={segments.segmentCount}
            balance={balance}
            canSend={blockers.length === 0}
            blockers={blockers}
            sending={sending}
            error={error}
            onSend={handleSend}
            unitsExact={currentPreview?.units ?? null}
            actionLabel={when === 'later' ? 'Schedule message' : undefined}
          >
            {currentPreview?.samples && currentPreview.samples.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Preview</div>
                <ul className="space-y-1.5">
                  {currentPreview.samples.map((x) => (
                    <li key={x.phone} className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-2">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{x.phone}</div>
                      <div className="text-[11px] text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words">{x.message}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <fieldset>
              <legend className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 mb-1.5">When</legend>
              <div className="grid grid-cols-2 gap-1.5" role="radiogroup">
                {(['now', 'later'] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    role="radio"
                    aria-checked={when === w}
                    onClick={() => setWhen(w)}
                    className={cn(
                      'px-2 py-1.5 rounded-lg border text-[11px] font-semibold',
                      when === w
                        ? 'border-[#1764e0] bg-blue-50 text-[#1764e0] dark:bg-blue-500/10 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300',
                    )}
                  >
                    {w === 'now' ? 'Send now' : 'Schedule'}
                  </button>
                ))}
              </div>
              {when === 'later' && (
                <div className="mt-2">
                  <label htmlFor="schedule-at" className="sr-only">Send at</label>
                  <input
                    id="schedule-at"
                    type="datetime-local"
                    value={scheduleAt}
                    min={minLocal}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    className={inputClass}
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Your local time. Units are taken when it sends.</p>
                </div>
              )}
            </fieldset>
          </MessageSummary>
        </div>
      )}
    </main>
  );
}
