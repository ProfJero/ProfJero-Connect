import { Link } from 'react-router-dom';
import { Package, Users, MessageSquare, Info, Clock } from 'lucide-react';
import type { SegmentInfo } from '@profjero/shared/sms-segments';
import { RecipientPicker } from './RecipientPicker';
import { inputClass } from '../ui/buttons';
import { cn } from '../../lib/utils';
import type { RecipientDraft } from '../../lib/recipients';
import type { ContactGroup, CustomerSenderId } from '../../lib/types';
import { usePlatformConfig } from '../../lib/account';

const MAX_MESSAGE_LENGTH = 1000;

export function ComposeForm({
  senderIds,
  senderId,
  onSenderIdChange,
  recipients,
  onRecipientsChange,
  groups,
  message,
  onMessageChange,
  segments,
}: {
  senderIds: CustomerSenderId[];
  senderId: string;
  onSenderIdChange: (v: string) => void;
  recipients: RecipientDraft;
  onRecipientsChange: (v: RecipientDraft) => void;
  groups: ContactGroup[];
  message: string;
  onMessageChange: (v: string) => void;
  segments: SegmentInfo;
}) {
  const { senderIdReviewSla } = usePlatformConfig();
  const approved = senderIds.filter((s) => s.status === 'approved');
  const pending = senderIds.filter((s) => s.status === 'pending');
  const perSegment = segments.encoding === 'GSM-7' ? (segments.segmentCount > 1 ? 153 : 160) : segments.segmentCount > 1 ? 67 : 70;

  return (
    <section className="lg:col-span-8 space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-xs space-y-5">
        {/* Sender ID */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Package className="w-4 h-4 text-slate-700 dark:text-slate-300" strokeWidth={2} />
            <label htmlFor="sender-id" className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              Sender ID
            </label>
          </div>
          {approved.length === 0 ? (
            <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
              {pending.length > 0 ? (
                <>
                  Your Sender ID <strong>{pending.map((p) => p.value).join(', ')}</strong> is awaiting approval —
                  this usually takes {senderIdReviewSla}. You'll be notified as soon as it's ready. Meanwhile you can prepare
                  your contacts and top up your wallet.
                </>
              ) : (
                <>
                  You need an approved Sender ID before you can send.{' '}
                  <Link to="/messaging/sender-ids/request" className="font-semibold underline">
                    Request one now
                  </Link>
                  .
                </>
              )}
            </div>
          ) : (
            <>
              <select
                id="sender-id"
                value={senderId}
                onChange={(e) => onSenderIdChange(e.target.value)}
                className={cn(inputClass, 'py-2.5 font-semibold cursor-pointer')}
              >
                {approved.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.value}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                Recipients will see this name as the sender.{' '}
                {pending.length > 0 && `${pending.length} more awaiting approval.`}
              </p>
            </>
          )}
        </div>

        <hr className="border-slate-100 dark:border-slate-800" />

        {/* Recipients */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Users className="w-4 h-4 text-slate-700 dark:text-slate-300" strokeWidth={2} />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">Recipients</span>
          </div>
          <RecipientPicker value={recipients} onChange={onRecipientsChange} groups={groups} />
        </div>

        <hr className="border-slate-100 dark:border-slate-800" />

        {/* Message */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquare className="w-4 h-4 text-slate-700 dark:text-slate-300" strokeWidth={2} />
            <label htmlFor="message" className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              Message
            </label>
          </div>
          <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-800 focus-within:ring-1 focus-within:ring-[#1a6cf0] focus-within:border-[#1a6cf0] shadow-xs">
            <textarea
              id="message"
              className="w-full border-none p-0 text-sm text-slate-700 dark:text-slate-200 bg-transparent focus:ring-0 focus:outline-none resize-none leading-relaxed"
              placeholder="Type your message here…"
              rows={6}
              maxLength={MAX_MESSAGE_LENGTH}
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
            />
            <div className="flex justify-between items-center pt-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              <span>{segments.encoding === 'UCS-2' ? 'Unicode' : 'Standard'} characters</span>
              <span>
                {segments.unitCount}/{perSegment * segments.segmentCount} · {segments.segmentCount} page
                {segments.segmentCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {segments.encoding === 'UCS-2' && message.length > 0 && (
            <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-px" strokeWidth={2} />
              <span>
                Characters like {segments.nonGsmChars.slice(0, 5).map((c) => `"${c}"`).join(' ')} switch the message to
                Unicode, which fits 70 characters per page instead of 160. Remove them to lower the cost.
              </span>
            </p>
          )}

          <div className="mt-3 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5" strokeWidth={2} />
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Each page costs 1 unit per recipient. Messages are sent immediately.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/70 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-3 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-px" strokeWidth={2} />
        <span>
          Duplicate numbers are removed automatically and you're only charged for messages the network accepts —
          units for failed messages are returned to your wallet.
        </span>
      </div>
    </section>
  );
}
