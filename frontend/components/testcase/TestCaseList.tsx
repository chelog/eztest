'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Plus, FolderPlus, Import, Upload, ChevronDown, FolderInput, FolderOpen, MoreHorizontal, Trash2, X } from 'lucide-react';
import { BaseConfirmDialog } from '@/frontend/reusable-components/dialogs/BaseConfirmDialog';
import { Navbar } from '@/frontend/reusable-components/layout/Navbar';
import { Breadcrumbs } from '@/frontend/reusable-components/layout/Breadcrumbs';
import { ButtonSecondary } from '@/frontend/reusable-elements/buttons/ButtonSecondary';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/frontend/reusable-elements/dropdowns/DropdownMenu';
import { PageHeaderWithBadge } from '@/frontend/reusable-components/layout/PageHeaderWithBadge';
import { HeaderWithFilters } from '@/frontend/reusable-components/layout/HeaderWithFilters';
import { Loader } from '@/frontend/reusable-elements/loaders/Loader';
import { Pagination } from '@/frontend/reusable-elements/pagination/Pagination';
import { PAGE_SIZE_OPTIONS } from '@/lib/pagination-config';
import { useItemsPerPage } from '@/hooks/useItemsPerPage';
import { FloatingAlert, type FloatingAlertMessage } from '@/frontend/reusable-components/alerts/FloatingAlert';
import { TestCase, Project, Module } from './types';
import { TestCaseTable } from './subcomponents/TestCaseTable';
import { CreateTestCaseDialog } from './subcomponents/CreateTestCaseDialog';
import { CreateModuleDialog } from './subcomponents/CreateModuleDialog';
import { DeleteTestCaseDialog } from './subcomponents/DeleteTestCaseDialog';
import { TestCaseFilters } from './subcomponents/TestCaseFilters';
import { EmptyTestCaseState } from './subcomponents/EmptyTestCaseState';
import { usePermissions } from '@/hooks/usePermissions';
import { MoveToFolderDialog } from './module/MoveToFolderDialog';
import { flattenModuleTree, getDescendantIds, getModuleAncestors, getModulePath } from '@/lib/module-tree';
import { FileImportDialog } from '@/frontend/reusable-components/dialogs/FileImportDialog';
import { FileExportDialog } from '@/frontend/reusable-components/dialogs/FileExportDialog';

interface TestCaseListProps {
  projectId: string;
}

// "1 папка", "2 папки", "5 папок"
const plural = (n: number, one: string, few: string, many: string) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word = mod10 === 1 && mod100 !== 11 ? one : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many;
  return `${n} ${word}`;
};
const foldersLabel = (n: number) => plural(n, 'папка', 'папки', 'папок');
const casesLabel = (n: number) => plural(n, 'тест-кейс', 'тест-кейса', 'тест-кейсов');

