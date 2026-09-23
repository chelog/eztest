'use client';

import { EmptyStateCard } from '@/frontend/reusable-components/cards/EmptyStateCard';
import { Folder } from 'lucide-react';

interface EmptyTestSuiteStateProps {
  onCreateClick: () => void;
  canCreate?: boolean;
}

export function EmptyTestSuiteState({ onCreateClick, canCreate = false }: EmptyTestSuiteStateProps) {
  return (
    <EmptyStateCard
      icon={Folder}
      title="Тест-сьюты не найдены"
      description="Объединяйте тест-кейсы в сьюты, чтобы тестирование было структурированным."
      actionLabel={canCreate ? 'Create Test Suite' : undefined}
      onAction={canCreate ? onCreateClick : undefined}
      actionButtonName="Test Suite List - Create Test Suite (Empty State)"
    />
  );
}
