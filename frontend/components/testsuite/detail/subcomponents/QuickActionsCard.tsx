import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { Plus, Folder, FileCheck } from 'lucide-react';

interface QuickActionsCardProps {
  onCreateTestCase: () => void;
  onAddTestCase: () => void;
  onAddExistingTestCases: () => void;
  onViewAllTestCases: () => void;
  onViewAllSuites: () => void;
  canCreateTestCase?: boolean;
}

export function QuickActionsCard({
  onCreateTestCase,
  onAddTestCase,
  onAddExistingTestCases,
  onViewAllTestCases,
  onViewAllSuites,
  canCreateTestCase = false,
}: QuickActionsCardProps) {
  return (
    <DetailCard title="Быстрые действия" contentClassName="space-y-2">
      {canCreateTestCase && (
        <Button
          variant="glass"
          className="w-full justify-start"
          onClick={onCreateTestCase}
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать тест-кейс
        </Button>
      )}
      {canCreateTestCase && (
        <Button
          variant="glass"
          className="w-full justify-start"
          onClick={onAddExistingTestCases}
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить тест-кейсы
        </Button>
      )}
      <Button
        variant="glass"
        className="w-full justify-start"
        onClick={onViewAllTestCases}
      >
        <FileCheck className="w-4 h-4 mr-2" />
        Все тест-кейсы
      </Button>
      <Button
        variant="glass"
        className="w-full justify-start"
        onClick={onViewAllSuites}
      >
        <Folder className="w-4 h-4 mr-2" />
        Все сьюты
      </Button>
    </DetailCard>
  );
}
