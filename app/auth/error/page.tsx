import type { Metadata } from 'next';
import ErrorContent from './ErrorContent';

export const metadata: Metadata = {
  title: 'Ошибка авторизации',
  description: 'Ошибка авторизации. Попробуйте войти ещё раз.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthErrorPage() {
  return <ErrorContent />;
}
