import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Info, BadgeCheck, Key, Plus } from 'lucide-react';
import { useApi } from '../../lib/useApi';
import { splitDateTime } from '../../lib/datetime';
import { cn } from '../../lib/utils';
import type {
  ProjectResponse,
  ProjectSenderIdListResponse,
  ApiKeyListResponse,
  SenderIdAssignmentStatus,
} from '@profjero/shared';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  suspended: 'bg-rose-100 text-rose-700 border-rose-200',
  archived: 'bg-slate-100 text-slate-600 border-slate-200',
};

const ASSIGNMENT_STATUS_STYLES: Record<SenderIdAssignmentStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  revoked: 'bg-slate-100 text-slate-600 border-slate-200',
};

const PENDING_PANELS = [
  'Wallet balance and transaction history — needs wallet endpoints',
  'SMS activity table — needs SMS log endpoints',
  'Usage charts and cost estimates — needs SMS aggregates',
  'Project events log — needs audit log endpoints',
  'Daily and monthly limits — needs limits configuration',
];

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // All hooks declared up-front — before any early return.
  const { data, loading, error, reload } = useApi<ProjectResponse>(
    id ? `/admin/projects/${id}` : null,
  );
  const senderIdsApi = useApi<ProjectSenderIdListResponse>(
    id ? `/admin/projects/${id}/sender-ids` : null,
  );
  const apiKeysApi = useApi<ApiKeyListResponse>(
    id ? `/admin/projects/${id}/api-keys` : null,
  );

  if (!id) {
    return (
      <main className="p-4 sm:p-6 lg:p-7 flex-1">
        <div className="text-sm text-slate-500">No project ID in the URL.</div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="p-4 sm:p-6 lg:p-7 flex-1 space-y-6">
        <div className="h-32 bg-white rounded-xl border border-slate-200/80 animate-pulse" />
        <div className="h-48 bg-white rounded-xl border border-slate-200/80 animate-pulse" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-4 sm:p-6 lg:p-7 flex-1 space-y-4">
        <BackLink onClick={() => navigate('/projects')} />
        <div className="flex items-start gap-2.5 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="flex-1">
            <div className="font-medium">Could not load project.</div>
            <div className="mt-0.5 text-xs opacity-80">{error.message}</div>
            <button
              onClick={reload}
              className="mt-3 text-[11px] font-semibold underline"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  const project = data?.project;
  if (!project) return null;

  const senderIds = senderIdsApi.data?.senderIds ?? [];
  const apiKeys = apiKeysApi.data?.apiKeys ?? [];
  const secretKeyCount = apiKeys.filter((k) => k.kind === 'secret').length;
  const publishableKeyCount = apiKeys.filter(
    (k) => k.kind === 'publishable',
  ).length;

  const { date: createdDate } = splitDateTime(project.createdAt);
  const { date: updatedDate, time: updatedTime } = splitDateTime(
    project.updatedAt,
  );

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      <BackLink onClick={() => navigate('/projects')} />

      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
            {project.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {project.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {project.description ?? 'No description provided.'}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border self-start shrink-0 ${
                  STATUS_STYLES[project.status] ?? ''
                }`}
              >
                {project.status.charAt(0).toUpperCase() +
                  project.status.slice(1)}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-xs">
              <Field label="Contact Email" value={project.contactEmail} />
              <Field label="Contact Phone" value={project.contactPhone} />
              <Field label="Created" value={createdDate} />
              <Field
                label="Last Updated"
                value={`${updatedDate} ${updatedTime}`.trim()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sender IDs card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BadgeCheck className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Sender IDs</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Identities this project can use when sending SMS.
              </p>
            </div>
          </div>
          <Link
            to="/sender-ids"
            className="text-[11px] font-semibold text-[#1976d2] hover:text-blue-700 shrink-0 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />
            Manage
          </Link>
        </div>

        {senderIdsApi.loading && !senderIdsApi.data ? (
          <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
        ) : senderIds.length === 0 ? (
          <div className="text-center py-6 text-[11px] text-slate-400">
            No Sender IDs registered for this project yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {senderIds.map((s) => (
              <div
                key={s.senderId}
                className="flex items-center justify-between gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50/50"
              >
                <div className="font-mono text-xs font-semibold text-slate-800 truncate">
                  {s.senderId}
                </div>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0',
                    ASSIGNMENT_STATUS_STYLES[s.status],
                  )}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Keys card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">API Keys</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Credentials this project uses to call the ProfJero API.
              </p>
            </div>
          </div>
          <Link
            to={`/projects/${project.id}/api-keys`}
            className="text-[11px] font-semibold text-[#1976d2] hover:text-blue-700 shrink-0 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />
            Manage
          </Link>
        </div>

        {apiKeysApi.loading && !apiKeysApi.data ? (
          <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-6 text-[11px] text-slate-400">
            No API keys yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="text-[10px] text-slate-500 font-medium">
                Secret keys
              </div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {secretKeyCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Server-side only
              </div>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="text-[10px] text-slate-500 font-medium">
                Publishable keys
              </div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {publishableKeyCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Browser-safe, restricted
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pending panels notice */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-slate-800">
              Detailed metrics coming soon
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This page previously showed usage charts, wallet balance, SMS
              activity, limits, and API key data — all fabricated for the
              frontend build. Those panels will return here as their backend
              endpoints are implemented.
            </p>

            <ul className="mt-4 space-y-1.5">
              {PENDING_PANELS.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2 text-xs text-slate-600"
                >
                  <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-[11px] text-slate-400 font-mono">
              Project ID: {project.id}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#1976d2] transition"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Back to Projects
    </button>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-slate-500">{label}</div>
      <div className="font-medium text-slate-800 mt-0.5 break-words">
        {value && value.length > 0 ? value : '—'}
      </div>
    </div>
  );
}