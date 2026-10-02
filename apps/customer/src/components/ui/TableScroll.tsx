import type { ReactNode } from 'react';

export function TableScroll({ children, label = 'Table' }: { children: ReactNode; label?: string }) {
  return (
    <div className="relative">
      {/* Focusable so keyboard users can scroll it sideways (WCAG 2.1.1). */}
      <div className="overflow-x-auto w-full" tabIndex={0} role="region" aria-label={label}>
        {children}
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}