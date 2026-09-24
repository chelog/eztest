'use client';

import { Paperclip, Plus } from 'lucide-react';
import type { Attachment } from '@/lib/s3';

interface DialogAttachmentsListProps {
  attachments: Attachment[];
  onAddClick: () => void;
}

/** Compact attachments block for create dialogs: file list + a single "attach" row. */
export function DialogAttachmentsList({ attachments, onAddClick }: DialogAttachmentsListProps) {
  return (
    <div className="space-y-1.5">
      {attachments.length > 0 && (
        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-2 rounded-[10px] bg-white/[0.04] px-3 py-2 text-sm text-white/80">
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-white/40" />
              <span className="flex-1 truncate">{att.originalName}</span>
              {att.size && <span className="shrink-0 text-xs text-white/40">{(att.size / 1024).toFixed(1)} КБ</span>}
              {att.id.startsWith('pending-') && (
                <span className="shrink-0 rounded px-1.5 py-0.5 text-xs bg-yellow-500/15 text-yellow-300">Ожидает</span>
              )}
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onAddClick}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-white/15 text-sm text-white/55 transition-colors hover:border-white/30 hover:bg-white/[0.03] hover:text-white cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        {attachments.length > 0 ? 'Добавить ещё файлы' : 'Прикрепить файлы'}
      </button>
    </div>
  );
}
