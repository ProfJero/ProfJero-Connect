import { useState } from 'react';
import { X, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { splitDateTime } from '../../lib/datetime';
import type {
  SmsBatchDetailResponse,
  SmsRecord,
  SmsBatchStatus,
  SmsRecordStatus,
} from '@profjero/shared';

const BATCH_STATUS_STYLES: Record<SmsBatchStatus, string> = {
  queued: 'bg-slate-100 text-slate-700 border-slate-200',
  submitting: 'bg-blue-50 text-blue-700 border-blue-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
};

const RECORD_STATUS_STYLES: Record<SmsRecordStatus, string> = {
  queued: 'bg-slate-100 text-slate-700 border-slate-200',
  submitting: 'bg-blue-50 text-blue-700 border-blue-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  unknown: 'bg-amber-50 text-amber-700 border-amber-200',
  released: 'bg-purple-50 text-purple-700 border-purple-200',
};

interface Props {
  detail: SmsBatchDetailResponse | null;
  loading: boolean;
  error: Error | null;
  onClose: () => void;
}

export function SmsDetailsInspector({ detail, loading, error, onClose }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Whole panel hides when nothing is selected.
  if (!detail && !loading && !error) return null;

  return (
    <aside
      className="w-full xl:w-[440px] bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col shrink-0 max-h-[calc(100vh-160px)] xl:sticky xl:top-4"
      data-purpose="details-drawer"
    >
      <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-bold text-slate-900">Batch Details</h3>
        <button
          aria-label="Close inspector"
          className="text-slate-400 hover:text-slate-600"
          type="button"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && !detail && (
          <div className="p-4 space-y-3">
            <div className="h-6 bg-slate-100 rounded animate-pulse" />
            <div className="h-24 bg-slate-100 rounded animate-pulse" />
            <div className="h-32 bg-slate-100 rounded animate-pulse" />
          </div>
        )}

        {error && (
          <div className="p-4 text-xs text-rose-600">
            Failed to load batch: {error.message}
          </div>
        )}

        {detail && (
          <BatchDetailContent
            detail={detail}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
          />
        )}
      </div>
    </aside>
  );
}

