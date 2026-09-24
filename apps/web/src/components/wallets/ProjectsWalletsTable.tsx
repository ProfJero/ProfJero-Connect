import { MoreVertical, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { TableScroll } from '../ui/TableScroll';
import { cn } from '../../lib/utils';
import { splitDateTime } from '../../lib/datetime';
import type { WalletListEntry } from '@profjero/shared';

const DEFAULT_LOW_BALANCE_THRESHOLD = 500;
const CRITICAL_THRESHOLD = 100;

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

function formatNumber(n: number): string {
  return n.toLocaleString();
}

interface Props {
  entries: WalletListEntry[];
}

export function ProjectsWalletsTable({ entries }: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const needle = search.trim().toLowerCase();
  const filtered = needle
    ? entries.filter((e) => e.project.name.toLowerCase().includes(needle))
    : entries;

  return (
    <Card className="flex flex-col" data-purpose="projects-wallets-card">
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h3 className="font-bold text-slate-800 text-sm">Projects Wallets</h3>

        <div className="relative min-w-[200px]">
          <Search
            className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
            strokeWidth={2}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search projects..."
            type="text"
          />
        </div>
      </div>

      <TableScroll>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100 uppercase tracking-wider bg-slate-50/40">
              <th className="py-2.5 px-4 font-semibold">#</th>
              <th className="py-2.5 px-3 font-semibold">Project</th>
              <th className="py-2.5 px-3 font-semibold text-right">Available</th>
              <th className="py-2.5 px-3 font-semibold text-right">Reserved</th>
              <th className="py-2.5 px-3 font-semibold text-right">Total</th>
              <th className="py-2.5 px-3 font-semibold text-right">Purchased</th>
              <th className="py-2.5 px-3 font-semibold text-right">Used</th>
              <th className="py-2.5 px-3 font-semibold text-right">Refunded</th>
              <th className="py-2.5 px-3 font-semibold">Last Activity</th>
              <th className="py-2.5 px-3 font-semibold text-center">Low Balance</th>
              <th className="py-2.5 px-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400 text-sm">
                  {entries.length === 0
                    ? 'No wallets yet.'
                    : 'No projects match your search.'}
                </td>
              </tr>
            )}
            {filtered.map((entry, idx) => {
              const { availableUnits, reservedUnits, updatedAt } = entry.wallet;
              const total = availableUnits + reservedUnits;
              const threshold =
                entry.wallet.lowBalanceThreshold ?? DEFAULT_LOW_BALANCE_THRESHOLD;
              const low = availableUnits > 0 && availableUnits < threshold;
              const critical = availableUnits < CRITICAL_THRESHOLD;
              const { date, time } = splitDateTime(updatedAt);
              return (
                <tr
                  key={entry.project.id}
                  onClick={() => navigate(`/projects/${entry.project.id}`)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 text-slate-400 font-medium">{idx + 1}.</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0',
                          avatarColor(entry.project.id),
                        )}
                      >
                        {entry.project.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-800 whitespace-nowrap">
                        {entry.project.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-800">
                    {formatNumber(availableUnits)}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-800">
                    {reservedUnits > 0 ? formatNumber(reservedUnits) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {formatNumber(total)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Pending />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Pending />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Pending />
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-500 leading-tight">
                    <div>{date}</div>
                    <div className="text-slate-400 text-[10px]">{time}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {critical ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200/60">
                        Critical
                      </span>
                    ) : low ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200/60">
                        Low
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                        OK
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      className="text-slate-400 hover:text-slate-600 p-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>
    </Card>
  );
}