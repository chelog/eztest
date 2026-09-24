'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Folder, FolderOpen, FolderX, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/frontend/reusable-elements/dialogs/Dialog';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { cn } from '@/lib/utils';
import { flattenModuleTree, getModulePath } from '@/lib/module-tree';
import type { Module } from '../types';

const ROOT = '__root__';

interface MoveToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** All folders of the project */
  modules: Module[];
  /** Where the item is now (null = no folder / top level; undefined = mixed, e.g. several test cases) */
  currentFolderId?: string | null;
  /** Folders that can't be chosen (the moved folder and its subfolders) */
  disabledIds?: Set<string>;
  /** Label of the "no folder" choice */
  rootLabel: string;
  onConfirm: (targetFolderId: string | null) => Promise<void>;
}

/** Folder picker: tree of folders with search; used to move test cases and folders. */
export function MoveToFolderDialog({
  open,
  onOpenChange,
  title,
  description,
  modules,
  currentFolderId,
  disabledIds,
  rootLabel,
  onConfirm,
}: MoveToFolderDialogProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(null);
      setError(null);
    }
  }, [open]);

  const rows = useMemo(() => {
    const flat = flattenModuleTree(modules);
    const q = query.trim().toLowerCase();
    if (!q) return flat.map(({ folder, depth }) => ({ folder, depth, label: folder.name }));
    // Search shows matching folders flat, with their full path
    return flat
      .map(({ folder }) => ({ folder, depth: 0, label: getModulePath(folder.id, modules) }))
      .filter((row) => row.label.toLowerCase().includes(q));
  }, [modules, query]);

  const current = currentFolderId === undefined ? undefined : currentFolderId ?? ROOT;
  const canSubmit = selected !== null && selected !== current && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await onConfirm(selected === ROOT ? null : selected);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось переместить');
    } finally {
      setSaving(false);
    }
  };

  const option = (id: string, label: string, depth: number, icon: React.ReactNode, disabled = false) => {
    const isCurrent = id === current;
    const isSelected = id === selected;
    return (
      <button
        key={id}
        type="button"
        disabled={disabled || isCurrent}
        onClick={() => setSelected(id)}
        className={cn(
          'flex w-full items-center gap-2 rounded-[8px] py-2 pr-3 text-left text-sm transition-colors cursor-pointer',
          'disabled:cursor-not-allowed disabled:opacity-40',
          isSelected ? 'bg-white/[0.09] text-white' : 'text-white/80 hover:bg-white/[0.05]'
        )}
        style={{ paddingLeft: 10 + depth * 18 }}
        title={label}
      >
        {icon}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {isCurrent && <span className="shrink-0 text-xs text-white/40">сейчас здесь</span>}
        {isSelected && <Check className="h-4 w-4 shrink-0 text-[var(--nt-accent,#10b981)]" />}
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] flex flex-col p-0 overflow-hidden">
        <div className="px-6 pt-6">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription className="mt-2">{description}</DialogDescription>}
          </DialogHeader>

          <label className="mt-5 flex h-10 items-center gap-2 rounded-[10px] bg-white/[0.05] px-3">
            <Search className="h-4 w-4 shrink-0 text-white/40" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Найти папку..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
          </label>
        </div>

        <div className="mx-6 mt-3 max-h-[360px] min-h-[160px] overflow-y-auto custom-scrollbar space-y-0.5 py-1">
          {!query && option(ROOT, rootLabel, 0, <FolderX className="h-4 w-4 shrink-0 text-white/45" />)}
          {rows.map(({ folder, depth, label }) =>
            option(
              folder.id,
              label,
              depth,
              folder.id === selected ? (
                <FolderOpen className="h-4 w-4 shrink-0 text-[var(--nt-accent,#10b981)]" />
              ) : (
                <Folder className="h-4 w-4 shrink-0 text-white/45" />
              ),
              disabledIds?.has(folder.id)
            )
          )}
          {rows.length === 0 && <p className="px-3 py-6 text-center text-sm text-white/40">Папки не найдены</p>}
        </div>

        {error && <p className="mx-6 mt-2 text-sm text-red-400">{error}</p>}

        <div data-ui="dialog-footer" className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.06] px-6 py-4">
          <Button type="button" variant="glass" onClick={() => onOpenChange(false)} className="w-full">
            Отмена
          </Button>
          <ButtonPrimary type="button" onClick={handleSubmit} disabled={!canSubmit} className="w-full">
            {saving ? 'Перемещение...' : 'Переместить'}
          </ButtonPrimary>
        </div>
      </DialogContent>
    </Dialog>
  );
}
