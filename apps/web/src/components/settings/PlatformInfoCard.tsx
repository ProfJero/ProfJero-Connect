import { MessageSquare } from 'lucide-react';
import { Card } from '../ui/Card';
import { platformInfo } from '../../mock/settings';

export function PlatformInfoCard() {
  return (
    <Card
      className="p-6 lg:col-span-4 flex flex-col justify-between"
      data-purpose="platform-info-card"
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Platform Information</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your platform's basic information and branding.
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Platform Name <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full text-xs font-medium border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            type="text"
            defaultValue={platformInfo.name}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">Description</label>
          <textarea
            className="w-full text-xs font-medium border border-slate-200 rounded-lg p-3 text-slate-700 leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            defaultValue={platformInfo.description}
          />
        </div>

        <div className="space-y-2 pt-1">
          <label className="block text-xs font-semibold text-slate-700">Logo</label>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#1976d2] flex items-center justify-center text-white shrink-0 shadow-sm">
              <MessageSquare className="w-6 h-6 fill-current" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 leading-none">
                {platformInfo.name}
              </h4>
              <button
                className="text-xs text-blue-600 font-semibold hover:underline block leading-none"
                type="button"
              >
                Change Logo
              </button>
              <p className="text-[10px] text-slate-400">
                Recommended size: 200 × 60px (PNG, SVG)
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}