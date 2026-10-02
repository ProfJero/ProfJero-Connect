import { useState } from 'react';
import { Pencil, Power, Plus } from 'lucide-react';
import { Card } from '../ui/Card';
import { TableScroll } from '../ui/TableScroll';
import { cn } from '../../lib/utils';
import { apiFetch, ApiError } from '../../lib/api';
import type { Package } from '@profjero/shared';

interface Props {
  packages: Package[];
  loading: boolean;
  service: string;
  onAdd: () => void;
  onEdit: (pkg: Package) => void;
  onChanged: () => void;
}

export function PackagesTable({
  packages,
  loading,
  service,
  onAdd,
  onEdit,
  onChanged,
}: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleActive = async (pkg: Package) => {
    setBusyId(pkg.id);
    setError(null);
    try {
      await apiFetch(`/admin/pricing/packages/${pkg.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !pkg.active }),
      });
      onChanged();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Update failed.',
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Packages
            <span className="ml-2 text-slate-500 font-normal text-xs">
              {packages.length}
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Fixed bundles offered to {service.toUpperCase()} clients.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1976d2] hover:bg-blue-600 text-white text-xs font-semibold transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          Add Package
        </button>
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
                <th className="py-3 px-4 w-10 text-right">#</th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3 text-right">Units</th>
                <th className="py-3 px-3 text-right">Price</th>
                <th className="py-3 px-3 text-right">Effective Rate</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {packages.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                    No packages yet.
                  </td>
                </tr>
              )}
              {packages.map((p, idx) => (
                <tr
                  key={p.id}
                  className={cn(
                    'transition-colors',
                    p.active ? 'hover:bg-slate-50/70' : 'opacity-60',
                  )}
                >
                  <td className="py-3 px-4 text-right text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {p.name}
                  </td>
                  <td className="py-3 px-3 text-right font-medium">
                    {p.units.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-800">
                    GHS {p.priceGhs.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-600">
                    {p.effectiveRate.toFixed(4)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-medium border',
                        p.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200',
                      )}
                    >
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        className="p-1.5 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
                        aria-label="Edit package"
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(p)}
                        disabled={busyId === p.id}
                        className={cn(
                          'p-1.5 rounded transition disabled:opacity-50',
                          p.active
                            ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                            : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50',
                        )}
                        aria-label={p.active ? 'Deactivate' : 'Activate'}
                        title={p.active ? 'Deactivate' : 'Activate'}
                      >
                        <Power className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}
    </Card>
  );
}