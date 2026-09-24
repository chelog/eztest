'use client';

import { useState, useEffect, useRef } from 'react';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { ButtonSecondary } from '@/frontend/reusable-elements/buttons/ButtonSecondary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/reusable-elements/cards/Card';
import { Alert, AlertDescription } from '@/frontend/reusable-elements/alerts/Alert';
import { Loader2, Mail } from 'lucide-react';
import { useIsNewTheme } from '@/frontend/context/UiThemeContext';

interface OtpVerificationProps {
  email: string;
  type: 'login' | 'register';
  onVerified: () => void;
  onCancel: () => void;
}

export function OtpVerification({ email, type, onVerified, onCancel }: OtpVerificationProps) {
  const isNewTheme = useIsNewTheme();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setError('Код подтверждения истек. Запросите новый.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (value && index === 5 && newOtp.every((digit) => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Check if pasted data is 6 digits
    if (!/^\d{6}$/.test(pastedData)) {
      setError('Вставьте корректный 6-значный код');
      return;
    }

    const digits = pastedData.split('');
    setOtp(digits);
    inputRefs.current[5]?.focus();
    
    // Auto-submit
    handleVerify(pastedData);
  };

  const handleVerify = async (otpValue?: string) => {
    const otpCode = otpValue || otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Введите все 6 цифр');
      return;
    }

    setIsVerifying(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: otpCode,
          type,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('OTP verified successfully!');
        setTimeout(() => {
          onVerified();
        }, 500);
      } else {
        setError(data.message || 'Неверный код. Попробуйте ещё раз.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Не удалось проверить код. Попробуйте снова.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/otp/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          type,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Новый код отправлен на почту');
        setOtp(['', '', '', '', '', '']);
        setTimeLeft(600); // Reset timer
        setResendCooldown(60); // 1 minute cooldown
        setCanResend(false);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.message || 'Не удалось отправить код повторно');
      }
    } catch {
      setError('Не удалось отправить код повторно. Попробуйте снова.');
    } finally {
      setIsResending(false);
    }
  };

  const resendLabel = isResending
    ? 'Отправка...'
    : canResend
      ? 'Отправить код повторно'
      : `Отправить повторно через ${resendCooldown} с`;

  // New theme: rendered inside the auth screen (logo, pattern background come from it),
  // so no own page background or card here
  if (isNewTheme) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--nt-surface-2)]">
            <Mail className="h-5 w-5 text-[var(--nt-accent)]" />
          </span>
          <p className="text-sm text-[var(--nt-text-2)]">Мы отправили 6-значный код на</p>
          <p className="mt-0.5 break-all text-sm font-semibold text-white">{email}</p>
        </div>

        <div className="grid grid-cols-6 gap-2" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              aria-label={`Цифра ${index + 1}`}
              className="h-14 w-full rounded-[12px] border border-transparent bg-[var(--nt-surface-2)] text-center text-2xl font-bold text-white outline-none transition-colors focus:border-[var(--nt-border-strong)] disabled:opacity-50"
              disabled={isVerifying || timeLeft === 0}
            />
          ))}
        </div>

        <p className="text-center text-sm text-[var(--nt-text-3)]">
          {timeLeft > 0 ? (
            <>
              Код действует ещё{' '}
              <span className={`font-mono font-semibold tabular-nums ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
                {formatTime(timeLeft)}
              </span>
            </>
          ) : (
            <span className="text-red-400">Срок действия кода истёк — запросите новый</span>
          )}
        </p>

        {error && <div className="rounded-[12px] bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">{error}</div>}
        {success && (
          <div className="rounded-[12px] bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-300">{success}</div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isVerifying}
            className="h-12 rounded-[12px] bg-[var(--nt-surface-2)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--nt-surface-4)] disabled:opacity-50 cursor-pointer"
          >
            Назад
          </button>
          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={isVerifying || otp.some((digit) => !digit) || timeLeft === 0}
            className="flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[var(--nt-accent-deep)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--nt-accent)] hover:text-[var(--nt-on-accent)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
          >
            {isVerifying && <Loader2 className="h-4 w-4 animate-spin" />}
            {isVerifying ? 'Проверка...' : 'Подтвердить'}
          </button>
        </div>

        <p className="text-center text-sm text-[var(--nt-text-3)]">
          Не пришёл код?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || isResending}
            className={
              canResend && !isResending
                ? 'text-white transition-colors hover:text-[var(--nt-accent)] cursor-pointer'
                : 'cursor-not-allowed text-[var(--nt-text-3)]'
            }
          >
            {resendLabel}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card variant="glass">
          <CardHeader>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/[0.06] rounded-full mb-4">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-2xl mb-2">Подтвердите email</CardTitle>
              <CardDescription>
                Мы отправили 6-значный код на
                <br />
                <span className="text-primary font-medium">{email}</span>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* OTP Input */}
            <div>
              <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold bg-background/50 border border-border rounded-lg text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isVerifying || timeLeft === 0}
                  />
                ))}
              </div>

              {/* Timer */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Осталось времени:{' '}
                  <span className={`font-mono font-semibold ${timeLeft < 60 ? 'text-destructive' : 'text-primary'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </p>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-center">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="default" className="bg-green-500/10 border-green-500/20 text-green-400">
                <AlertDescription className="text-center">{success}</AlertDescription>
              </Alert>
            )}

            {/* Buttons */}
            <div className="flex justify-center gap-3">
              <ButtonPrimary
                onClick={() => handleVerify()}
                disabled={isVerifying || otp.some((digit) => !digit) || timeLeft === 0}
                className="w-auto px-8"
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Проверка...
                  </span>
                ) : (
                  'Подтвердить код'
                )}
              </ButtonPrimary>

              <ButtonSecondary onClick={onCancel} disabled={isVerifying} className="w-auto px-8">
                Отмена
              </ButtonSecondary>
            </div>

            {/* Resend */}
            <div className="text-center pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">Не получили код?</p>
              <button
                onClick={handleResend}
                disabled={!canResend || isResending}
                className={`text-sm font-medium transition-colors ${
                  canResend && !isResending
                    ? 'text-primary hover:text-primary/80 cursor-pointer'
                    : 'text-muted-foreground cursor-not-allowed opacity-50'
                }`}
              >
                {isResending
                  ? 'Отправка...'
                  : canResend
                    ? 'Отправить код повторно'
                    : `Повтор через ${resendCooldown}с`}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

