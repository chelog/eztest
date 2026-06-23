import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/frontend/reusable-elements/dialogs/Dialog';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { Label } from '@/frontend/reusable-elements/labels/Label';
import { Textarea } from '@/frontend/reusable-elements/textareas/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/frontend/reusable-elements/selects/Select';
import { CheckCircle, XCircle, AlertCircle, Circle } from 'lucide-react';
import { ResultFormData, TestCase } from '../types';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';

interface RecordResultDialogProps {
  open: boolean;
  testCase: TestCase | null;
  testCaseId: string;
  projectId: string;
  testRunEnvironment?: string;
  formData: ResultFormData;
  onOpenChange: (open: boolean) => void;
  onFormChange: (data: Partial<ResultFormData>) => void;
  onSubmit: () => void;
}

export function RecordResultDialog({
  open,
  testCase,
  formData,
  onOpenChange,
  onFormChange,
  onSubmit,
}: RecordResultDialogProps) {
  const { options: statusOptions } = useDropdownOptions('TestResult', 'status');

  const getStatusIcon = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'PASSED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'BLOCKED':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'SKIPPED':
        return <Circle className="w-4 h-4 text-gray-500" />;
      case 'RETEST':
        return <AlertCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="mb-4">
          <DialogTitle>Записать результат теста</DialogTitle>
          <DialogDescription>{testCase?.title || testCase?.name || ''}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mb-4">
          {testCase && (
            <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
              <div>
                <h3 className="text-sm font-semibold text-white/90">Полное название кейса</h3>
                <p className="mt-1 text-sm text-white/75 break-words">
                  {testCase.title || testCase.name || 'Без названия'}
                </p>
              </div>

              {testCase.preconditions && (
                <div>
                  <h3 className="text-sm font-semibold text-white/90">Preconditions</h3>
                  <p className="mt-1 text-sm text-white/75 whitespace-pre-wrap break-words">
                    {testCase.preconditions}
                  </p>
                </div>
              )}

              {testCase.steps && testCase.steps.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/90">Steps</h3>
                  <div className="mt-2 space-y-3">
                    {testCase.steps.map((step) => (
                      <div key={step.id} className="rounded-lg border border-white/10 bg-black/10 p-3">
                        <div className="text-xs font-medium text-white/50">Шаг {step.stepNumber}</div>
                        <div className="mt-2 text-sm text-white/85 whitespace-pre-wrap break-words">
                          <span className="font-medium text-white/90">Действие:</span> {step.action}
                        </div>
                        <div className="mt-1 text-sm text-white/75 whitespace-pre-wrap break-words">
                          <span className="font-medium text-white/90">Ожидаемый результат:</span> {step.expectedResult}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Статус результата *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: string) => onFormChange({ status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите статус результата" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(option.value)}
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Комментарий</Label>
            <Textarea
              id="comment"
              variant="glass"
              value={formData.comment}
              onChange={(e) => onFormChange({ comment: e.target.value })}
              placeholder="Добавьте комментарий к выполнению теста"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="glass"
            onClick={() => onOpenChange(false)}
            buttonName="Record Test Result Dialog - Cancel"
          >
            Отмена
          </Button>
          <ButtonPrimary
            onClick={onSubmit}
            buttonName="Record Test Result Dialog - Save Result"
          >
            Сохранить результат
          </ButtonPrimary>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
