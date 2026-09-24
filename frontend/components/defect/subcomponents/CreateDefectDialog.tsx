'use client';

import { BaseDialog, BaseDialogField, BaseDialogConfig } from '@/frontend/reusable-components/dialogs/BaseDialog';
import { useEffect, useState } from 'react';
import { SearchableSelect } from '@/frontend/reusable-elements/selects/SearchableSelect';
import { FloatingAlert, type FloatingAlertMessage } from '@/frontend/reusable-components/alerts/FloatingAlert';
import { type Attachment } from '@/lib/s3';
import { uploadFileToS3 } from '@/lib/s3';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { DialogAttachmentsList } from '@/frontend/reusable-components/attachments/DialogAttachmentsList';
import { FileUploadModal } from '@/frontend/reusable-components/uploads/FileUploadModal';

interface Defect {
  id: string;
  defectId: string;
  title: string;
}

interface CreateDefectDialogProps {
  projectId: string;
  open?: boolean;
  triggerOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDefectCreated: (defect: Defect) => void;
  // Context-specific props for auto-population
  testCaseId?: string; // When creating from test run with failed test case
  testRunEnvironment?: string; // When creating from test run, auto-populate environment
}

export function CreateDefectDialog({
  projectId,
  triggerOpen,
  onOpenChange,
  onDefectCreated,
  testCaseId,
  testRunEnvironment,
}: CreateDefectDialogProps) {
  const [alert, setAlert] = useState<FloatingAlertMessage | null>(null);
  const [assignees, setAssignees] = useState<Array<{ id: string; name: string }>>([]);
  const [testCases, setTestCases] = useState<Array<{ id: string; testCaseId: string; title: string }>>([]);
  const [commonAttachments, setCommonAttachments] = useState<Attachment[]>([]);
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);

  // Fetch dynamic dropdown options
  const { options: severityOptions } = useDropdownOptions('Defect', 'severity');
  const { options: priorityOptions } = useDropdownOptions('Defect', 'priority');
  const { options: environmentOptions } = useDropdownOptions('Defect', 'environment');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch assignees
        const assigneesResponse = await fetch(`/api/projects/${projectId}/members`);
        const assigneesData = await assigneesResponse.json();
        if (assigneesData.data) {
          setAssignees(
            assigneesData.data.map((member: { user: { id: string; name: string } }) => ({
              id: member.user.id,
              name: member.user.name,
            }))
          );
        }

        // Fetch test cases for the project
        const testCasesResponse = await fetch(`/api/projects/${projectId}/testcases`);
        const testCasesData = await testCasesResponse.json();
        
        if (testCasesData.data && Array.isArray(testCasesData.data)) {
          const mappedTestCases = testCasesData.data.map((tc: { id: string; tcId: string; title: string }) => ({
            id: tc.id,
            testCaseId: tc.tcId, // Use tcId from database
            title: tc.title,
          }));
          setTestCases(mappedTestCases);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [projectId]);

  // Convert test cases to SearchableSelect options (for searchable dropdown)
  const testCaseOptions = testCases.map(tc => ({
    id: tc.id,
    label: tc.testCaseId,
    subtitle: tc.title,
  }));

  const assigneeOptions = assignees.map((assignee) => ({
    value: assignee.id,
    label: assignee.name,
  }));

  // Map dropdown options to the format expected by BaseDialog
  const SEVERITY_OPTIONS = severityOptions.map(opt => ({ value: opt.value, label: opt.label }));
  const PRIORITY_OPTIONS = priorityOptions.map(opt => ({ value: opt.value, label: opt.label }));
  const ENVIRONMENT_OPTIONS = environmentOptions.map(opt => ({ value: opt.value, label: opt.label }));

  const fields: BaseDialogField[] = [
    {
      name: 'title',
      label: 'Название',
      placeholder: 'Введите название дефекта',
      type: 'text',
      required: true,
      minLength: 5,
      maxLength: 200,
      cols: 1,
    },
    // Test Case field - searchable select when from defect list, text input when from test run
    ...(testCaseId ? [{
      name: 'testCaseId',
      label: 'Тест-кейс (заполняется автоматически)',
      type: 'text' as const,
      defaultValue: testCaseId,
      readOnly: true,
      cols: 1,
      placeholder: testCases.find(tc => tc.id === testCaseId) 
        ? `${testCases.find(tc => tc.id === testCaseId)!.testCaseId} - ${testCases.find(tc => tc.id === testCaseId)!.title}`
        : 'Loading test case...',
    }] : [{
      name: 'testCaseId',
      label: 'Тест-кейс (необязательно)',
      type: 'custom' as const,
      cols: 1,
      customRender: (value: string, onChange: (value: string) => void) => (
        <SearchableSelect
          options={testCaseOptions}
          value={value}
          onValueChange={onChange}
          label=""
          id="testCaseSearch"
          searchPlaceholder="Search by TC-ID or title..."
          emptyMessage="Не найдено тест-кейсов по запросу"
          maxResults={10}
        />
      ),
    }]),
    {
      name: 'severity',
      label: 'Критичность',
      type: 'select',
      required: true,
      defaultValue: 'MEDIUM',
      options: SEVERITY_OPTIONS,
      cols: 1,
    },
    {
      name: 'priority',
      label: 'Приоритет',
      type: 'select',
      required: true,
      defaultValue: 'MEDIUM',
      options: PRIORITY_OPTIONS,
      cols: 1,
    },
    {
      name: 'assignedToId',
      label: 'Исполнитель',
      type: 'select',
      placeholder: 'Выберите исполнителя',
      options: assigneeOptions,
      cols: 1,
    },
    // Environment field - dropdown if from defect list, auto-populated if from test run
    {
      name: 'environment',
      label: testRunEnvironment ? 'Environment (Auto-populated)' : 'Environment',
      type: testRunEnvironment ? 'text' : 'select',
      placeholder: testRunEnvironment ? testRunEnvironment : 'Select environment',
      defaultValue: testRunEnvironment,
      options: testRunEnvironment ? undefined : ENVIRONMENT_OPTIONS,
      readOnly: !!testRunEnvironment,
      maxLength: 100,
      cols: 1,
    },
    {
      name: 'dueDate',
      label: 'Срок (необязательно)',
      type: 'date',
      cols: 1,
    },
    {
      name: 'progressPercentage',
      label: 'Прогресс, % (необязательно)',
      type: 'number',
      placeholder: '0-100',
      min: 0,
      max: 100,
      cols: 1,
    },
    {
      name: 'description',
      label: 'Описание',
      type: 'textarea',
      placeholder: 'Опишите дефект...',
      rows: 3,
      cols: 2,
      maxLength: 2000,
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
            entityType="defect"
            projectId={projectId}
            title="Вложения дефекта"
          />
        </>
      ),
    },
  ];

  const handleDialogOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

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
          entityType: 'defect',
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

  const config: BaseDialogConfig = {
    title: 'Новый дефект',
    description: 'Заполните поля нового дефекта. По умолчанию статус — «Новый».',
    fields,
    submitLabel: 'Создать дефект',
    cancelLabel: 'Отмена',
    triggerOpen,
    onOpenChange: handleDialogOpenChange,
    formPersistenceKey: `create-defect-${projectId}`,
    projectId,
    submitButtonName: 'Create Defect Dialog - Create Defect',
    cancelButtonName: 'Create Defect Dialog - Cancel',
    onSubmit: async (formData) => {
      // Upload pending attachments first
      const uploadedAttachments = await uploadPendingAttachments();

      // Get test case ID from prop (passed when creating from test run) or from form data (selected from dropdown)
      const finalTestCaseId = testCaseId || formData.testCaseId || null;
      
      const payload = {
        title: formData.title,
        description: formData.description || null,
        severity: formData.severity,
        priority: formData.priority,
        assignedToId: formData.assignedToId && formData.assignedToId.trim() !== '' ? formData.assignedToId : null,
        environment: formData.environment && formData.environment.trim() !== '' ? formData.environment : null,
        dueDate: formData.dueDate ? new Date(formData.dueDate as string).toISOString() : undefined,
        progressPercentage: formData.progressPercentage ? Number(formData.progressPercentage) : undefined,
        status: 'NEW', // Always start as NEW as per lifecycle requirements
        testCaseIds: finalTestCaseId ? [finalTestCaseId] : undefined, // Link test case during creation
      };

      const response = await fetch(`/api/projects/${projectId}/defects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create defect');
      }

      const createdDefect = data.data;

      // Link uploaded attachments to the defect
      if (uploadedAttachments.length > 0) {
        try {
          await fetch(`/api/projects/${projectId}/defects/${createdDefect.id}/attachments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attachments: uploadedAttachments }),
          });
        } catch (error) {
          console.error('Failed to link attachments:', error);
        }
      }

      return createdDefect;
    },
    onSuccess: (result) => {
      if (result) {
        const defect = result as Defect;
        setAlert({
          type: 'success',
          title: 'Дефект создан',
          message: `Defect ${defect.defectId} has been created successfully`,
        });
        // Reset attachments state
        setCommonAttachments([]);
        onDefectCreated(defect);
      }
    },
  };

  return (
    <>
      <BaseDialog {...config} />
      <FloatingAlert alert={alert} onClose={() => setAlert(null)} />
    </>
  );
}
