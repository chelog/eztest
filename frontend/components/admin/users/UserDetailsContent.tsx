'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DetailCard } from '@/frontend/reusable-components/cards/DetailCard';
import { Loader } from '@/frontend/reusable-elements/loaders/Loader';
import { formatDateTime } from '@/lib/date-utils';
import { Navbar } from '@/frontend/reusable-components/layout/Navbar';
import { Breadcrumbs } from '@/frontend/reusable-components/layout/Breadcrumbs';
import { Mail } from 'lucide-react';
import { getRoleLabel, getRoleTextColor } from '@/lib/role-labels';
import { getAvatarColor } from '@/lib/avatar-color';

interface UserRole {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    createdProjects: number;
  };
}

interface UserDetailsContentProps {
  userId: string;
}

export default function UserDetailsContent({ userId }: UserDetailsContentProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const navbarActions = useMemo(() => {
    return [
      {
        type: 'signout' as const,
        showConfirmation: true,
      },
    ];
  }, []);

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();

      if (response.ok && data.data) {
        setUser(data.data);
      } else {
        router.push('/admin/users');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text="Загрузка данных пользователя..." />;
  }

  if (!user) {
    return null;
  }

  const facts = [
    { label: 'Email', value: user.email },
    { label: 'Роль', value: getRoleLabel(user.role.name) },
    { label: 'Создано проектов', value: String(user._count.createdProjects) },
    { label: 'В системе с', value: formatDateTime(user.createdAt) },
    { label: 'Последнее обновление', value: formatDateTime(user.updatedAt) },
  ];

  return (
    <div className="flex-1">
      <Navbar
        brandLabel={null}
        items={[]}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Админка', href: '/admin' },
              { label: 'Пользователи', href: '/admin/users' },
              { label: user.name, href: `/admin/users/${user.id}` },
            ]}
          />
        }
        actions={navbarActions}
      />

      <div className="max-w-4xl mx-auto px-8 pt-2 pb-8">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center text-xl font-bold text-white"
            style={{ backgroundColor: getAvatarColor(user.email || user.name) }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-white truncate">{user.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/55">
              <span className={`font-semibold ${getRoleTextColor(user.role.name)}`}>{getRoleLabel(user.role.name)}</span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </span>
            </div>
          </div>
        </div>

        <DetailCard title="Данные пользователя" contentClassName="p-0">
          <dl className="divide-y divide-white/[0.06]">
            {facts.map((fact) => (
              <div key={fact.label} className="flex items-center justify-between gap-6 py-3">
                <dt className="text-sm text-white/50">{fact.label}</dt>
                <dd className="text-sm font-semibold text-white text-right truncate">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </DetailCard>
      </div>
    </div>
  );
}
