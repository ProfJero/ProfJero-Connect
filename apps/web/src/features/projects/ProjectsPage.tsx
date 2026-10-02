import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Plus, AlertCircle, X } from 'lucide-react';
import { MetricCard, type Metric } from '../../components/projects/MetricCard';
import { ProjectsTable } from '../../components/projects/ProjectsTable';
import { ProjectFormModal } from '../../components/projects/ProjectFormModal';
import { RecentProjectActivity } from '../../components/projects/RecentProjectActivity';
import { ProjectStatusOverview } from '../../components/projects/ProjectStatusOverview';
import {
  type SortOption,
  type ProjectsFilterBarProps,
} from '../../components/projects/ProjectsFilterBar';
import type { RowAction } from '../../components/projects/RowActionsMenu';
import { useApi } from '../../lib/useApi';
import { useNewParam } from '../../lib/useNewParam';
import { apiFetch, ApiError } from '../../lib/api';
import type {
  Project,
  ProjectListResponse,
  ProjectStatus,
} from '@profjero/shared';

const PAGE_SIZE = 10;

type FormState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; project: Project };

export function ProjectsPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } =
    useApi<ProjectListResponse>('/admin/projects');

  const [formState, setFormState] = useState<FormState>({ mode: 'closed' });
  const [newRequested, dismissNew] = useNewParam();
  const [actionError, setActionError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [sort, setSort] = useState<SortOption>('name-asc');
  const [page, setPage] = useState(1);

  const projects = useMemo(() => data?.projects ?? [], [data?.projects]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        (p.description ?? '').toLowerCase().includes(needle) ||
        (p.contactEmail ?? '').toLowerCase().includes(needle)
      );
    });
  }, [projects, search, statusFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sort === 'name-asc') {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'updated-desc') {
      copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } else {
      copy.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    }
    return copy;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const hasFilters = search.length > 0 || statusFilter !== 'all';

  const metrics: Metric[] = [
    {
      label: 'Total Projects',
      value: String(projects.length),
      footnote: 'Across all statuses',
      iconBg: 'bg-blue-500',
      icon: 'briefcase',
    },
    {
      label: 'Active',
      value: String(projects.filter((p) => p.status === 'active').length),
      footnote: 'Running and sending SMS',
      iconBg: 'bg-emerald-500',
      icon: 'users-round',
    },
    {
      label: 'Suspended',
      value: String(projects.filter((p) => p.status === 'suspended').length),
      footnote: 'Temporarily halted',
      iconBg: 'bg-red-500',
      icon: 'alert-circle',
    },
    {
      label: 'Archived',
      value: String(projects.filter((p) => p.status === 'archived').length),
      footnote: 'No longer in use',
      iconBg: 'bg-slate-500',
      icon: 'layers',
    },
  ];

  const handleRowAction = async (project: Project, action: RowAction) => {
    setActionError(null);

    if (action === 'edit') {
      setFormState({ mode: 'edit', project });
      return;
    }

    if (action === 'archive') {
      const ok = window.confirm(
        `Archive "${project.name}"? It will be hidden from active lists. You can restore it later.`,
      );
      if (!ok) return;
    }

    const nextStatus: ProjectStatus =
      action === 'suspend'
        ? 'suspended'
        : action === 'activate'
          ? 'active'
          : 'archived';

    try {
      await apiFetch(`/admin/projects/${project.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      reload();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.requestId
            ? `${err.message} (${err.requestId})`
            : err.message
          : err instanceof Error
            ? err.message
            : 'Action failed.';
      setActionError(msg);
    }
  };

  const filterBarProps: ProjectsFilterBarProps = {
    search,
    onSearchChange: (v) => {
      setSearch(v);
      setPage(1);
    },
    status: statusFilter,
    onStatusChange: (v) => {
      setStatusFilter(v);
      setPage(1);
    },
    sort,
    onSortChange: (v) => {
      setSort(v);
      setPage(1);
    },
    onClear: () => {
      setSearch('');
      setStatusFilter('all');
      setSort('name-asc');
      setPage(1);
    },
  };

  return (
    <main className="p-4 sm:p-6 lg:p-7 space-y-6 flex-1">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Projects / Clients
            </h2>
            <p className="text-xs text-slate-500">
              Manage all your projects, clients and their SMS integration details.
            </p>
          </div>
        </div>
        <button
          onClick={() => setFormState({ mode: 'create' })}
          className="bg-[#1976d2] hover:bg-blue-600 text-white font-medium text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="flex-1">
            <div className="font-medium">Action failed.</div>
            <div className="mt-0.5 opacity-80">{actionError}</div>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="p-0.5 hover:bg-rose-100 rounded shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Fetch error banner */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="flex-1">
            <div className="font-medium">Could not load projects.</div>
            <div className="mt-0.5 opacity-80">{error.message}</div>
            {error instanceof Error && 'requestId' in error && (
              <div className="mt-1 text-[10px] font-mono opacity-60">
                requestId: {(error as { requestId: string | null }).requestId ?? '—'}
              </div>
            )}
          </div>
          <button
            onClick={reload}
            className="text-[11px] font-semibold underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !data
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-white rounded-xl border border-slate-200/90 shadow-xs animate-pulse"
              />
            ))
          : metrics.map((m) => <MetricCard key={m.label} metric={m} />)}
      </div>

      {/* Full-width table */}
      <ProjectsTable
        projects={paginated}
        total={sorted.length}
        page={safePage}
        pageSize={PAGE_SIZE}
        totalPages={totalPages}
        onPageChange={setPage}
        hasFilters={hasFilters}
        filterBarProps={filterBarProps}
        onRowAction={handleRowAction}
      />

      {/* Bottom panels — real data, derived from the full unfiltered list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentProjectActivity
          projects={projects}
          onProjectClick={(id) => navigate(`/projects/${id}`)}
        />
        <ProjectStatusOverview projects={projects} />
      </div>

      <ProjectFormModal
        open={formState.mode !== 'closed' || newRequested}
        project={formState.mode === 'edit' ? formState.project : null}
        onClose={() => {
          setFormState({ mode: 'closed' });
          dismissNew();
        }}
        onSaved={() => {
          setFormState({ mode: 'closed' });
          dismissNew();
          reload();
        }}
      />
    </main>
  );
}