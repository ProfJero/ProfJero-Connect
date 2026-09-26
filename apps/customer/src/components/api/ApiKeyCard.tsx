import { useState } from 'react';
import { Copy, Check, FileText, Plus, Trash2 } from 'lucide-react';
import { apiKeyInfo } from '../../mock/api';

export function ApiKeyCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKeyInfo.masked);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable — silently ignore
    }
  };

  return (
    <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2.5">
          API Key
        </h3>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-normal">
          {apiKeyInfo.label}
        </label>
        <div className="relative flex items-center">
          <input
            className="w-full bg-slate-50/60 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3.5 pr-10 text-xs font-mono text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1a6cf0] select-all tracking-wider"
            readOnly
            type="text"
            value={apiKeyInfo.masked}
          />
          <button
            onClick={handleCopy}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            title="Copy API Key"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
            ) : (
              <Copy className="w-4 h-4" strokeWidth={2} />
            )}
          </button>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
          {apiKeyInfo.warning}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 mt-4 pt-2">
        <button className="bg-[#1a6cf0] hover:bg-[#155cd0] text-white font-medium text-xs py-2 px-3.5 rounded-lg flex items-center transition-colors shadow-xs">
          <FileText className="w-3.5 h-3.5 mr-1.5" strokeWidth={2} />
          View Documentation
        </button>

        <button className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-[#1a6cf0] dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 font-medium text-xs py-2 px-3.5 rounded-lg flex items-center transition-colors">
          <Plus className="w-3.5 h-3.5 mr-1.5" strokeWidth={2.5} />
          Create API Key
        </button>

        <button className="bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-500/30 font-medium text-xs py-2 px-3.5 rounded-lg flex items-center transition-colors ml-auto">
          <Trash2 className="w-3.5 h-3.5 mr-1.5" strokeWidth={2} />
          Revoke Key
        </button>
      </div>
    </div>
  );
}