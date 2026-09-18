import { useState } from 'react';
import {
  ChevronDown,
  Phone,
  Info,
} from 'lucide-react';
import {
  sendSmsForm,
  unitCalculation,
  recipientTabs,
} from '../../mock/sendSms';
import { cn } from '../../lib/utils';

export function ComposeForm() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div
      className="sm:col-span-7 bg-white rounded-xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-5"
      data-purpose="compose-form"
    >
      <h3 className="text-base font-bold text-slate-900">1. Compose Message</h3>

      {/* Project + Sender ID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Select Project <span className="text-red-500">*</span>
          </label>
          <button className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2 bg-white text-xs cursor-pointer hover:border-slate-400 transition">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0',
                  sendSmsForm.selectedProject.avatarBg,
                )}
              >
                {sendSmsForm.selectedProject.name.charAt(0)}
              </div>
              <div className="leading-tight text-left">
                <div className="font-bold text-slate-900 text-xs">
                  {sendSmsForm.selectedProject.name}
                </div>
                <div className="text-[10px] text-slate-400">
                  {sendSmsForm.selectedProject.client}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Sender ID <span className="text-red-500">*</span>
          </label>
          <button className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2 bg-white text-xs cursor-pointer hover:border-slate-400 transition">
            <div className="leading-tight text-left">
              <div className="font-bold text-slate-900 text-xs">
                {sendSmsForm.selectedSenderId.value}
              </div>
              <div className="text-[10px] text-slate-400">
                {sendSmsForm.selectedSenderId.project}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>
      </div>

      {/* Recipients tabs */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Recipients <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-200 rounded-xl p-1 bg-slate-50/70">
          {recipientTabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = idx === activeTab;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg font-medium text-xs transition-all',
                  isActive
                    ? 'bg-[#1976d2] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Phone className="w-4 h-4" strokeWidth={2} />
          </span>
          <input
            className="block w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            type="text"
            defaultValue={sendSmsForm.phoneNumber}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">
          Enter a valid Ghana phone number (e.g. +233 24 123 4567)
        </p>
      </div>

      {/* Message body */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          className="block w-full p-3 border border-slate-300 rounded-lg text-xs font-normal text-slate-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-y"
          rows={4}
          defaultValue={sendSmsForm.messageBody}
        />
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-0.5">
          <span>
            Characters: {sendSmsForm.charCount}/{sendSmsForm.maxChars}
          </span>
          <span className="flex items-center gap-1 font-medium">
            Estimated units: {sendSmsForm.estimatedUnits}
            <Info className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
          </span>
        </div>
      </div>

      {/* Unit calculation */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-blue-600" strokeWidth={2} />
          <h4 className="text-xs font-semibold text-slate-800">SMS Unit Calculation</h4>
        </div>
        <div className="grid grid-cols-3 divide-x divide-blue-200/60 text-left pt-1">
          <div className="pr-3">
            <span className="text-[11px] text-slate-500 font-medium">Recipients</span>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {unitCalculation.recipients}
            </div>
          </div>
          <div className="px-3">
            <span className="text-[11px] text-slate-500 font-medium">
              Message Units (per recipient)
            </span>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {unitCalculation.perRecipient}
            </div>
          </div>
          <div className="pl-3">
            <span className="text-[11px] text-slate-500 font-medium">Total Units Required</span>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {unitCalculation.total}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          className="px-5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          type="button"
        >
          Clear Form
        </button>
        <button
          className="px-5 py-2 bg-[#1976d2] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          type="button"
        >
          <span>Continue to Confirm</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}