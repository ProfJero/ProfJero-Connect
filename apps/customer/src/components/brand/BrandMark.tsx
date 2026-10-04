import { cn } from '../../lib/utils';

/**
 * The ProfJero "PJ" mark on its white rounded tile. Reads on dark and light
 * backgrounds alike. Source artwork: branding/source/ in the repo.
 */
export function BrandMark({ className, decorative = true }: { className?: string; decorative?: boolean }) {
  return (
    <img
      src="/logo-tile.webp"
      width={128}
      height={128}
      alt={decorative ? '' : 'ProfJero Connect'}
      className={cn('w-10 h-10 rounded-xl shadow-md shadow-black/10 shrink-0 select-none', className)}
      draggable={false}
    />
  );
}
