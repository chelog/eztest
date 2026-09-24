'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Folder, FolderOpen, FolderX, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/frontend/reusable-elements/dialogs/Dialog';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { Checkbox } from '@/frontend/reusable-elements/checkboxes/Checkbox';
import { SearchInput } from '@/frontend/reusable-elements/inputs/SearchInput';
import { FilterDropdown, type FilterOption } from '@/frontend/reusable-components/inputs/FilterDropdown';
import { OptionMarker } from '@/frontend/reusable-elements/selects/OptionMarker';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { groupChildren } from '@/lib/module-tree';
import { cn } from '@/lib/utils';

interface TestCase {
  id: string;
  tcId?: string;
  title?: string;
  name?: string;
  description?: string;
  priority?: string;
  status?: string;
  moduleId?: string | null;
  module?: {
    id: string;
    name: string;
    description?: string;
  } | null;
}

interface PickerFolder {
  id: string;
  name: string;
  parentId?: string | null;
  order?: number;
}

interface AddTestCasesDialogProps {
  open: boolean;
  testCases: TestCase[];
  selectedIds: string[];
  onOpenChange: (open: boolean) => void;
  onSelectionChange: (ids: string[]) => void;
  onSubmit: () => void;
  context?: 'suite' | 'run'; // 'suite' for test suite, 'run' for test run
  showPriority?: boolean; // whether to show the priority icon
  loading?: boolean; // whether submission is in progress
  /** Test cases are still being loaded */
  fetching?: boolean;
  /** All folders of the project (enables subfolders); otherwise folders come from test cases */
  folders?: PickerFolder[];
}

const NO_FOLDER = '__none__';
// Expand every folder automatically when a search/filter leaves only a few matches
const AUTO_EXPAND_LIMIT = 300;

/**
 * Unified dialog for adding test cases to suites or runs: folder tree with subfolders,
 * search and filters, folder checkboxes select everything inside.
 */
