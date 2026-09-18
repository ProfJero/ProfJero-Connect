import type { ReactNode } from 'react';

/**
 * Wraps a wide table with horizontal scroll and a right-edge fade hint.
 * Use on any table that can overflow on small screens.
 */
export function TableScroll({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="overflow-x-auto w-full">{children}</div>
      {/* Right-edge fade — hints that the table scrolls horizontally */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent"
        aria-hidden="true"
      />
    </div>
  );
}