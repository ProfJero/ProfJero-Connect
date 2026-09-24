import type { ReactNode } from 'react';

export function TableScroll({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="overflow-x-auto w-full">{children}</div>
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}