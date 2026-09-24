import { useState, type MouseEvent } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { TableScroll } from '../ui/TableScroll';
import {
  ProjectsFilterBar,
  type ProjectsFilterBarProps,
} from './ProjectsFilterBar';
import { RowActionsMenu, type RowAction } from './RowActionsMenu';
import { cn } from '../../lib/utils';
import { splitDateTime } from '../../lib/datetime';
import type { Project } from '@profjero/shared';

const STATUS_STYLES: Record<Project['status'], string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  suspended: 'bg-rose-100 text-rose-700 border-rose-200',
  archived: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_LABELS: Record<Project['status'], string> = {
  active: 'Active',
  suspended: 'Suspended',
  archived: 'Archived',
};

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-sky-600',
  'bg-amber-500',
  'bg-emerald-600',
  'bg-purple-600',
  'bg-indigo-600',
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Pending() {
  return (
    <span
      className="text-slate-300"
      title="Pending — backend endpoint not yet implemented"
    >
      —
    </span>
  );
}

interface OpenMenu {
  projectId: string;
  top: number;
  right: number;
}

interface Props {
  /** The current page's slice of projects (already filtered and sorted). */
  projects: Project[];
  /** Total after filters, across all pages. */
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** True when search or status filter is active. Affects empty-state copy. */
  hasFilters: boolean;
  filterBarProps: ProjectsFilterBarProps;
  onRowAction: (project: Project, action: RowAction) => void;
}

export function ProjectsTable({
  projects,
  total,
  page,
  pageSize,
  totalPages,
  onPageChange,
  hasFilters,
  filterBarProps,
  onRowAction,
}: Props) {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null);

  const handleMenuClick = (
    e: MouseEvent<HTMLButtonElement>,
    project: Project,
  ) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setOpenMenu({
      projectId: project.id,
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  };

  const menuProject = openMenu
    ? projects.find((p) => p.id === openMenu.projectId) ?? null
    : null;

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = (page - 1) * pageSize + projects.length;

  return (
    <>
      <Card className="overflow-hidden" data-purpose="projects-table-section">
        <ProjectsFilterBar {...filterBarProps} />

        <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-800">Projects / Clients</h3>
        </div>

        <TableScroll>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200/70 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4 w-8">#</th>
                <th className="py-3 px-4 whitespace-nowrap">Project Name</th>
                <th className="py-3 px-4 whitespace-nowrap">Client / Organization</th>
                <th className="py-3 px-4 whitespace-nowrap">Sender ID</th>
                <th className="py-3 px-4 whitespace-nowrap">API Status</th>
                <th className="py-3 px-4 whitespace-nowrap">Units</th>
                <th className="py-3 px-4 whitespace-nowrap">SMS Sent</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 whitespace-nowrap">Last Activity</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
              {projects.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                    {hasFilters ? (
                      <div>
                        <div>No projects match your filters.</div>
                        <button
                          onClick={filterBarProps.onClear}
                          className="mt-2 text-[11px] text-[#1976d2] underline hover:text-blue-700"
                        >
                          Clear filters
                        </button>
                      </div>
                    ) : (
                      'No projects yet.'
                    )}
                  </td>
                </tr>
              )}
              {projects.map((p, idx) => {
                const { date, time } = splitDateTime(p.updatedAt);
                const isMenuOpen = openMenu?.projectId === p.id;
                const rowNumber = (page - 1) * pageSize + idx + 1;
                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className={cn(
                      'transition-colors cursor-pointer',
                      isMenuOpen ? 'bg-slate-50' : 'hover:bg-slate-50/70',
                    )}
                  >
                    <td className="py-3 px-4 font-medium text-slate-500">
                      {rowNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5 whitespace-nowrap">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center',
                            avatarColor(p.id),
                          )}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {p.description ?? p.contactEmail ?? <Pending />}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Pending />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Pending />
                    </td>
                    <td className="py-3 px-4 font-medium">
                      <Pending />
                    </td>
                    <td className="py-3 px-4">
                      <Pending />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[11px] font-medium border',
                          STATUS_STYLES[p.status],
                        )}
                      >
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      <div>{date}</div>
                      <div className="text-[10px]">{time}</div>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      <button
                        onClick={(e) => handleMenuClick(e, p)}
                        className="hover:text-slate-700 p-1"
                        aria-label="Row actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>

        <div className="p-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 bg-white">
          <span>
            {total === 0
              ? hasFilters
                ? 'No matching projects'
                : 'No projects'
              : `Showing ${rangeStart}–${rangeEnd} of ${total} project${total === 1 ? '' : 's'}`}
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <span className="text-[11px] text-slate-500 font-medium px-1">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </Card>

      {menuProject && openMenu && (
        <RowActionsMenu
          project={menuProject}
          position={{ top: openMenu.top, right: openMenu.right }}
          onClose={() => setOpenMenu(null)}
          onAction={onRowAction}
        />
      )}
    </>
  );
}