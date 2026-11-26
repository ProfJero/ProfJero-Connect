import type { GroupColor } from './types';

export const GROUP_COLORS: Record<GroupColor, { bg: string; text: string; swatch: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-[#1a6cf0] dark:text-blue-400', swatch: 'bg-[#1a6cf0]' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', swatch: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', swatch: 'bg-amber-500' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', swatch: 'bg-rose-500' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', swatch: 'bg-purple-500' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', swatch: 'bg-teal-500' },
};