function BatchDetailContent({
  detail,
  expandedId,
  setExpandedId,
}: {
  detail: SmsBatchDetailResponse;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
}) {
  const { batch, projectName, records } = detail;
  const { date, time } = splitDateTime(batch.createdAt);
  const completed = batch.completedAt ? splitDateTime(batch.completedAt) : null;

  return (
    <div className="p-4 space-y-4 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'px-2 py-0.5 rounded-full text-[11px] font-medium border',
            BATCH_STATUS_STYLES[batch.status],
          )}
        >
          {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
        </span>
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 font-medium min-w-0">
          <span className="truncate" title={batch.id}>
            {batch.id}
          </span>
          <CopyButton text={batch.id} label="Copy batch ID" />
        </div>
      </div>

      <div>
        <span className="text-[11px] font-medium text-slate-500 block mb-1">
          Message
        </span>
        <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 text-slate-700 leading-relaxed text-xs break-words">
          {batch.message}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <StatCell label="Recipients" value={String(batch.totalRecipients)} />
        <StatCell
          label="Units Charged"
          value={String(batch.totalUnitsCharged)}
          highlight
        />
        <StatCell
          label="Submitted"
          value={String(batch.submittedCount)}
          tone="emerald"
        />
        <StatCell label="Failed" value={String(batch.failedCount)} tone="rose" />
        {batch.unknownCount > 0 && (
          <StatCell
            label="Unknown"
            value={String(batch.unknownCount)}
            tone="amber"
          />
        )}
        {batch.totalUnitsReleased > 0 && (
          <StatCell
            label="Units Released"
            value={String(batch.totalUnitsReleased)}
            tone="amber"
          />
        )}
        {batch.deliveredCount > 0 && (
          <StatCell
            label="Delivered"
            value={String(batch.deliveredCount)}
            tone="emerald"
          />
        )}
      </div>

      <div className="divide-y divide-slate-100 space-y-2 pt-1 text-[11px]">
        <MetaRow label="Project">
          <span className="font-medium text-slate-800">{projectName}</span>
        </MetaRow>
        <MetaRow label="Sender ID">
          <span className="font-medium text-slate-800">
            {batch.senderId ?? '—'}
          </span>
        </MetaRow>
        <MetaRow label="Created">
          <span className="text-slate-700">
            {date} {time}
          </span>
        </MetaRow>
        {completed && (
          <MetaRow label="Completed">
            <span className="text-slate-700">
              {completed.date} {completed.time}
            </span>
          </MetaRow>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-slate-500">
            Recipients ({records.length})
          </span>
        </div>

        <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
          {records.map((r) => (
            <RecordRow
              key={r.id}
              record={r}
              expanded={expandedId === r.id}
              onToggle={() =>
                setExpandedId(expandedId === r.id ? null : r.id)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RecordRow({
  record,
  expanded,
  onToggle,
}: {
  record: SmsRecord;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Chevron = expanded ? ChevronUp : ChevronDown;
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 p-2.5 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Chevron className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="font-mono text-[11px] text-slate-700 truncate">
            {record.recipient}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-slate-500">
            {record.unitsCharged > 0
              ? `${record.unitsCharged}u charged`
              : record.unitsReleased > 0
                ? `${record.unitsReleased}u released`
                : `${record.unitsReserved}u reserved`}
          </span>
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-semibold border',
              RECORD_STATUS_STYLES[record.status],
            )}
          >
            {record.status}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-0 bg-slate-50/50 space-y-2 text-[11px]">
          <div className="grid grid-cols-3 gap-2 pt-2">
            <DetailCell label="Reserved" value={String(record.unitsReserved)} />
            <DetailCell label="Charged" value={String(record.unitsCharged)} />
            <DetailCell label="Released" value={String(record.unitsReleased)} />
          </div>

          {record.providerMessageId && (
            <div>
              <span className="text-slate-500 block mb-0.5">
                Provider Message ID
              </span>
              <div className="flex items-center gap-1 font-mono text-[10px] text-slate-700">
                <span className="truncate">{record.providerMessageId}</span>
                <CopyButton text={record.providerMessageId} label="Copy ID" />
              </div>
            </div>
          )}

          {record.providerError && (
            <div>
              <span className="text-slate-500 block mb-0.5">Error</span>
              <div className="text-rose-600 bg-rose-50 border border-rose-200 rounded px-2 py-1">
                {record.providerError}
              </div>
            </div>
          )}

          <div className="font-mono text-[10px] text-slate-400">
            Record ID: {record.id}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
  tone,
  highlight,
}: {
  label: string;
  value: string;
  tone?: 'emerald' | 'rose' | 'amber';
  highlight?: boolean;
}) {
  const toneClass =
    tone === 'emerald'
      ? 'text-emerald-600'
      : tone === 'rose'
        ? 'text-rose-600'
        : tone === 'amber'
          ? 'text-amber-600'
          : highlight
            ? 'text-slate-900'
            : 'text-slate-700';
  return (
    <div className="bg-slate-50 rounded-lg px-2.5 py-2">
      <div className="text-slate-500 text-[10px]">{label}</div>
      <div className={cn('font-bold text-sm mt-0.5', toneClass)}>{value}</div>
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-slate-400 text-[10px]">{label}</div>
      <div className="font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <span className="text-slate-400 font-normal shrink-0">{label}</span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard API can fail in non-secure contexts; silently ignore.
    }
  };
  return (
    <button
      aria-label={label}
      className="text-slate-400 hover:text-slate-600 shrink-0"
      type="button"
      onClick={handle}
    >
      {copied ? (
        <span className="text-[10px] text-emerald-600 font-medium">Copied</span>
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}