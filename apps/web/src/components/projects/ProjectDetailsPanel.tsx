import { X, Edit3, Copy, Edit, PauseCircle, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { projectDetailsPanel as d } from '../../mock/projects';

export function ProjectDetailsPanel() {
  return (
    <Card className="p-4 sm:p-5 space-y-5" data-purpose="project-details-panel">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-sm text-slate-800">Project Details</h3>
        <button className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Profile summary */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            {d.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-base">{d.name}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {d.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{d.client}</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 font-medium px-3 py-1.5 rounded-lg transition shrink-0">
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 text-xs font-medium text-slate-500 overflow-x-auto">
        <button className="text-blue-600 border-b-2 border-blue-600 pb-2 font-semibold whitespace-nowrap">
          Overview
        </button>
        {['SMS Usage', 'Sender ID', 'API Keys', 'Limits', 'Activity'].map((tab) => (
          <button key={tab} className="hover:text-slate-800 pb-2 whitespace-nowrap">
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div className="min-w-0">
            <label className="text-[11px] text-slate-400 font-medium">Sender ID</label>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-semibold text-slate-800 truncate">{d.senderId}</span>
              <button className="text-slate-400 hover:text-slate-600 shrink-0">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="min-w-0">
            <label className="text-[11px] text-slate-400 font-medium">API Status</label>
            <div className="flex items-center gap-1.5 mt-1 font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{d.apiStatus}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="text-[11px] text-slate-400 font-medium">API Key</label>
          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-700 min-w-0">
              <span className="truncate">{d.apiKeyMasked}</span>
              <button className="text-slate-400 hover:text-slate-600 shrink-0">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium border border-slate-200 rounded px-2.5 py-1 whitespace-nowrap shrink-0">
              Manage Keys
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-[11px] text-slate-400 font-medium">Units Available</label>
            <div className="text-base font-bold text-slate-900 mt-0.5">{d.unitsAvailable}</div>
            <button className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded-md px-2.5 py-1">
              Buy Units
            </button>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 font-medium">Units Consumed</label>
            <div className="text-base font-bold text-slate-900 mt-0.5">{d.unitsConsumed}</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{ width: `${d.unitsConsumedPct}%` }}
              />
            </div>
            <div className="text-[10px] text-right text-slate-400 mt-1">
              {d.unitsConsumedPct}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <label className="text-[11px] text-slate-400 font-medium">SMS Sent</label>
            <div className="text-base font-bold text-slate-900 mt-0.5">{d.smsSent}</div>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 font-medium">Failed SMS</label>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-slate-900">{d.failedSms}</span>
              <span className="text-xs text-red-500 font-medium">{d.failedPct}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <label className="text-[11px] text-slate-400 font-medium">Monthly Limit</label>
            <div className="text-base font-bold text-slate-900 mt-0.5">{d.monthlyLimit}</div>
            <button className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded-md px-2.5 py-1">
              Set Limit
            </button>
          </div>
          <div>
            <label className="text-[11px] text-slate-400 font-medium">Monthly Usage</label>
            <div className="text-base font-bold text-slate-900 mt-0.5">{d.monthlyUsage}</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${d.monthlyUsagePct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 mt-2">
          <h5 className="text-xs font-bold text-slate-900 mb-2">Project Information</h5>
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-3 text-xs">
            <div className="min-w-0">
              <span className="text-slate-400 block text-[11px]">Project Name</span>
              <span className="font-medium text-slate-800 truncate block">{d.projectName}</span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 block text-[11px]">Client</span>
              <span className="font-medium text-slate-800 truncate block">{d.clientLabel}</span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 block text-[11px]">Created At</span>
              <span className="font-medium text-slate-800 text-[11px] block">{d.createdAt}</span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 block text-[11px]">Last Activity</span>
              <span className="font-medium text-slate-800 text-[11px] block">{d.lastActivity}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 space-y-2">
        <button className="w-full py-2.5 bg-[#1976d2] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition">
          <Edit className="w-4 h-4" />
          <span>Edit Project</span>
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className="py-2 px-3 border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition">
            <PauseCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Suspend</span>
          </button>
          <button className="py-2 px-3 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition">
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </Card>
  );
}