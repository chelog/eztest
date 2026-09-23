'use client';

import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { Card, CardContent } from '@/frontend/reusable-elements/cards/Card';

interface EmptyStateCardProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  /** Button name for analytics tracking (defaults to actionLabel if not provided) */
  actionButtonName?: string;
}

/**
 * Unified reusable empty state component for consistent empty states across the application
 * Used for: Test suites, test cases, test runs, projects, and other empty lists
 */
export function EmptyStateCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  actionButtonName,
}: EmptyStateCardProps) {
  return (
    <Card variant="glass" className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        {Icon && (
          <div className="w-14 h-14 rounded-[16px] bg-white/[0.05] flex items-center justify-center mb-4">
            <Icon className="w-6 h-6 text-white/45" />
          </div>
        )}
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        {description && (
          <p className="text-white/60 text-center max-w-sm mb-6">
            {description}
          </p>
        )}
        {actionLabel && onAction && (
          <ButtonPrimary 
            onClick={onAction}
            buttonName={actionButtonName || actionLabel}
          >
            {actionLabel}
          </ButtonPrimary>
        )}
      </CardContent>
    </Card>
  );
}

