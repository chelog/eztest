import * as React from 'react';
import {
  Archive,
  Ban,
  CalendarClock,
  CheckCheck,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleSlash,
  CircleX,
  ChevronDown,
  ChevronsUp,
  ChevronUp,
  Equal,
  FlaskConical,
  Layers,
  Loader,
  Lock,
  OctagonAlert,
  PencilLine,
  RotateCcw,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Colored icon for well-known dropdown values (priority, severity, statuses, environments).
 * Shown next to options in selects so values can be told apart at a glance.
 * Unknown values (ids, custom options) get no marker.
 */
const OPTION_MARKERS: Record<string, { icon: LucideIcon; color: string }> = {
  // "All" choice of filters
  all: { icon: Layers, color: 'rgba(255,255,255,0.45)' },

  // Priority / severity
  CRITICAL: { icon: ChevronsUp, color: '#f0625b' },
  HIGH: { icon: ChevronUp, color: '#fb923c' },
  MEDIUM: { icon: Equal, color: '#fbbf24' },
  LOW: { icon: ChevronDown, color: '#60a5fa' },

  // Test case status
  ACTIVE: { icon: CircleCheck, color: '#34d399' },
  DRAFT: { icon: PencilLine, color: '#60a5fa' },
  DEPRECATED: { icon: Archive, color: 'rgba(255,255,255,0.45)' },

  // Defect status
  NEW: { icon: CircleDot, color: '#60a5fa' },
  IN_PROGRESS: { icon: Loader, color: '#a78bfa' },
  FIXED: { icon: Wrench, color: '#34d399' },
  TESTED: { icon: FlaskConical, color: '#fbbf24' },
  CLOSED: { icon: Lock, color: 'rgba(255,255,255,0.45)' },
  REOPENED: { icon: RotateCcw, color: '#fb923c' },

  // Test run status
  PLANNED: { icon: CalendarClock, color: '#60a5fa' },
  COMPLETED: { icon: CheckCheck, color: '#34d399' },
  CANCELLED: { icon: Ban, color: 'rgba(255,255,255,0.45)' },

  // Test result status
  PASSED: { icon: CircleCheck, color: '#34d399' },
  FAILED: { icon: CircleX, color: '#f0625b' },
  BLOCKED: { icon: OctagonAlert, color: '#fbbf24' },
  SKIPPED: { icon: CircleSlash, color: 'rgba(255,255,255,0.45)' },
  RETEST: { icon: RotateCcw, color: '#a78bfa' },
  NOT_RUN: { icon: CircleDashed, color: 'rgba(255,255,255,0.45)' },

  // Requirement status
  APPROVED: { icon: ShieldCheck, color: '#34d399' },
};

// Environments are shown as colored dots
const ENVIRONMENT_DOTS: Record<string, string> = {
  Production: '#f0625b',
  Staging: '#fb923c',
  QA: '#fbbf24',
  Development: '#60a5fa',
};

export function hasOptionMarker(value: string | undefined): boolean {
  return !!value && (value in OPTION_MARKERS || value in ENVIRONMENT_DOTS);
}

export function OptionMarker({ value, className }: { value: string | undefined; className?: string }) {
  if (!value) return null;

  const dot = ENVIRONMENT_DOTS[value];
  if (dot) {
    return (
      <span className={cn('inline-flex size-4 shrink-0 items-center justify-center', className)} aria-hidden="true">
        <span className="size-2 rounded-full" style={{ backgroundColor: dot }} />
      </span>
    );
  }

  const marker = OPTION_MARKERS[value];
  if (!marker) return null;
  const Icon = marker.icon;
  return <Icon className={cn('size-4 shrink-0', className)} style={{ color: marker.color }} aria-hidden="true" />;
}
