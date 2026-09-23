'use client';

import Link from 'next/link';
import { Button } from '@/frontend/reusable-elements/buttons/Button';
import { ButtonPrimary } from '@/frontend/reusable-elements/buttons/ButtonPrimary';
import { GlassPanel } from '@/frontend/reusable-components/layout/GlassPanel';
import { Loader } from '@/frontend/reusable-elements/loaders/Loader';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { AlertTriangle } from 'lucide-react';

function ErrorDetails() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Неверный email или пароль. Попробуйте ещё раз.';
      case 'SessionRequired':
        return 'Чтобы открыть страницу, войдите в систему.';
      default:
        return 'Ошибка авторизации. Попробуйте ещё раз.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
    <div className="w-full max-w-md">
  <GlassPanel contentClassName="p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Ошибка авторизации</h1>
            <p className="text-muted-foreground mt-2">{getErrorMessage()}</p>
          </div>

          <div className="space-y-4">
            <Link href="/auth/login" className="w-full">
              <ButtonPrimary className="w-full rounded-[10px]">
                Ко входу
              </ButtonPrimary>
            </Link>
            <Link href="/auth/register" className="w-full">
              <Button variant="glass" className="w-full rounded-[10px]">
                Создать аккаунт
              </Button>
            </Link>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

export default function ErrorContent() {
  return (
    <Suspense fallback={<Loader fullScreen />}>
      <ErrorDetails />
    </Suspense>
  );
}

