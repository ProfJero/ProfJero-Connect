import { useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { RejectReasonModal } from './RejectReasonModal';
import { apiFetch, ApiError } from '../../lib/api';
import { splitDateTime } from '../../lib/datetime';
import type {
  PendingQueue,
} from '@profjero/shared';

interface Props {
  queue: PendingQueue;
  onChanged: () => void;
}

type RejectTarget =
  | { kind: 'value'; value: string }
  | { kind: 'assignment'; value: string; projectId: string }
  | null;

export function PendingQueueSection({ queue, onChanged }: Props) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RejectTarget>(null);

  const runAction = async (
    key: string,
    fn: () => Promise<unknown>,
  ): Promise<void> => {
    setBusyKey(key);
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed.');
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <section className="space-y-4">
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {queue.pendingValues.length > 0 && (
          <QueueCard
            title={`Pending Value Requests (${queue.pendingValues.length})`}
            subtitle="New Sender IDs waiting for you to register with Arkesel and approve."
          >
            {queue.pendingValues.map((v) => (
              <QueueRow
                key={v.value}
                primary={v.value}
                secondary={`Requested by ${v.requestedByProjectName}`}
                when={v.requestedAt}
                busy={busyKey === `value:${v.value}`}
                onApprove={() =>
                  runAction(`value:${v.value}`, () =>
                    apiFetch(`/admin/sender-ids/${encodeURIComponent(v.value)}/approve`, {
                      method: 'POST',
                      body: '{}',
                    }),
                  )
                }
                onReject={() => setRejectTarget({ kind: 'value', value: v.value })}
              />
            ))}
          </QueueCard>
        )}

        {queue.pendingAssignments.length > 0 && (
          <QueueCard
            title={`Pending Assignment Requests (${queue.pendingAssignments.length})`}
            subtitle="Values already registered with Arkesel, waiting for you to grant access to another project."
          >
            {queue.pendingAssignments.map((a) => (
              <QueueRow
                key={`${a.projectId}__${a.senderId}`}
                primary={a.senderId}
                secondary={`Grant access to ${a.projectName}`}
                when={a.requestedAt}
                busy={busyKey === `assignment:${a.projectId}:${a.senderId}`}
                onApprove={() =>
                  runAction(`assignment:${a.projectId}:${a.senderId}`, () =>
                    apiFetch(
                      `/admin/sender-ids/${encodeURIComponent(a.senderId)}/assignments/${a.projectId}/approve`,
                      { method: 'POST', body: '{}' },
                    ),
                  )
                }
                onReject={() =>
                  setRejectTarget({
                    kind: 'assignment',
                    value: a.senderId,
                    projectId: a.projectId,
                  })
                }
              />
            ))}
          </QueueCard>
        )}
      </div>

      <RejectReasonModal
        open={rejectTarget !== null}
        title={
          rejectTarget?.kind === 'value'
            ? `Reject "${rejectTarget.value}"`
            : rejectTarget
              ? `Reject access to "${rejectTarget.value}"`
              : 'Reject'
        }
        label="Reason"
        onConfirm={async (reason) => {
          if (!rejectTarget) return;
          if (rejectTarget.kind === 'value') {
            await apiFetch(
              `/admin/sender-ids/${encodeURIComponent(rejectTarget.value)}/reject`,
              {
                method: 'POST',
                body: JSON.stringify({ reason }),
              },
            );
          } else {
            await apiFetch(
              `/admin/sender-ids/${encodeURIComponent(rejectTarget.value)}/assignments/${rejectTarget.projectId}/reject`,
              {
                method: 'POST',
                body: JSON.stringify({ notes: reason }),
              },
            );
          }
          setRejectTarget(null);
          onChanged();
        }}
        onClose={() => setRejectTarget(null)}
      />
    </section>
  );
}

function QueueCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-amber-50/40 border border-amber-200/70 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-amber-200/70">
        <h3 className="text-xs font-bold text-slate-800">{title}</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="bg-white divide-y divide-slate-100">{children}</div>
    </div>
  );
}

function QueueRow({
  primary,
  secondary,
  when,
  busy,
  onApprove,
  onReject,
}: {
  primary: string;
  secondary: string;
  when: string;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { date, time } = splitDateTime(when);
  return (
    <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-mono text-xs font-semibold text-slate-900 truncate">
          {primary}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
          {secondary}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          {date} {time}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold disabled:opacity-50 transition"
        >
          <Check className="w-3 h-3" strokeWidth={2.5} />
          Approve
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={busy}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-[11px] font-semibold disabled:opacity-50 transition"
        >
          <X className="w-3 h-3" strokeWidth={2.5} />
          Reject
        </button>
      </div>
    </div>
  );
}