export function AddTestCasesDialog({
  open,
  testCases,
  selectedIds,
  onOpenChange,
  onSelectionChange,
  onSubmit,
  context = 'run',
  showPriority = true,
  loading = false,
  fetching = false,
  folders,
}: AddTestCasesDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setPriorityFilter('all');
      setStatusFilter('all');
      setExpanded(new Set());
    }
  }, [open]);

  const { options: priorityOptionsData } = useDropdownOptions('TestCase', 'priority');
  const { options: statusOptionsData } = useDropdownOptions('TestCase', 'status');

  const priorityOptions: FilterOption[] = [
    { value: 'all', label: 'Все приоритеты' },
    ...priorityOptionsData.map((opt) => ({ value: opt.value, label: opt.label })),
  ];
  const statusOptions: FilterOption[] = [
    { value: 'all', label: 'Все статусы' },
    ...statusOptionsData.map((opt) => ({ value: opt.value, label: opt.label })),
  ];
  const statusLabel = (status?: string) =>
    status ? statusOptionsData.find((opt) => opt.value === status)?.label || status : '';

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Folder list: given by the caller, or collected from the test cases themselves
  const allFolders = useMemo<PickerFolder[]>(() => {
    if (folders && folders.length > 0) return folders;
    const byId = new Map<string, PickerFolder>();
    testCases.forEach((tc) => {
      if (tc.module) byId.set(tc.module.id, { id: tc.module.id, name: tc.module.name });
    });
    return [...byId.values()];
  }, [folders, testCases]);
  const folderById = useMemo(() => new Map(allFolders.map((f) => [f.id, f])), [allFolders]);

  const filteredTestCases = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return testCases.filter((testCase) => {
      const folderName = folderById.get(testCase.moduleId ?? testCase.module?.id ?? '')?.name ?? '';
      const matchesSearch =
        !query ||
        (testCase.title || testCase.name || '').toLowerCase().includes(query) ||
        (testCase.tcId || '').toLowerCase().includes(query) ||
        folderName.toLowerCase().includes(query);
      const matchesPriority = priorityFilter === 'all' || testCase.priority === priorityFilter;
      const matchesStatus = statusFilter === 'all' || testCase.status === statusFilter;
      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [testCases, searchQuery, priorityFilter, statusFilter, folderById]);

  // Tree: children per folder, matching test cases per folder, ids of whole subtrees
  const tree = useMemo(() => {
    const children = groupChildren(allFolders);
    const casesByFolder = new Map<string, TestCase[]>();
    filteredTestCases.forEach((tc) => {
      const folderId = tc.moduleId ?? tc.module?.id ?? null;
      const key = folderId && folderById.has(folderId) ? folderId : NO_FOLDER;
      const list = casesByFolder.get(key);
      if (list) list.push(tc);
      else casesByFolder.set(key, [tc]);
    });
    const subtreeIds = new Map<string, string[]>();
    const collect = (folderId: string, seen: Set<string>): string[] => {
      if (subtreeIds.has(folderId)) return subtreeIds.get(folderId)!;
      if (seen.has(folderId)) return [];
      seen.add(folderId);
      const ids = [
        ...(casesByFolder.get(folderId) ?? []).map((tc) => tc.id),
        ...(children.get(folderId) ?? []).flatMap((child) => collect(child.id, seen)),
      ];
      subtreeIds.set(folderId, ids);
      return ids;
    };
    allFolders.forEach((f) => collect(f.id, new Set()));
    subtreeIds.set(NO_FOLDER, (casesByFolder.get(NO_FOLDER) ?? []).map((tc) => tc.id));
    return { children, casesByFolder, subtreeIds };
  }, [allFolders, filteredTestCases, folderById]);

  const isFiltering = searchQuery.trim() !== '' || priorityFilter !== 'all' || statusFilter !== 'all';
  const autoExpand = isFiltering && filteredTestCases.length <= AUTO_EXPAND_LIMIT;
  const isOpen = (folderId: string) => autoExpand || expanded.has(folderId);

  const toggleExpanded = (folderId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });

  const setMany = (ids: string[], value: boolean) => {
    const next = new Set(selected);
    ids.forEach((id) => (value ? next.add(id) : next.delete(id)));
    onSelectionChange([...next]);
  };

  const checkState = (ids: string[]): boolean | 'indeterminate' => {
    const count = ids.reduce((acc, id) => acc + (selected.has(id) ? 1 : 0), 0);
    return ids.length > 0 && count === ids.length ? true : count > 0 ? 'indeterminate' : false;
  };

  const visibleIds = useMemo(() => filteredTestCases.map((tc) => tc.id), [filteredTestCases]);
  const allState = checkState(visibleIds);

  const renderCase = (testCase: TestCase, depth: number) => (
    <label
      key={testCase.id}
      className="flex cursor-pointer items-center gap-3 rounded-[8px] py-1.5 pr-3 transition-colors hover:bg-white/[0.04]"
      style={{ paddingLeft: 38 + depth * 20 }}
    >
      <Checkbox
        checked={selected.has(testCase.id)}
        onCheckedChange={(value) => setMany([testCase.id], value === true)}
        className="size-4"
      />
      <span className="w-16 shrink-0 truncate font-mono text-xs text-white/45">{testCase.tcId}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-white/85">
        {testCase.title || testCase.name || 'Без названия'}
      </span>
      {showPriority && testCase.priority && <OptionMarker value={testCase.priority} className="size-3.5" />}
      {testCase.status && <span className="shrink-0 text-xs text-white/40">{statusLabel(testCase.status)}</span>}
    </label>
  );

  const renderFolder = (folderId: string, name: string, depth: number, virtual = false): React.ReactNode => {
    const ids = tree.subtreeIds.get(folderId) ?? [];
    if (ids.length === 0) return null; // nothing to add in this branch
    const opened = isOpen(folderId);
    const state = checkState(ids);
    const FolderIcon = virtual ? FolderX : opened ? FolderOpen : Folder;
    return (
      <div key={folderId}>
        <div
          className="flex items-center gap-2.5 rounded-[8px] py-2 pr-3 transition-colors hover:bg-white/[0.04]"
          style={{ paddingLeft: 8 + depth * 20 }}
        >
          <button
            type="button"
            onClick={() => toggleExpanded(folderId)}
            className="flex h-5 w-5 shrink-0 items-center justify-center text-white/45 hover:text-white cursor-pointer"
            aria-label={opened ? `Свернуть ${name}` : `Развернуть ${name}`}
          >
            <ChevronRight className={cn('h-4 w-4 transition-transform', opened && 'rotate-90')} />
          </button>
          <Checkbox
            checked={state}
            onCheckedChange={() => setMany(ids, state !== true)}
            aria-label={`Выбрать всё в ${name}`}
            className="size-4"
          />
          <FolderIcon className="h-4 w-4 shrink-0 text-white/45" />
          <button
            type="button"
            onClick={() => toggleExpanded(folderId)}
            className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-white cursor-pointer"
            title={name}
          >
            {name}
          </button>
          <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-xs tabular-nums text-white/50">
            {ids.length}
          </span>
        </div>
        {opened && (
          <div>
            {!virtual &&
              (tree.children.get(folderId) ?? []).map((child) => renderFolder(child.id, child.name, depth + 1))}
            {(tree.casesByFolder.get(folderId) ?? []).map((tc) => renderCase(tc, depth))}
          </div>
        )}
      </div>
    );
  };

  const target = context === 'suite' ? 'сьют' : 'тест-ран';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] flex max-h-[88vh] flex-col p-0 overflow-hidden">
        <div className="px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Добавить тест-кейсы в {target}</DialogTitle>
            <DialogDescription className="mt-2">
              Отметьте папки или отдельные тест-кейсы. Галочка на папке выбирает всё внутри, включая подпапки.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-3">
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Поиск по названию, ID или папке..." />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FilterDropdown value={priorityFilter} onValueChange={setPriorityFilter} placeholder="Приоритет" options={priorityOptions} className="w-full" />
              <FilterDropdown value={statusFilter} onValueChange={setStatusFilter} placeholder="Статус" options={statusOptions} className="w-full" />
            </div>
          </div>

          {!fetching && testCases.length > 0 && (
            <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-[10px] bg-white/[0.04] px-3 py-2.5">
              <Checkbox
                checked={allState}
                onCheckedChange={() => setMany(visibleIds, allState !== true)}
                disabled={visibleIds.length === 0}
                className="size-4"
              />
              <span className="flex-1 text-sm text-white/80">
                {isFiltering ? 'Выбрать все найденные' : 'Выбрать все тест-кейсы'}
              </span>
              <span className="text-xs tabular-nums text-white/45">
                {isFiltering ? `найдено: ${visibleIds.length}` : `всего: ${visibleIds.length}`}
              </span>
            </label>
          )}
        </div>

        <div className="mx-6 mt-2 min-h-[220px] flex-1 overflow-y-auto custom-scrollbar py-1">
          {fetching ? (
            <div className="flex h-full min-h-[220px] items-center justify-center gap-2 text-sm text-white/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              Загрузка тест-кейсов...
            </div>
          ) : testCases.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/50">
              Все тест-кейсы проекта уже добавлены — добавлять нечего
            </p>
          ) : filteredTestCases.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/50">По запросу или фильтрам ничего не найдено</p>
          ) : (
            <div className="space-y-0.5">
              {(tree.children.get('') ?? []).map((folder) => renderFolder(folder.id, folder.name, 0))}
              {renderFolder(NO_FOLDER, 'Без папки', 0, true)}
            </div>
          )}
        </div>

        <div data-ui="dialog-footer" className="mt-2 grid grid-cols-2 gap-3 border-t border-white/[0.06] px-6 py-4">
          <Button
            variant="glass"
            onClick={() => {
              onOpenChange(false);
              onSelectionChange([]);
            }}
            className="w-full cursor-pointer"
            disabled={loading}
          >
            Отмена
          </Button>
          <ButtonPrimary
            onClick={onSubmit}
            disabled={selectedIds.length === 0 || loading}
            className="w-full cursor-pointer"
          >
            {loading ? 'Добавление...' : selectedIds.length > 0 ? `Добавить (${selectedIds.length})` : 'Добавить'}
          </ButtonPrimary>
        </div>
      </DialogContent>
    </Dialog>
  );
}
