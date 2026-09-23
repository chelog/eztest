'use client';

import * as React from 'react';
import { LucideIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InfoBannerProps {
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  icon?: LucideIcon;
  className?: string;
}

const variantStyles = {
  info: {
    container: 'border-blue-500/30 bg-blue-500/10',
    icon: 'text-blue-300',
    text: 'text-blue-200/90',
  },
  success: {
    container: 'border-green-500/30 bg-green-500/10',
    icon: 'text-green-300',
    text: 'text-green-200/90',
  },
  warning: {
    container: 'border-yellow-500/30 bg-yellow-500/10',
    icon: 'text-yellow-300',
    text: 'text-yellow-200/90',
  },
  error: {
    container: 'border-red-500/30 bg-red-500/10',
    icon: 'text-red-300',
    text: 'text-red-200/90',
  },
};

export function InfoBanner({ 
  message, 
  variant = 'info', 
  icon: Icon = Info,
  className 
}: InfoBannerProps) {
  const styles = variantStyles[variant];

  return (
    <div data-ui="info-banner" className={cn(
      'rounded-lg border p-4',
      styles.container,
      className
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', styles.icon)} />
        <p className={cn('text-sm', styles.text)}>
          {message}
        </p>
      </div>
    </div>
  );
}

