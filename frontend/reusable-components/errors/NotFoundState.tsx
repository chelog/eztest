'use client';

import * as React from 'react';
import { LucideIcon, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotFoundStateProps {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  iconColor?: string;
  redirectingMessage?: string;
  showRedirecting?: boolean;
  className?: string;
}

export function NotFoundState({
  title = 'Не найдено',
  message = 'Запись не найдена или была удалена.',
  icon: Icon = Folder,
  iconColor = 'text-red-400',
  redirectingMessage = 'Redirecting...',
  showRedirecting = false,
  className,
}: NotFoundStateProps) {
  return (
    <div className={cn('flex-1 flex items-center justify-center min-h-[60vh]', className)}>
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-red-500/10 rounded-full border border-red-500/30">
            <Icon className={cn('w-12 h-12', iconColor)} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-white/70 mb-6">{message}</p>
        {showRedirecting && (
          <div className="flex items-center justify-center gap-2 text-sm text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span>{redirectingMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}

