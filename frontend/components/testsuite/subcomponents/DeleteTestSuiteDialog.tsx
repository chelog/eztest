'use client';

import { BaseConfirmDialog, BaseConfirmDialogConfig } from '@/frontend/reusable-components/dialogs/BaseConfirmDialog';
import { TestSuite } from '../types';
import { AlertTriangle } from 'lucide-react';

export interface DeleteTestSuiteDialogProps {
  suite: TestSuite | null;
  triggerOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Generic delete confirmation dialog for test suites
 * Displays warnings about related items (test cases, child suites)
 */
export function DeleteTestSuiteDialog({
  suite,
  triggerOpen,
  onOpenChange,
  onConfirm,
}: DeleteTestSuiteDialogProps) {
  if (!suite) return null;

  const hasTestCases = suite._count?.testCases > 0;
  const hasChildren = suite.children && suite.children.length > 0;

  const content = (
    <div className="space-y-3">
      {hasTestCases && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
          <p className="font-medium flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 shrink-0" />В сьюте тест-кейсов: {suite._count.testCases}</p>
          <p className="mt-1 text-yellow-300/80">
            Тест-кейсы не удалятся, но останутся без сьюта.
          </p>
        </div>
      )}

      {hasChildren && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
          <p className="font-medium flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 shrink-0" />Вложенных сьютов: {suite.children?.length}</p>
          <p className="mt-1 text-yellow-300/80">
            Дочерние сьюты переместятся на верхний уровень.
          </p>
        </div>
      )}

      {!hasTestCases && !hasChildren && (
        <p className="text-sm text-gray-300">
          Действие нельзя отменить.
        </p>
      )}
    </div>
  );

  const config: BaseConfirmDialogConfig = {
    title: 'Удалить тест-сьют',
    description: `Удалить «${suite.name}»?`,
    content,
    submitLabel: 'Удалить',
    cancelLabel: 'Отмена',
    triggerOpen,
    onOpenChange,
    onSubmit: async () => onConfirm(),
    destructive: true,
    dialogName: 'Delete Test Suite Dialog',
    submitButtonName: 'Delete Test Suite Dialog - Delete',
    cancelButtonName: 'Delete Test Suite Dialog - Cancel',
  };

  return <BaseConfirmDialog {...config} />;
}