export default function TestCaseList({ projectId }: TestCaseListProps) {
  const router = useRouter();
  const { hasPermission: hasPermissionCheck, isLoading: permissionsLoading, role } = usePermissions();

  const [project, setProject] = useState<Project | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  // Categories shown on the current page (pagination counts categories, not test cases)
  const [pageModuleIds, setPageModuleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  // Folder preselected in "new test case" (from a folder menu); undefined = last used folder
  const [newCaseFolderId, setNewCaseFolderId] = useState<string | undefined>(undefined);
  const [createModuleDialogOpen, setCreateModuleDialogOpen] = useState(false);
  // Parent preselected in the "new folder" dialog (null = top level)
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  // What the folder picker is moving
  const [moveSubject, setMoveSubject] = useState<
    | { kind: 'testcase'; testCase: TestCase }
    | { kind: 'folder'; module: Module }
    | { kind: 'selection' }
    | null
  >(null);
  // Bulk selection (ids of test cases on the current page)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Folders checked as a whole: they are moved as folders (with their structure)
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useItemsPerPage();
  const [totalPagesCount, setTotalPagesCount] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isPaginationChange, setIsPaginationChange] = useState(false);

  // Alert state
  const [alert, setAlert] = useState<FloatingAlertMessage | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchProject();
    fetchTestSuites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Fetch test cases with backend pagination when filters or page changes
  useEffect(() => {
    fetchTestCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, currentPage, itemsPerPage, searchQuery, priorityFilter, statusFilter]);

  useEffect(() => {
    if (project) {
      document.title = `Тест-кейсы - ${project.name} | EZTest`;
    }
  }, [project]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();
      if (data.data) {
        setProject(data.data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchTestCases = async () => {
    try {
      // Show loader on initial load or pagination changes, but not on search/filter changes
      if (testCases.length === 0 && modules.length === 0) {
        setLoading(true);
      } else if (isPaginationChange) {
        setLoading(true);
      }
      
      // Build query parameters for pagination and filtering
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        groupBy: 'modulePage',
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/projects/${projectId}/testcases?${params}`);
      const data = await response.json();
      
      if (data.data) {
        setTestCases(data.data);
        // Keep only selected test cases that are still on the page
        const onPage = new Set((data.data as TestCase[]).map((tc) => tc.id));
        setSelectedIds((prev) => {
          const kept = [...prev].filter((id) => onPage.has(id));
          return kept.length === prev.size ? prev : new Set(kept);
        });
      }
      
      if (data.modules) {
        setModules(data.modules);
      }
      setPageModuleIds(Array.isArray(data.pageModuleIds) ? data.pageModuleIds : []);
      
      if (data.pagination) {
        setTotalPagesCount(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
      }
    } catch (error) {
      console.error('Error fetching test cases:', error);
    } finally {
      setLoading(false);
      setIsPaginationChange(false);
    }
  };

  const fetchTestSuites = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/testsuites`);
      const data = await response.json();
      if (data.data) {
        // Test suites available for module context
      }
    } catch (error) {
      console.error('Error fetching test suites:', error);
    }
  };

  const handlePageChange = (page: number) => {
    setIsPaginationChange(true);
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setIsPaginationChange(true);
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  useEffect(() => {
    setSelectedIds(new Set());
    setSelectedFolderIds(new Set());
  }, [currentPage, itemsPerPage, searchQuery, priorityFilter, statusFilter]);

  // Folders of the current page: its top-level folders (server order) with all their subfolders
  const modulesForTable = useMemo(() => {
    const flat = flattenModuleTree(modules);
    const rootOf = new Map(
      flat.map(({ folder }) => [folder.id, getModuleAncestors(folder.id, modules)[0]?.id ?? folder.id])
    );
    return pageModuleIds.flatMap((rootId) =>
      flat.filter(({ folder }) => rootOf.get(folder.id) === rootId).map(({ folder }) => folder)
    );
  }, [modules, pageModuleIds]);

  const folderLabel = (moduleId: string | null) =>
    moduleId ? `«${getModulePath(moduleId, modules)}»` : 'корень (без папки)';

  const moveTestCases = async (testCaseIds: string[], moduleId: string | null) => {
    const response = await fetch(`/api/projects/${projectId}/testcases/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testCaseIds, moduleId }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || data.message || 'Не удалось переместить тест-кейс');
    }
  };

  const moveFolder = async (moduleId: string, parentId: string | null) => {
    const response = await fetch(`/api/projects/${projectId}/modules/${moduleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || data.message || 'Не удалось переместить папку');
    }
  };

  /**
   * Every move goes through here: folders move as a whole (PATCH parent), test cases one by one.
   * Remembers where everything was, so the result alert can undo the move.
   */
  const performMove = async (
    { folderIds = [], caseIds = [] }: { folderIds?: string[]; caseIds?: string[] },
    targetId: string | null
  ) => {
    const previousParent = new Map(folderIds.map((id) => [id, modules.find((m) => m.id === id)?.parentId ?? null]));
    const caseById = new Map(testCases.map((tc) => [tc.id, tc]));
    const previousFolder = new Map(caseIds.map((id) => [id, caseById.get(id)?.moduleId ?? null]));

    for (const folderId of folderIds) await moveFolder(folderId, targetId);
    if (caseIds.length > 0) await moveTestCases(caseIds, targetId);

    const undo = async () => {
      try {
        for (const [folderId, parentId] of previousParent) await moveFolder(folderId, parentId);
        // Test cases go back folder by folder
        const byFolder = new Map<string | null, string[]>();
        previousFolder.forEach((folderId, caseId) => byFolder.set(folderId, [...(byFolder.get(folderId) ?? []), caseId]));
        for (const [folderId, ids] of byFolder) await moveTestCases(ids, folderId);
        setAlert({ type: 'success', title: 'Перемещение отменено', message: 'Всё вернулось на свои места' });
      } catch (error) {
        setAlert({
          type: 'error',
          title: 'Не удалось отменить',
          message: error instanceof Error ? error.message : 'Попробуйте ещё раз',
        });
      }
      fetchTestCases();
    };

    const parts: string[] = [
      folderIds.length === 1
        ? `папка «${modules.find((m) => m.id === folderIds[0])?.name ?? ''}»`
        : folderIds.length > 1
          ? foldersLabel(folderIds.length)
          : '',
      caseIds.length === 1
        ? `«${caseById.get(caseIds[0])?.title ?? 'тест-кейс'}»`
        : caseIds.length > 1
          ? casesLabel(caseIds.length)
          : '',
    ].filter(Boolean);
    setAlert({
      type: 'success',
      title: 'Перемещено',
      message: `${parts.join(' и ')} → ${targetId ? folderLabel(targetId) : folderIds.length ? 'верхний уровень' : 'без папки'}`,
      action: { label: 'Отменить', onClick: () => void undo() },
    });
    fetchTestCases();
  };

  // Drag & drop moves apply right away and report errors
  const runMove = async (move: () => Promise<void>) => {
    try {
      await move();
    } catch (error) {
      setAlert({
        type: 'error',
        title: 'Не удалось переместить',
        message: error instanceof Error ? error.message : 'Попробуйте ещё раз',
      });
    }
  };

  // Selection split: whole folders (without nested ones already covered by a selected parent)
  // and test cases that are not inside those folders
  const selectionPlan = useMemo(() => {
    const folderSet = new Set([...selectedFolderIds].filter((id) => modules.some((m) => m.id === id)));
    const topFolders = [...folderSet].filter(
      (id) => !getModuleAncestors(id, modules).some((ancestor) => folderSet.has(ancestor.id))
    );
    const covered = new Set(topFolders.flatMap((id) => [...getDescendantIds(id, modules)]));
    const caseById = new Map(testCases.map((tc) => [tc.id, tc]));
    const looseCases = [...selectedIds].filter((id) => {
      const folderId = caseById.get(id)?.moduleId;
      return !(folderId && covered.has(folderId));
    });
    return { topFolders, covered, looseCases };
  }, [selectedFolderIds, selectedIds, modules, testCases]);

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectedFolderIds(new Set());
  };

  // Dragging one of the selected items moves the whole selection
  const handleDropTestCase = (testCase: TestCase, targetModuleId: string | null) => {
    if (selectedIds.has(testCase.id) && selectedIds.size + selectedFolderIds.size > 1) {
      const { topFolders, covered, looseCases } = selectionPlan;
      if (targetModuleId && covered.has(targetModuleId)) {
        setAlert({ type: 'error', title: 'Нельзя переместить', message: 'Папку нельзя переместить в саму себя' });
        return;
      }
      return runMove(async () => {
        await performMove({ folderIds: topFolders, caseIds: looseCases }, targetModuleId);
        clearSelection();
      });
    }
    return runMove(() => performMove({ caseIds: [testCase.id] }, targetModuleId));
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    let failed = 0;
    // One by one through the regular endpoint (it checks access and cleans up attachments)
    for (const id of ids) {
      const response = await fetch(`/api/projects/${projectId}/testcases/${id}`, { method: 'DELETE' }).catch(() => null);
      if (!response?.ok) failed++;
    }
    clearSelection();
    setBulkDeleteOpen(false);
    setAlert(
      failed === 0
        ? { type: 'success', title: 'Удалено', message: `Удалено тест-кейсов: ${ids.length}` }
        : { type: 'error', title: 'Удалено не всё', message: `Удалено ${ids.length - failed} из ${ids.length}` }
    );
    fetchTestCases();
  };

  // Common folder of the selected items (undefined when they are in different places)
  const selectionFolderId = (() => {
    const caseById = new Map(testCases.map((tc) => [tc.id, tc]));
    const places = new Set([
      ...selectionPlan.topFolders.map((id) => modules.find((m) => m.id === id)?.parentId ?? null),
      ...selectionPlan.looseCases.map((id) => caseById.get(id)?.moduleId ?? null),
    ]);
    return places.size === 1 ? [...places][0] : undefined;
  })();

  const handleDropFolder = (moduleId: string, targetParentId: string | null) =>
    runMove(() => performMove({ folderIds: [moduleId] }, targetParentId));

  const openNewFolderDialog = (parentId: string | null) => {
    setNewFolderParentId(parentId);
    setCreateModuleDialogOpen(true);
  };

  const handleTestCaseCreated = (newTestCase: TestCase) => {
    setAlert({
      type: 'success',
      title: 'Успешно',
      message: `Тест-кейс "${newTestCase.title}" успешно создан`,
    });
    setCurrentPage(1); // Navigate to page 1 to see the newly created test case
    fetchTestCases();
  };

  const handleModuleCreated = (newModule: Module) => {
    setAlert({
      type: 'success',
      title: 'Успешно',
      message: `Папка "${newModule.name}" успешно создана`,
    });
    setCreateModuleDialogOpen(false);
    setCurrentPage(1); // Navigate to page 1 to see the newly created module
    fetchTestCases(); // Refresh test cases and modules (modules are now fetched with pagination)
  };

  const handleDeleteTestCase = async () => {
    if (!selectedTestCase) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/testcases/${selectedTestCase.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const deletedTestCaseName = selectedTestCase.title;
        setDeleteDialogOpen(false);
        setSelectedTestCase(null);
        setAlert({
          type: 'success',
          title: 'Успешно',
          message: `Тест-кейс "${deletedTestCaseName}" успешно удален`,
        });
        fetchTestCases();
      } else {
        const data = await response.json();
        setAlert({
          type: 'error',
          title: 'Не удалось удалить тест-кейс',
          message: data.error || 'Не удалось удалить тест-кейс',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Произошла неизвестная ошибка';
      setAlert({
        type: 'error',
        title: 'Ошибка соединения',
        message: errorMessage,
      });
      console.error('Error deleting test case:', error);
    }
  };

  const handleCardClick = (testCaseId: string) => {
    router.push(`/projects/${projectId}/testcases/${testCaseId}`);
  };

  const handleDeleteClick = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setDeleteDialogOpen(true);
  };

  // Check permissions before early returns
  const canCreateTestCase = hasPermissionCheck('testcases:create');
  const canDeleteTestCase = hasPermissionCheck('testcases:delete');
  const canUpdateTestCase = hasPermissionCheck('testcases:update');
  const canImport = ['ADMIN', 'PROJECT_MANAGER', 'TESTER'].includes(role);

  const navbarActions = useMemo(() => {
    const actions = [];
    
    if (canCreateTestCase) {
      actions.push({
        type: 'custom' as const,
        custom: (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ButtonSecondary className="cursor-pointer flex items-center gap-2">
                Добавить
                <ChevronDown className="w-4 h-4" />
              </ButtonSecondary>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => openNewFolderDialog(null)}>
                <FolderPlus className="w-4 h-4" />
                Новая папка
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setNewCaseFolderId(undefined);
                  setCreateDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Новый тест-кейс
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      });
    }

    if (canCreateTestCase && canImport) {
      actions.push({
        type: 'custom' as const,
        custom: (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ButtonSecondary className="cursor-pointer flex items-center gap-2">
                Миграция
                <ChevronDown className="w-4 h-4" />
              </ButtonSecondary>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                <Import className="w-4 h-4" />
                Импорт тест-кейсов
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExportDialogOpen(true)}>
                <Upload className="w-4 h-4" />
                Экспорт тест-кейсов
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      });
    }

    actions.push({
      type: 'signout' as const,
      showConfirmation: true,
    });

    return actions;
  }, [canCreateTestCase, canImport]);

  if (loading || permissionsLoading) {
    return <Loader fullScreen text="Загрузка тест-кейсов..." />;
  }

  return (
    <>
      {/* Alert Messages */}
      <FloatingAlert alert={alert} onClose={() => setAlert(null)} />

      {/* Navbar */}
      <Navbar 
        brandLabel={null}
        items={[]}
        breadcrumbs={
          <Breadcrumbs 
            items={[
              { label: 'Проекты', href: '/projects' },
              { label: project?.name || 'Загрузка...', href: `/projects/${projectId}` },
              { label: 'Тест-кейсы' }
            ]}
          />
        }
        actions={navbarActions}
      />

      <div className="px-4 sm:px-6 lg:px-8 pt-8 w-full min-w-0 overflow-hidden">
        {/* Header and Filters Section */}
        <HeaderWithFilters
          header={
            <PageHeaderWithBadge
              badge={project?.key}
              title="Тест-кейсы"
              description={project?.name}
            />
          }
          filters={
            mounted ? (
              <TestCaseFilters
                searchQuery={searchQuery}
                priorityFilter={priorityFilter}
                statusFilter={statusFilter}
                onSearchChange={setSearchQuery}
                onPriorityChange={setPriorityFilter}
                onStatusChange={setStatusFilter}
              />
            ) : null
          }
        />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-4">
        {/* Test Cases List */}
        {loading ? (
          <Loader fullScreen={false} text="Загрузка тест-кейсов..." />
        ) : testCases.length === 0 && totalItems === 0 ? (
          <EmptyTestCaseState
            hasFilters={false}
            onCreateClick={() => setCreateDialogOpen(true)}
            canCreate={canCreateTestCase}
          />
        ) : (
          <>
            <TestCaseTable
              testCases={testCases}
              groupedByModule={true}
              nested={true}
              selectedIds={canUpdateTestCase || canDeleteTestCase ? selectedIds : undefined}
              onSelectionChange={canUpdateTestCase || canDeleteTestCase ? setSelectedIds : undefined}
              selectedFolderIds={canUpdateTestCase || canDeleteTestCase ? selectedFolderIds : undefined}
              onFolderSelectionChange={canUpdateTestCase || canDeleteTestCase ? setSelectedFolderIds : undefined}
              selectionToolbar={
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="px-1 text-sm font-semibold text-white whitespace-nowrap">
                    Выбрано:{' '}
                    {[
                      selectionPlan.topFolders.length > 0 ? foldersLabel(selectionPlan.topFolders.length) : '',
                      selectionPlan.looseCases.length > 0 ? casesLabel(selectionPlan.looseCases.length) : '',
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                  <span className="mx-1 h-5 w-px bg-white/10" aria-hidden="true" />
                  {canUpdateTestCase && (
                    <button
                      type="button"
                      onClick={() => setMoveSubject({ kind: 'selection' })}
                      className="flex h-8 items-center gap-1.5 rounded-[8px] bg-white/[0.06] px-3 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.1] cursor-pointer"
                    >
                      <FolderInput className="h-4 w-4" />
                      Переместить
                    </button>
                  )}
                  {canDeleteTestCase && selectedIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setBulkDeleteOpen(true)}
                      className="flex h-8 items-center gap-1.5 rounded-[8px] bg-white/[0.06] px-3 text-[13px] font-semibold text-white transition-colors hover:bg-red-500/15 hover:text-red-300 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      Удалить
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="ml-auto flex h-8 items-center gap-1.5 rounded-[8px] px-2 text-[13px] text-white/50 transition-colors hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                    Снять выделение
                  </button>
                </div>
              }
              modules={modulesForTable}
              onDelete={handleDeleteClick}
              onClick={handleCardClick}
              canDelete={canDeleteTestCase}
              projectId={projectId}
              enableModuleLink={true}
              onMoveRequest={canUpdateTestCase ? (testCase) => setMoveSubject({ kind: 'testcase', testCase }) : undefined}
              onMoveTestCase={canUpdateTestCase ? handleDropTestCase : undefined}
              onMoveFolder={canUpdateTestCase ? handleDropFolder : undefined}
              renderFolderActions={(moduleId) => {
                const folder = modules.find((m) => m.id === moduleId);
                if (!folder) return null;
                return (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 opacity-0 transition group-hover/header:opacity-100 hover:bg-white/10 hover:text-white data-[state=open]:opacity-100 cursor-pointer"
                        aria-label={`Действия с папкой ${folder.name}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/projects/${projectId}/modules/${moduleId}`)}>
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Открыть папку
                      </DropdownMenuItem>
                      {canCreateTestCase && (
                        <DropdownMenuItem
                          onClick={() => {
                            setNewCaseFolderId(moduleId);
                            setCreateDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Новый тест-кейс здесь
                        </DropdownMenuItem>
                      )}
                      {canCreateTestCase && (
                        <DropdownMenuItem onClick={() => openNewFolderDialog(moduleId)}>
                          <FolderPlus className="w-4 h-4 mr-2" />
                          Новая подпапка
                        </DropdownMenuItem>
                      )}
                      {canUpdateTestCase && (
                        <DropdownMenuItem onClick={() => setMoveSubject({ kind: 'folder', module: folder })}>
                          <FolderInput className="w-4 h-4 mr-2" />
                          Переместить папку
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }}
            />

            {/* Pagination */}
            {totalItems > 0 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPagesCount}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  itemsPerPageOptions={PAGE_SIZE_OPTIONS}
                  showItemsPerPage={true}
                  totalLabel="категорий"
                />
              </div>
            )}
          </>
        )}

        {/* Create Test Case Dialog */}
        <CreateTestCaseDialog
          projectId={projectId}
          defaultModuleId={newCaseFolderId}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onTestCaseCreated={handleTestCaseCreated}
        />

        {/* Create Module Dialog */}
        <CreateModuleDialog
          modules={modules}
          defaultParentId={newFolderParentId}
          projectId={projectId}
          triggerOpen={createModuleDialogOpen}
          onOpenChange={setCreateModuleDialogOpen}
          onModuleCreated={handleModuleCreated}
        />

        {/* Move test case / folder */}
        <MoveToFolderDialog
          open={moveSubject !== null}
          onOpenChange={(open) => !open && setMoveSubject(null)}
          title={
            moveSubject?.kind === 'folder'
              ? `Переместить папку «${moveSubject.module.name}»`
              : moveSubject?.kind === 'selection'
                ? 'Переместить выбранное'
                : `Переместить «${moveSubject?.testCase.title ?? ''}»`
          }
          description={
            moveSubject?.kind === 'folder'
              ? 'Папка переедет вместе со всеми подпапками и тест-кейсами.'
              : moveSubject?.kind === 'selection'
                ? selectionPlan.topFolders.length > 0
                  ? 'Выбранные папки переедут целиком — с подпапками и тест-кейсами, структура сохранится. Отдельно выбранные тест-кейсы переедут в ту же папку.'
                  : 'Все выбранные тест-кейсы переедут в одну папку.'
                : 'Выберите папку для тест-кейса.'
          }
          modules={modules}
          currentFolderId={
            moveSubject?.kind === 'folder'
              ? moveSubject.module.parentId ?? null
              : moveSubject?.kind === 'selection'
                ? selectionFolderId
                : moveSubject?.testCase.moduleId ?? null
          }
          disabledIds={
            moveSubject?.kind === 'folder'
              ? getDescendantIds(moveSubject.module.id, modules)
              : moveSubject?.kind === 'selection'
                ? selectionPlan.covered
                : undefined
          }
          rootLabel={
            moveSubject?.kind === 'folder' || (moveSubject?.kind === 'selection' && selectionPlan.topFolders.length > 0)
              ? 'Верхний уровень'
              : 'Без папки'
          }
          onConfirm={async (target) => {
            if (!moveSubject) return;
            if (moveSubject.kind === 'selection') {
              await performMove({ folderIds: selectionPlan.topFolders, caseIds: selectionPlan.looseCases }, target);
              clearSelection();
            } else if (moveSubject.kind === 'folder') {
              await performMove({ folderIds: [moveSubject.module.id] }, target);
            } else {
              await performMove({ caseIds: [moveSubject.testCase.id] }, target);
            }
          }}
        />

        <BaseConfirmDialog
          title="Удалить выбранные тест-кейсы"
          description={
            selectionPlan.topFolders.length > 0
              ? `Будет удалено тест-кейсов: ${selectedIds.size} (включая содержимое выбранных папок). Сами папки останутся. Это действие нельзя отменить.`
              : `Будет удалено тест-кейсов: ${selectedIds.size}. Это действие нельзя отменить.`
          }
          submitLabel="Удалить"
          cancelLabel="Отмена"
          triggerOpen={bulkDeleteOpen}
          onOpenChange={setBulkDeleteOpen}
          onSubmit={handleBulkDelete}
          destructive
          dialogName="Bulk Delete Test Cases"
        />

        {/* Delete Dialog */}
        <DeleteTestCaseDialog
          testCase={selectedTestCase}
          triggerOpen={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteTestCase}
        />

        {/* Import Dialog */}
        <FileImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          title="Импорт тест-кейсов"
          description="Загрузите CSV или Excel файл для массового импорта тест-кейсов."
          importEndpoint={`/api/projects/${projectId}/testcases/import`}
          templateEndpoint={`/api/projects/${projectId}/testcases/import/template`}
          itemName="тест-кейсы"
          onImportComplete={() => {
            fetchTestCases();
            setImportDialogOpen(false);
          }}
          modules={modules.map(m => ({ id: m.id, name: m.name }))}
        />

        {/* Export Dialog */}
        <FileExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          title="Экспорт тест-кейсов"
          description="Выберите формат для экспорта тест-кейсов."
          exportOptions={{
            projectId,
            endpoint: `/api/projects/${projectId}/testcases/export`,
            filters: {
              suiteId: undefined,
              status: statusFilter !== 'all' ? statusFilter : undefined,
              priority: priorityFilter !== 'all' ? priorityFilter : undefined,
            },
          }}
          itemName="тест-кейсы"
          modules={modules.map(m => ({ id: m.id, name: m.name }))}
        />
      </div>
    </>
  );
}
