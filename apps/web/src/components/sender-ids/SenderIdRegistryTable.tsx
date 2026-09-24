import { useState } from 'react';
import { ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { TableScroll } from '../ui/TableScroll';
import { cn } from '../../lib/utils';
import { splitDateTime } from '../../lib/datetime';
import { RejectReasonModal } from './RejectReasonModal';
import { apiFetch, ApiError } from '../../lib/api';
import type {
  SenderIdValueStatus,
  SenderIdAssignmentStatus,
  SenderIdWithAssignments,
} from '@profjero/shared';

const VALUE_STATUS_STYLES: Record<SenderIdValueStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const ASSIGNMENT_STATUS_STYLES: Record<SenderIdAssignmentStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  revoked: 'bg-slate-100 text-slate-600 border-slate-200',
};

interface Props {
  senderIds: SenderIdWithAssignments[];
  total: number;
  loading: boolean;
  filter: SenderIdValueStatus | 'all';
  onFilterChange: (f: SenderIdValueStatus | 'all') => void;
  search: string;
  onSearchChange: (v: string) => void;
  onChanged: () => void;
}

type RejectTarget =
  | { kind: 'value'; value: string }
  | { kind: 'assignment'; value: string; projectId: string }
  | null;

export function SenderIdRegistryTable({
  senderIds,
  total,
  loading,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  onChanged,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RejectTarget>(null);

  const runAction = async (key: string, fn: () => Promise<unknown>) => {
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

  const toggleExpanded = (value: string) => {
    setExpanded((prev) => ({ ...prev, [value]: !prev[value] }));
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Registry
            <span className="ml-2 text-slate-400 font-normal text-xs">
              {senderIds.length} of {total}
            </span>
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search values or projects..."
              className="w-full sm:w-64 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={filter}
              onChange={(e) =>
                onFilterChange(e.target.value as SenderIdValueStatus | 'all')
              }
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="px-4 py-2 border-b border-rose-100 bg-rose-50 text-rose-700 text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-8 space-y-3">
            <div className="h-8 bg-slate-100 rounded animate-pulse" />
            <div className="h-8 bg-slate-100 rounded animate-pulse" />
            <div className="h-8 bg-slate-100 rounded animate-pulse" />
          </div>
        ) : (
          <TableScroll>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/70 text-slate-500 font-semibold">
                <tr>
                  <th className="w-8" />
                  <th className="py-3 px-3">Value</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Projects</th>
                  <th className="py-3 px-3">Requested</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {senderIds.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                      {total === 0
                        ? 'No Sender IDs registered yet.'
                        : 'No Sender IDs match your filters.'}
                    </td>
                  </tr>
                )}
                {senderIds.map((s) => {
                  const isExpanded = expanded[s.value] ?? false;
                  const { date } = splitDateTime(s.requestedAt);
                  return (
                    <RowGroup
                      key={s.value}
                      senderId={s}
                      expanded={isExpanded}
                      onToggle={() => toggleExpanded(s.value)}
                      busy={busyKey}
                      date={date}
                      onApproveValue={() =>
                        runAction(`v:${s.value}:approve`, () =>
                          apiFetch(
                            `/admin/sender-ids/${encodeURIComponent(s.value)}/approve`,
                            { method: 'POST', body: '{}' },
                          ),
                        )
                      }
                      onRejectValue={() =>
                        setRejectTarget({ kind: 'value', value: s.value })
                      }
                      onApproveAssignment={(projectId) =>
                        runAction(`a:${s.value}:${projectId}:approve`, () =>
                          apiFetch(
                            `/admin/sender-ids/${encodeURIComponent(s.value)}/assignments/${projectId}/approve`,
                            { method: 'POST', body: '{}' },
                          ),
                        )
                      }
                      onRejectAssignment={(projectId) =>
                        setRejectTarget({
                          kind: 'assignment',
                          value: s.value,
                          projectId,
                        })
                      }
                    />
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Card>

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
    </>
  );
}

function RowGroup({
  senderId,
  expanded,
  onToggle,
  busy,
  date,
  onApproveValue,
  onRejectValue,
  onApproveAssignment,
  onRejectAssignment,
}: {
  senderId: SenderIdWithAssignments;
  expanded: boolean;
  onToggle: () => void;
  busy: string | null;
  date: string;
  onApproveValue: () => void;
  onRejectValue: () => void;
  onApproveAssignment: (projectId: string) => void;
  onRejectAssignment: (projectId: string) => void;
}) {
  const Chevron = expanded ? ChevronDown : ChevronRight;
  const s = senderId;

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer hover:bg-slate-50/70 transition-colors"
      >
        <td className="py-3 pl-3 text-slate-400">
          <Chevron className="w-3.5 h-3.5" strokeWidth={2} />
        </td>
        <td className="py-3 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
          {s.value}
        </td>
        <td className="py-3 px-3 whitespace-nowrap">
          <span
            className={cn(
              'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border',
              VALUE_STATUS_STYLES[s.status],
            )}
          >
            {s.status}
          </span>
        </td>
        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
          {s.assignments.length}{' '}
          {s.assignments.length === 1 ? 'project' : 'projects'}
        </td>
        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{date}</td>
        <td className="py-3 px-3 text-right whitespace-nowrap">
          {s.status === 'pending' && (
            <div
              className="inline-flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onApproveValue}
                disabled={busy === `v:${s.value}:approve`}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold disabled:opacity-50 transition"
              >
                <Check className="w-2.5 h-2.5" strokeWidth={3} />
                Approve
              </button>
              <button
                type="button"
                onClick={onRejectValue}
                disabled={busy === `v:${s.value}:approve`}
                className="flex items-center gap-1 px-2.5 py-1 rounded border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-[10px] font-semibold disabled:opacity-50 transition"
              >
                <X className="w-2.5 h-2.5" strokeWidth={3} />
                Reject
              </button>
            </div>
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="bg-slate-50/50">
          <td colSpan={6} className="px-6 py-3">
            <div className="text-[11px] font-semibold text-slate-500 mb-2">
              Project assignments
            </div>
            {s.assignments.length === 0 ? (
              <div className="text-[11px] text-slate-400">
                No projects assigned.
              </div>
            ) : (
              <div className="space-y-1.5">
                {s.assignments.map((a) => (
                  <div
                    key={`${a.projectId}-${a.senderId}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-800 truncate">
                        {a.projectName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate font-mono">
                        {a.projectId}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0',
                        ASSIGNMENT_STATUS_STYLES[a.status],
                      )}
                    >
                      {a.status}
                    </span>
                    {a.status === 'pending' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onApproveAssignment(a.projectId)}
                          disabled={busy === `a:${s.value}:${a.projectId}:approve`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold disabled:opacity-50 transition"
                        >
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => onRejectAssignment(a.projectId)}
                          disabled={busy === `a:${s.value}:${a.projectId}:approve`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-[10px] font-semibold disabled:opacity-50 transition"
                        >
                          <X className="w-2.5 h-2.5" strokeWidth={3} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}