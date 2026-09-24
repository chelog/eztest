'use client';

import { BaseDialog, BaseDialogField, BaseDialogConfig } from '@/frontend/reusable-components/dialogs/BaseDialog';
import { TestCase, Module } from '../types';
import { useEffect, useState } from 'react';
import { attachmentStorage } from '@/lib/attachment-storage';
import type { Attachment } from '@/lib/s3';
import { uploadFileToS3 } from '@/lib/s3';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { TestStep } from '../detail/types';
import { DialogAttachmentsList } from '@/frontend/reusable-components/attachments/DialogAttachmentsList';
import { TextareaWithAttachments } from '@/frontend/reusable-elements/textareas/TextareaWithAttachments';
import { Label } from '@/frontend/reusable-elements/labels/Label';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { FileUploadModal } from '@/frontend/reusable-components/uploads/FileUploadModal';
import { Plus, Trash2 } from 'lucide-react';

interface CreateTestCaseDialogProps {
  projectId: string;
  defaultModuleId?: string;
  open?: boolean;
  triggerOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTestCaseCreated: (testCase: TestCase) => void;
}

export function CreateTestCaseDialog({
  projectId,
  defaultModuleId,
  open,
  triggerOpen,
  onOpenChange,
  onTestCaseCreated,
}: CreateTestCaseDialogProps) {
  const [modules, setModules] = useState<Module[]>([]);
  // Common attachments - SINGLE SOURCE OF TRUTH for test case level
  const [commonAttachments, setCommonAttachments] = useState<Attachment[]>([]);
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [newStep, setNewStep] = useState<{ action: string; expectedResult: string }>({
    action: '',
    expectedResult: '',
  });
  // Step attachments state - ONLY for test steps
  const [stepAttachments, setStepAttachments] = useState<Record<string, Record<string, Attachment[]>>>({});
  const [newStepActionAttachments, setNewStepActionAttachments] = useState<Attachment[]>([]);
  const [newStepExpectedResultAttachments, setNewStepExpectedResultAttachments] = useState<Attachment[]>([]);

  // Fetch dynamic dropdown options
  const { options: priorityOptions } = useDropdownOptions('TestCase', 'priority');
  const { options: statusOptions } = useDropdownOptions('TestCase', 'status');

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/modules`);
        const data = await response.json();
        if (data.data) {
          setModules(data.data);
        }
      } catch (error) {
        console.error('Error fetching modules:', error);
      }
    };

    fetchModules();

    // Set attachment context when dialog opens
    if (open !== false) {
      attachmentStorage.setContext({
        entityType: 'testcase',
        projectId,
      });
    }

    return () => {
      // Clear context when dialog closes
      if (open === false) {
        attachmentStorage.clearContext();
      }
    };
  }, [projectId, open]);

  const moduleOptions = modules.map(module => ({
    value: module.id,
    label: module.name,
  }));

  const fields: BaseDialogField[] = [
    {
      name: 'title',
      label: 'Название',
      placeholder: 'Введите название тест-кейса',
      type: 'text',
      required: true,
      minLength: 3,
      maxLength: 200,
      cols: 2,
    },
    {
      name: 'priority',
      label: 'Приоритет',
      type: 'select',
      defaultValue: 'MEDIUM',
      options: priorityOptions.map(opt => ({ value: opt.value, label: opt.label })),
      cols: 1,
    },
    {
      name: 'status',
      label: 'Статус',
      type: 'select',
      defaultValue: 'DRAFT',
      options: statusOptions.map(opt => ({ value: opt.value, label: opt.label })),
      cols: 1,
    },
    {
      name: 'moduleId',
      label: 'Модуль',
      type: 'select',
      placeholder: 'Выберите модуль',
      defaultValue: defaultModuleId || 'none',
      options: [
        { value: 'none', label: 'Без модуля' },
        ...moduleOptions,
      ],
      cols: 1,
    },
    {
      name: 'estimatedTime',
      label: 'Оценка времени (мин)',
      type: 'number',
      placeholder: 'Введите оценку времени',
      cols: 1,
    },
    {
      name: 'description',
      label: 'Описание',
      type: 'textarea',
      placeholder: 'Введите описание тест-кейса',
      rows: 3,
      cols: 1,
    },
    {
      name: 'preconditions',
      label: 'Предусловия',
      type: 'textarea',
      placeholder: 'Введите предусловия',
      rows: 3,
      cols: 1,
    },
    {
      name: 'postconditions',
      label: 'Постусловия',
      type: 'textarea',
      placeholder: 'Введите постусловия',
      rows: 3,
      cols: 1,
    },
    {
      name: 'testData',
      label: 'Тестовые данные',
      type: 'textarea',
      placeholder: 'Введите тестовые данные',
      rows: 3,
      cols: 1,
    },
    {
      name: 'attachments',
      label: 'Вложения',
      type: 'custom',
      cols: 2,
      customRender: () => (
        <>
          <DialogAttachmentsList
            attachments={commonAttachments}
            onAddClick={() => setAttachmentModalOpen(true)}
          />
            <FileUploadModal
              isOpen={attachmentModalOpen}
              onClose={() => setAttachmentModalOpen(false)}
              attachments={commonAttachments}
              onAttachmentsChange={setCommonAttachments}
              fieldName="attachment"
              entityType="testcase"
              projectId={projectId}
              title="Вложения тест-кейса"
            />
        </>
      ),
    },
    {
      name: 'steps',
      label: 'Шаги',
      type: 'custom',
      cols: 2,
      customRender: () => (
          <div className="space-y-3">
            {steps.length === 0 ? (
              <p className="text-sm text-white/40">
                Шагов пока нет — заполните действие и ожидаемый результат ниже.
              </p>
            ) : (
              steps.map((step: TestStep) => (
                <div
                  key={step.stepNumber}
                  className="rounded-[12px] bg-white/[0.03] p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-white/[0.08] flex items-center justify-center text-xs font-semibold text-white/70">
                        {step.stepNumber}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label className="text-xs font-medium text-white/60 mb-1">
                            Действие
                          </Label>
                          <TextareaWithAttachments
                            variant="glass"
                            value={step.action}
                            onChange={(value) =>
                              handleStepChange(step.stepNumber, 'action', value)
                            }
                            placeholder="Введите действие"
                            fieldName="action"
                            attachments={stepAttachments[String(step.stepNumber)]?.action || []}
                            onAttachmentsChange={(attachments) => {
                              const stepKey = String(step.stepNumber);
                              setStepAttachments(prev => {
                                const existingStep = prev[stepKey] || { action: [], expectedResult: [] };
                                return {
                                  ...prev,
                                  [stepKey]: {
                                    ...existingStep,
                                    action: attachments
                                  }
                                };
                              });
                            }}
                            entityType="teststep"
                            projectId={projectId}
                            showAttachments={true}
                            maxLength={1000}
                            showCharCount={false}
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-white/60 mb-1">
                            Ожидаемый результат
                          </Label>
                          <TextareaWithAttachments
                            variant="glass"
                            value={step.expectedResult}
                            onChange={(value) =>
                              handleStepChange(
                                step.stepNumber,
                                'expectedResult',
                                value,
                              )
                            }
                            placeholder="Введите ожидаемый результат"
                            fieldName="expectedResult"
                            attachments={stepAttachments[String(step.stepNumber)]?.expectedResult || []}
                            onAttachmentsChange={(attachments) => {
                              const stepKey = String(step.stepNumber);
                              setStepAttachments(prev => {
                                const existingStep = prev[stepKey] || { action: [], expectedResult: [] };
                                return {
                                  ...prev,
                                  [stepKey]: {
                                    ...existingStep,
                                    expectedResult: attachments
                                  }
                                };
                              });
                            }}
                            entityType="teststep"
                            projectId={projectId}
                            showAttachments={true}
                            maxLength={1000}
                            showCharCount={false}
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 cursor-pointer hover:bg-red-400/10 hover:text-red-400"
                      onClick={() => handleRemoveStep(step.stepNumber)}
                      type="button"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))
            )}

            <div className="rounded-[12px] border border-dashed border-white/15 p-4 space-y-3">
              <div className="space-y-2">
                <Label>Действие</Label>
                <TextareaWithAttachments
                  variant="glass"
                  value={newStep.action}
                  onChange={(value) =>
                    setNewStep((prev) => ({ ...prev, action: value }))
                  }
                  placeholder="Введите действие"
                  fieldName="action"
                  attachments={newStepActionAttachments}
                  onAttachmentsChange={setNewStepActionAttachments}
                  entityType="teststep"
                  projectId={projectId}
                  showAttachments={true}
                  maxLength={1000}
                  showCharCount={false}
                />
              </div>
              <div className="space-y-2">
                <Label>Ожидаемый результат</Label>
                <TextareaWithAttachments
                  variant="glass"
                  value={newStep.expectedResult}
                  onChange={(value) =>
                    setNewStep((prev) => ({ ...prev, expectedResult: value }))
                  }
                  placeholder="Введите ожидаемый результат"
                  fieldName="expectedResult"
                  attachments={newStepExpectedResultAttachments}
                  onAttachmentsChange={setNewStepExpectedResultAttachments}
                  entityType="teststep"
                  projectId={projectId}
                  showAttachments={true}
                  maxLength={1000}
                  showCharCount={false}
                />
              </div>
              <div className="flex justify-end">
                <ButtonPrimary
                  size="sm"
                  onClick={handleAddStep}
                  className="cursor-pointer"
                  type="button"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Добавить шаг
                </ButtonPrimary>
              </div>
            </div>
          </div>
      ),
    },
  ];

  const uploadPendingAttachments = async (): Promise<Array<{ id?: string; s3Key: string; fileName: string; mimeType: string; fieldName?: string }>> => {
    const pendingAttachments = commonAttachments.filter((att) => att.id.startsWith('pending-'));

    if (pendingAttachments.length === 0) {
      return [];
    }

    const uploadedAttachments: Array<{ id?: string; s3Key: string; fileName: string; mimeType: string; fieldName?: string }> = [];

    for (const attachment of pendingAttachments) {
      // @ts-expect-error - Access the pending file object
      const file = attachment._pendingFile;
      if (!file) continue;

      try {
        const result = await uploadFileToS3({
          file,
          fieldName: attachment.fieldName || 'attachment',
          entityType: 'testcase',
          projectId,
          onProgress: () => {},
        });

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        if (result.attachment) {
          uploadedAttachments.push({
            id: result.attachment.id,
            s3Key: result.attachment.filename,
            fileName: file.name,
            mimeType: file.type,
            fieldName: attachment.fieldName,
          });
        }
      } catch (error) {
        console.error('Failed to upload attachment:', error);
        throw error;
      }
    }

    return uploadedAttachments;
  };

  const uploadPendingStepAttachments = async (): Promise<Array<{ stepNumber: number; id?: string; s3Key: string; fileName: string; mimeType: string; fieldName: string }>> => {
    const uploadedStepAttachments: Array<{ stepNumber: number; id?: string; s3Key: string; fileName: string; mimeType: string; fieldName: string }> = [];

    // Collect ALL step attachments including steps that will be added
    const allStepsWithAttachments = [
      ...steps,
      // Include pending new step if it has content
      ...(newStep.action.trim().length > 0 || newStep.expectedResult.trim().length > 0
        ? [{ stepNumber: steps.length + 1, action: newStep.action, expectedResult: newStep.expectedResult }]
        : []),
    ];

    // Upload all pending step attachments
    for (const step of allStepsWithAttachments) {
      const stepKey = String(step.stepNumber);
      const stepAtts = stepAttachments[stepKey];

      if (!stepAtts) {
        // If no attachments for this step in state, check if it's the new step
        if (step.stepNumber === steps.length + 1) {
          // This is the new step - upload from newStepActionAttachments and newStepExpectedResultAttachments
          const newStepAttachmentsList = [
            ...newStepActionAttachments.filter((att) => att.id.startsWith('pending-')).map((att) => ({ ...att, fieldName: 'action' })),
            ...newStepExpectedResultAttachments.filter((att) => att.id.startsWith('pending-')).map((att) => ({ ...att, fieldName: 'expectedResult' })),
          ];

          for (const attachment of newStepAttachmentsList) {
            // @ts-expect-error - Access the pending file object
            const file = attachment._pendingFile;
            if (!file) continue;

            try {
              const result = await uploadFileToS3({
                file,
                fieldName: (attachment as any).fieldName,
                entityType: 'teststep',
                projectId,
                onProgress: () => {},
              });

              if (!result.success) {
                throw new Error(result.error || 'Upload failed');
              }

              if (result.attachment) {
                uploadedStepAttachments.push({
                  stepNumber: step.stepNumber,
                  id: result.attachment.id,
                  s3Key: result.attachment.filename,
                  fileName: file.name,
                  mimeType: file.type,
                  fieldName: (attachment as any).fieldName,
                });
              }
            } catch (error) {
              console.error('Failed to upload new step attachment:', error);
              throw error;
            }
          }
        }
        continue;
      }

      // Process existing steps from state
      for (const fieldName of ['action' as const, 'expectedResult' as const]) {
        const fieldAttachments = stepAtts[fieldName] || [];
        const pendingFieldAttachments = fieldAttachments.filter((att) => att.id.startsWith('pending-'));

        for (const attachment of pendingFieldAttachments) {
          // @ts-expect-error - Access the pending file object
          const file = attachment._pendingFile;
          if (!file) continue;

          try {
            const result = await uploadFileToS3({
              file,
              fieldName,
              entityType: 'teststep',
              projectId,
              onProgress: () => {},
            });

            if (!result.success) {
              throw new Error(result.error || 'Upload failed');
            }

            if (result.attachment) {
              uploadedStepAttachments.push({
                stepNumber: step.stepNumber,
                id: result.attachment.id,
                s3Key: result.attachment.filename,
                fileName: file.name,
                mimeType: file.type,
                fieldName,
              });
            }
          } catch (error) {
            console.error('Failed to upload step attachment:', error);
            throw error;
          }
        }
      }
    }

    return uploadedStepAttachments;
  };

  const handleSubmit = async (formData: Record<string, string>) => {
    // Upload all pending attachments first
    const uploadedAttachments = await uploadPendingAttachments();
    const uploadedStepAttachments = await uploadPendingStepAttachments();

    const estimatedTime = formData.estimatedTime ? parseInt(formData.estimatedTime) : undefined;

    // Build full list of steps including any unsaved step currently in the editor
    const pendingStepHasContent =
      newStep.action.trim().length > 0 || newStep.expectedResult.trim().length > 0;

    const allStepsForSubmit = pendingStepHasContent
      ? [
          ...steps,
          {
            stepNumber: steps.length + 1,
            action: newStep.action,
            expectedResult: newStep.expectedResult,
          },
        ]
      : steps;

    // Clean and normalize steps before sending to API
    const cleanedSteps = allStepsForSubmit
      .map((step, index) => ({
        stepNumber: index + 1,
        action: step.action.trim(),
        expectedResult: step.expectedResult.trim(),
      }))
      .filter((step) => step.action.length > 0 || step.expectedResult.length > 0);

    const response = await fetch(`/api/projects/${projectId}/testcases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description || undefined,
        testData: formData.testData || undefined,
        priority: formData.priority,
        status: formData.status,
        estimatedTime,
        preconditions: formData.preconditions || undefined,
        postconditions: formData.postconditions || undefined,
        moduleId: formData.moduleId !== 'none' ? formData.moduleId : undefined,
        steps: cleanedSteps.length > 0 ? cleanedSteps : undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to create test case');
    }

    const createdTestCase = data.data;

    // Associate uploaded attachments with the test case
    if (uploadedAttachments.length > 0) {
      try {
        const attachmentResponse = await fetch(`/api/projects/${projectId}/testcases/${createdTestCase.id}/attachments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attachments: uploadedAttachments }),
        });

        if (!attachmentResponse.ok) {
          const errorData = await attachmentResponse.json();
          console.error('Failed to associate attachments:', errorData);
          throw new Error('Не удалось прикрепить вложения к тест-кейсу');
        }

        await attachmentResponse.json();
      } catch (error) {
        console.error('Error associating attachments:', error);
        throw new Error('Тест-кейс создан, но вложения не сохранились.');
      }
    }

    // Link step attachments to created steps
    if (uploadedStepAttachments.length > 0 && createdTestCase.steps) {
      try {
        // Create a mapping of step numbers to step IDs
        const stepNumberToId: Record<number, string> = {};
        createdTestCase.steps.forEach((step: TestStep) => {
          if (step.id) {
            stepNumberToId[step.stepNumber] = step.id;
          }
        });

        // Group attachments by step ID
        const attachmentsByStepId: Record<string, Array<{ id: string; fieldName: string }>> = {};

        uploadedStepAttachments.forEach((att) => {
          const stepId = stepNumberToId[att.stepNumber];
          if (stepId) {
            if (!attachmentsByStepId[stepId]) {
              attachmentsByStepId[stepId] = [];
            }
            attachmentsByStepId[stepId].push({
              id: att.id!,
              fieldName: att.fieldName,
            });
          }
        });

        // Link attachments to each step
        for (const stepId of Object.keys(attachmentsByStepId)) {
          try {
            await fetch(`/api/teststeps/${stepId}/attachments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ attachments: attachmentsByStepId[stepId] }),
            });
          } catch (error) {
            console.error(`Error linking attachments to step ${stepId}:`, error);
          }
        }
      } catch (error) {
        console.warn('Failed to link step attachments:', error);
      }
    }

    return createdTestCase;
  };

  const config: BaseDialogConfig<TestCase> = {
    title: 'Создать тест-кейс',
    description: 'Новый тест-кейс в этом проекте. Заполните поля ниже.',
    fields,
    submitLabel: 'Создать тест-кейс',
    cancelLabel: 'Отмена',
    triggerOpen: open !== undefined ? open : triggerOpen,
    onOpenChange: (isOpen) => {
      if (!isOpen) {
        setAttachmentModalOpen(false);
        setCommonAttachments([]);
        setStepAttachments({});
        setNewStepActionAttachments([]);
        setNewStepExpectedResultAttachments([]);
      }
      onOpenChange?.(isOpen);
    },
    onSubmit: handleSubmit,
    projectId,
    onSuccess: (testCase) => {
      if (testCase) {
        onTestCaseCreated(testCase);
        // Clear all attachments after successful creation
        attachmentStorage.clearAllAttachments();
        attachmentStorage.clearContext();
        setCommonAttachments([]);
        setStepAttachments({});
        setNewStepActionAttachments([]);
        setNewStepExpectedResultAttachments([]);
      }
    },
    // moduleId is context-dependent (driven by which folder the user is in).
    // Exclude it from sessionStorage so it always reflects the current defaultModuleId prop.
    resetFieldsOnOpen: ['moduleId'],
    submitButtonName: 'Create Test Case Dialog - Create Test Case',
    cancelButtonName: 'Create Test Case Dialog - Cancel',
  };

  const handleAddStep = () => {
    const trimmedAction = newStep.action.trim();
    const trimmedExpectedResult = newStep.expectedResult.trim();

    if (!trimmedAction && !trimmedExpectedResult) {
      return;
    }

    const nextStepNumber = steps.length + 1;

    setSteps((prev) => [
      ...prev,
      {
        stepNumber: nextStepNumber,
        action: trimmedAction,
        expectedResult: trimmedExpectedResult,
      } as TestStep,
    ]);

    // Always store the step attachment structure, even if attachments are empty
    // IMPORTANT: Create copies of arrays to avoid reference issues
    setStepAttachments(prev => ({
      ...prev,
      [String(nextStepNumber)]: {
        action: [...newStepActionAttachments],
        expectedResult: [...newStepExpectedResultAttachments]
      }
    }));

    // Clear the form and attachments
    setNewStep({ action: '', expectedResult: '' });
    setNewStepActionAttachments([]);
    setNewStepExpectedResultAttachments([]);
  };

  const handleRemoveStep = (stepNumber: number) => {
    setSteps((prev) => {
      const filtered = prev.filter((step) => step.stepNumber !== stepNumber);
      const renumbered: TestStep[] = filtered.map((step, index) => ({
        ...step,
        stepNumber: index + 1,
      }));

      // Update attachments mapping with new step numbers
      const currentStepAttachments = { ...stepAttachments };
      delete currentStepAttachments[String(stepNumber)];

      // Renumber attachments for remaining steps
      const renumberedAttachments: Record<string, Record<string, Attachment[]>> = {};
      Object.keys(currentStepAttachments).forEach(oldStepNum => {
        const oldNum = parseInt(oldStepNum);
        if (oldNum > stepNumber) {
          renumberedAttachments[String(oldNum - 1)] = currentStepAttachments[oldStepNum];
        } else {
          renumberedAttachments[String(oldNum)] = currentStepAttachments[oldStepNum];
        }
      });

      setStepAttachments(renumberedAttachments);
      return renumbered;
    });
  };

  const handleStepChange = (
    stepNumber: number,
    field: 'action' | 'expectedResult',
    value: string,
  ) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.stepNumber === stepNumber ? { ...step, [field]: value } : step,
      ),
    );
  };

  return <BaseDialog {...config} />;
}

export type { CreateTestCaseDialogProps };
