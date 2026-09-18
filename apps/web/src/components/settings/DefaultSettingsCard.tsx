import { ChevronDown } from 'lucide-react';
import { Card } from '../ui/Card';
import { contactInfo, defaultSettings } from '../../mock/settings';

export function DefaultSettingsCard() {
  return (
    <Card
      className="p-6 lg:col-span-5 space-y-5"
      data-purpose="default-and-contact-settings"
    >
      <div>
        <h3 className="text-sm font-bold text-slate-900">Default Settings</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Set your preferred timezone, currency and other defaults.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-3.5">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Default Timezone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                className="w-full text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 bg-white pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                defaultValue={defaultSettings.timezone}
              >
                <option>{defaultSettings.timezone}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={2} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Currency <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                className="w-full text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 bg-white pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                defaultValue={defaultSettings.currency}
              >
                <option>{defaultSettings.currency}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3" />

      <div>
        <h3 className="text-sm font-bold text-slate-900">Contact Information</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          This information will be used for support and notifications.
        </p>
        <div className="space-y-3 mt-3.5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full text-xs font-medium border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                type="email"
                defaultValue={contactInfo.email}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full text-xs font-medium border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                type="text"
                defaultValue={contactInfo.phone}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Support Phone <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                className="w-full text-xs font-medium border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                type="text"
                defaultValue={contactInfo.supportPhone}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                className="w-full text-xs font-medium border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                type="text"
                defaultValue={contactInfo.address}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}