import { useEffect, useRef } from 'react';
import { Pencil, PauseCircle, PlayCircle, Archive } from 'lucide-react';
import type { Project } from '@profjero/shared';

export type RowAction = 'edit' | 'suspend' | 'activate' | 'archive';

interface Props {
  project: Project;
  /** Fixed-position coordinates, computed from the button's rect */
  position: { top: number; right: number };
  onClose: () => void;
  onAction: (project: Project, action: RowAction) => void;
}

export function RowActionsMenu({ project, position, onClose, onAction }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click, Escape, or scroll. Scroll matters because the
  // menu uses position: fixed — if the table scrolls, the menu would drift
  // away from its anchor button.
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleScroll = () => onClose();

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  const handle = (action: RowAction) => {
    onAction(project, action);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      style={{ position: 'fixed', top: position.top, right: position.right }}
      className="z-50 min-w-[160px] bg-white rounded-lg shadow-lg border border-slate-200 py-1 text-xs"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <MenuItem
        icon={<Pencil className="w-3.5 h-3.5" />}
        label="Edit"
        onClick={() => handle('edit')}
      />

      {project.status === 'active' && (
        <MenuItem
          icon={<PauseCircle className="w-3.5 h-3.5" />}
          label="Suspend"
          onClick={() => handle('suspend')}
        />
      )}

      {(project.status === 'suspended' || project.status === 'archived') && (
        <MenuItem
          icon={<PlayCircle className="w-3.5 h-3.5" />}
          label={project.status === 'archived' ? 'Restore' : 'Activate'}
          onClick={() => handle('activate')}
        />
      )}

      {project.status !== 'archived' && (
        <>
          <div className="my-1 border-t border-slate-100" />
          <MenuItem
            icon={<Archive className="w-3.5 h-3.5" />}
            label="Archive"
            onClick={() => handle('archive')}
            destructive
          />
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={
        'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ' +
        (destructive
          ? 'text-rose-600 hover:bg-rose-50'
          : 'text-slate-700 hover:bg-slate-50')
      }
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}