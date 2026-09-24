'use client';

import * as React from 'react';
import { Check, ChevronDown, Folder, FolderX, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/frontend/reusable-elements/dropdowns/DropdownMenu';
import { flattenModuleTree, getModulePath, type TreeModule } from '@/lib/module-tree';
import { cn } from '@/lib/utils';

interface FolderPickerProps {
  /** All folders of the project */
  folders: TreeModule[];
  /** Selected folder id, or null for "no folder" */
  value: string | null;
  onChange: (folderId: string | null) => void;
  noneLabel?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Folder picker: shows the full path of the chosen folder; the menu lists the folder tree
 * (subfolders indented) with a search over the whole path.
 */
export function FolderPicker({
  folders,
  value,
  onChange,
  noneLabel = 'Без папки',
  id,
  disabled,
  className,
}: FolderPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const searchRef = React.useRef<HTMLInputElement>(null);

  // The menu focuses its first item on open; move focus to the search so typing works right away
  React.useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => searchRef.current?.focus(), 0);
    return () => clearTimeout(timer);
  }, [open]);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const flat = flattenModuleTree(folders);
    if (!q) return flat.map(({ folder, depth }) => ({ folder, depth, label: folder.name }));
    return flat
      .map(({ folder }) => ({ folder, depth: 0, label: getModulePath(folder.id, folders) }))
      .filter((row) => row.label.toLowerCase().includes(q));
  }, [folders, query]);

  const selectedPath = value ? getModulePath(value, folders) : '';

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          className={cn(
            'flex h-10 w-full items-center gap-2.5 rounded-[10px] border border-white/15 bg-[#0f0f12]/70 px-3.5 text-left text-sm transition-colors hover:border-white/25 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
        >
          {value ? (
            <Folder className="h-4 w-4 shrink-0 text-white/50" />
          ) : (
            <FolderX className="h-4 w-4 shrink-0 text-white/35" />
          )}
          <span className={cn('min-w-0 flex-1 truncate', value ? 'text-white/90' : 'text-white/45')} title={selectedPath}>
            {value ? selectedPath : noneLabel}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-white/40" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="p-1.5"
        style={{ width: 'var(--radix-dropdown-menu-trigger-width)', minWidth: 280 }}
      >
        <label className="mb-1 flex h-9 items-center gap-2 rounded-[8px] bg-white/[0.05] px-2.5">
          <Search className="h-4 w-4 shrink-0 text-white/40" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            // Typing must not trigger the menu's type-ahead / close it
            onKeyDown={(e) => {
              if (e.key !== 'Escape' && e.key !== 'ArrowDown') e.stopPropagation();
            }}
            placeholder="Найти папку..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
          />
        </label>
        <div className="max-h-72 overflow-y-auto custom-scrollbar">
          {!query && (
            <DropdownMenuItem onSelect={() => onChange(null)} className="gap-2 cursor-pointer">
              <FolderX className="h-4 w-4 shrink-0 text-white/40" />
              <span className="flex-1 text-white/70">{noneLabel}</span>
              {!value && <Check className="h-4 w-4 text-[var(--nt-accent,#10b981)]" />}
            </DropdownMenuItem>
          )}
          {rows.map(({ folder, depth, label }) => (
            <DropdownMenuItem
              key={folder.id}
              onSelect={() => onChange(folder.id)}
              className="gap-2 cursor-pointer"
              style={{ paddingLeft: 8 + depth * 16 }}
            >
              <Folder className="h-4 w-4 shrink-0 text-white/45" />
              <span className="min-w-0 flex-1 truncate" title={label}>
                {label}
              </span>
              {value === folder.id && <Check className="h-4 w-4 shrink-0 text-[var(--nt-accent,#10b981)]" />}
            </DropdownMenuItem>
          ))}
          {rows.length === 0 && <p className="px-3 py-4 text-center text-sm text-white/40">Папки не найдены</p>}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
