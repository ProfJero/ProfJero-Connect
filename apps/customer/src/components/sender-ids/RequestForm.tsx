import { useDeferredValue, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronDown, Clock, XCircle } from 'lucide-react';
import { checkSenderId, SENDER_ID_DESCRIPTION_MIN } from '@profjero/shared/sender-id-check';
import { Notice } from '../ui/States';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useAccount, usePlatformConfig } from '../../lib/account';
import { cn } from '../../lib/utils';

const senderIdMaxLength = 11;
const descriptionMaxLength = 500;

// Must match SenderIdPurposeSchema in packages/shared.
const purposeOptions = [
  'Business Notifications',
  'Marketing & Promotional',
  'Transactional & Alerts',
  'Authentication & OTP',
];

const inputCls =
  'w-full text-sm font-normal text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-[#1a6cf0]/20 focus:border-[#1a6cf0] transition-all outline-none placeholder-slate-400 dark:placeholder-slate-500';

/**
 * Request form with the same automatic check the server runs, live as
 * the customer types — so they know before submitting whether the name
 * will be approved instantly, needs a quick review, or can't be used.
 */
export function RequestForm({
  onSenderIdChange,
}: {
  onSenderIdChange?: (value: string) => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshNotifications } = useAccount();
  const { senderIdReviewSla } = usePlatformConfig();
  const [senderId, setSenderId] = useState('');
  const [purpose, setPurpose] = useState(purposeOptions[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deferredId = useDeferredValue(senderId);
  const deferredDesc = useDeferredValue(description);
  const check = useMemo(
    () => (deferredId.trim() ? checkSenderId(deferredId, { organisationName: user?.companyName, description: deferredDesc }) : null),
    [deferredId, deferredDesc, user?.companyName],
  );
  // The name on its own (description findings are shown under the description box).
  const nameFindings = check?.findings.filter((f) => f.code !== 'description') ?? [];
  const descFinding = check?.findings.find((f) => f.code === 'description') ?? null;
  const descLength = description.trim().length;

  const handleSenderIdChange = (value: string) => {
    // Letters, digits, spaces, hyphens, underscores only (network rule).
    const clean = value.toUpperCase().replace(/[^A-Z0-9 _-]/g, '');
    setSenderId(clean);
    onSenderIdChange?.(clean);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (descLength < SENDER_ID_DESCRIPTION_MIN) {
      setError(`Please describe how you'll use this Sender ID in at least ${SENDER_ID_DESCRIPTION_MIN} characters.`);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post<{ decision: 'approved' | 'review' }>('/customer/sender-ids', {
        value: senderId.trim(),
        purpose,
        description: description.trim().slice(0, descriptionMaxLength),
      });
      refreshNotifications();
      navigate('/messaging/sender-ids', { state: { requested: senderId.trim(), decision: res.decision } });
    } catch (err) {
      setError(errorMessage(err));
      setIsSubmitting(false);
    }
  };

  const verdict = check?.verdict ?? null;
  const blocked = verdict === 'reject' && nameFindings.some((f) => f.verdict === 'reject');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sender ID */}
      <div>
        <label htmlFor="sender-id" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
          Sender ID <span className="text-rose-500">*</span>
        </label>
        <input
          id="sender-id"
          type="text"
          required
          maxLength={senderIdMaxLength}
          value={senderId}
          onChange={(e) => handleSenderIdChange(e.target.value)}
          placeholder="e.g. YOURBRAND"
          aria-describedby="sender-id-check"
          className={inputCls}
        />
        <div className="flex justify-between items-center mt-1.5 text-xs text-slate-500 dark:text-slate-500 gap-3">
          <span>3–11 letters, numbers or spaces. Use your business or brand name.</span>
          <span className="font-medium text-slate-500 dark:text-slate-400 shrink-0">
            {senderId.length}/{senderIdMaxLength}
          </span>
        </div>

        <div id="sender-id-check" aria-live="polite">
          {check && (
            <div
              className={cn(
                'mt-3 rounded-lg border p-3 text-xs',
                nameFindings.some((f) => f.verdict === 'reject')
                  ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-200'
                  : nameFindings.length > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-100'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-100',
              )}
            >
              {nameFindings.some((f) => f.verdict === 'reject') ? (
                <p className="flex items-center gap-1.5 font-bold"><XCircle className="w-4 h-4" strokeWidth={2} /> This Sender ID can't be used</p>
              ) : nameFindings.length > 0 ? (
                <p className="flex items-center gap-1.5 font-bold"><Clock className="w-4 h-4" strokeWidth={2} /> Needs a quick review by our team (usually {senderIdReviewSla})</p>
              ) : (
                <p className="flex items-center gap-1.5 font-bold"><CheckCircle2 className="w-4 h-4" strokeWidth={2} /> Passes our checks — approved as soon as you submit</p>
              )}
              {nameFindings.length > 0 && (
                <ul className="mt-1.5 space-y-1 pl-5 list-disc">
                  {nameFindings.map((f) => <li key={f.code + f.message}>{f.message}</li>)}
                </ul>
              )}
              {nameFindings.length === 0 && check.matchesOrganisation && (
                <p className="mt-1">It matches your organisation name{user?.companyName ? ` (${user.companyName})` : ''}.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Purpose */}
      <div>
        <label htmlFor="purpose" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
          Purpose <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <select id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} className={cn(inputCls, 'pr-10 appearance-none cursor-pointer')}>
            {purposeOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-500">
            <ChevronDown className="w-4 h-4" strokeWidth={2} />
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1.5">Select the main purpose for this Sender ID.</p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
          How will you use it? <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="description"
          required
          minLength={SENDER_ID_DESCRIPTION_MIN}
          maxLength={descriptionMaxLength}
          rows={4}
          placeholder="e.g. We send appointment reminders and service updates to patients registered at our clinic in Kumasi."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-describedby="description-hint"
          className={cn(inputCls, 'p-3.5 resize-none leading-relaxed')}
        />
        <div id="description-hint" className="flex justify-between items-start mt-1 text-xs gap-3">
          <span className={cn(descFinding && descLength >= SENDER_ID_DESCRIPTION_MIN ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-500')}>
            {descFinding && descLength >= SENDER_ID_DESCRIPTION_MIN
              ? descFinding.message
              : `Who will you message, and about what? At least ${SENDER_ID_DESCRIPTION_MIN} characters.`}
          </span>
          <span className={cn('font-semibold shrink-0', descLength >= SENDER_ID_DESCRIPTION_MIN ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400')}>
            {descLength < SENDER_ID_DESCRIPTION_MIN ? `${SENDER_ID_DESCRIPTION_MIN - descLength} more` : `${description.length}/${descriptionMaxLength}`}
          </span>
        </div>
      </div>

      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-600 dark:text-slate-300 flex gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 text-[#1764e0] dark:text-blue-400" strokeWidth={2} />
        <p>
          <strong className="text-slate-800 dark:text-slate-100">Final verification is done by our SMS provider</strong> with the mobile
          networks, when you send your first message from this Sender ID. Send one message after approval to start it.
        </p>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || blocked || descLength < SENDER_ID_DESCRIPTION_MIN}
          className="flex-1 bg-[#1a6cf0] hover:bg-[#155cd0] text-white font-semibold py-2.5 px-4 rounded-lg text-sm shadow-xs transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Submitting…</span>
            </>
          ) : (
            <span>{verdict === 'approve' ? 'Submit and activate' : 'Submit Request'}</span>
          )}
        </button>
        <Link
          to="/messaging/sender-ids"
          className="flex-1 text-center bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm transition duration-150"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
