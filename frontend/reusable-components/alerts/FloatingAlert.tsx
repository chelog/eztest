'use client';

import { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface FloatingAlertMessage {
  type: 'success' | 'error';
  title: string;
  message: string;
  /** Optional button in the alert, e.g. "Отменить" after a move */
  action?: { label: string; onClick: () => void };
}

interface FloatingAlertProps {
  alert: FloatingAlertMessage | null;
  onClose: () => void;
}

const AUTO_DISMISS_MS = 5000;
// Alerts with an action (undo) stay a bit longer so there is time to press it
const AUTO_DISMISS_WITH_ACTION_MS = 10000;

export const FloatingAlert = ({ alert, onClose }: FloatingAlertProps) => {
  // Callers pass inline handlers; keep the latest one without restarting the timer on every render
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Success messages auto-dismiss; errors stay until closed so they can be read.
  // A new alert object restarts the timer.
  const autoDismiss = alert?.type === 'success';
  const dismissMs = alert?.action ? AUTO_DISMISS_WITH_ACTION_MS : AUTO_DISMISS_MS;
  useEffect(() => {
    if (!alert || !autoDismiss) return;
    const timer = setTimeout(() => onCloseRef.current(), dismissMs);
    return () => clearTimeout(timer);
  }, [alert, autoDismiss, dismissMs]);

  if (!alert) return null;

  const isSuccess = alert.type === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;
  const tone = isSuccess
    ? { color: '#34d399', soft: 'rgba(52,211,153,0.14)', tint: 'rgba(52,211,153,0.08)' }
    : { color: '#f0625b', soft: 'rgba(240,98,91,0.14)', tint: 'rgba(240,98,91,0.09)' };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 right-4 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        width: 'min(380px, calc(100vw - 2rem))',
        borderRadius: 14,
        background: `linear-gradient(90deg, ${tone.tint}, transparent 45%), #1b1b1c`,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 50px -15px rgba(0,0,0,0.85)',
      }}
    >
      <div className="flex items-center" style={{ gap: 12, padding: 14 }}>
        <span
          className="flex shrink-0 items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: 10, background: tone.soft, color: tone.color }}
        >
          <Icon style={{ width: 18, height: 18 }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white" style={{ lineHeight: '20px' }}>
            {alert.title}
          </div>
          {alert.message && (
            <div className="text-white/60" style={{ fontSize: 13, lineHeight: '18px' }}>
              {alert.message}
            </div>
          )}
        </div>
        {alert.action && (
          <button
            type="button"
            onClick={() => {
              alert.action?.onClick();
              onClose();
            }}
            className="shrink-0 rounded-[8px] bg-white/[0.08] px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.14] cursor-pointer"
          >
            {alert.action.label}
          </button>
        )}
        <button
          onClick={onClose}
          className="flex shrink-0 items-center justify-center text-white/35 transition-colors hover:text-white hover:bg-white/[0.06]"
          style={{ width: 28, height: 28, borderRadius: 8 }}
          aria-label="Закрыть"
        >
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>
      {/* Auto-dismiss timer, pinned to the bottom edge (success only) */}
      {autoDismiss && <div
        key={`${alert.title}-${alert.message}`}
        className="absolute bottom-0 left-0 right-0 origin-left"
        style={{ height: 2, background: tone.color, opacity: 0.7, animation: `nt-toast-timer ${dismissMs}ms linear forwards` }}
      />}
    </div>
  );
};
