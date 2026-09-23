'use client';

import { useMemo } from 'react';
import { Navbar } from '@/frontend/reusable-components/layout/Navbar';
import { PageHeaderWithBadge } from '@/frontend/reusable-components/layout/PageHeaderWithBadge';
import Link from 'next/link';
import { ChevronRight, ListChecks, UsersRound } from 'lucide-react';

const ADMIN_SECTIONS = [
  {
    title: 'Пользователи',
    description: 'Учётные записи и роли',
    href: '/admin/users',
    icon: UsersRound,
  },
  {
    title: 'Выпадающие списки',
    description: 'Статусы, приоритеты и другие значения',
    href: '/admin/dropdown-options',
    icon: ListChecks,
  },
];

export default function AdminDashboard() {
  const navbarActions = useMemo(() => [
    {
      type: 'signout' as const,
      showConfirmation: true,
    },
  ], []);

  return (
    <div className="flex-1">
      {/* Navbar */}
      <Navbar
        brandLabel={null}
        items={[]}
        actions={navbarActions}
      />

      {/* Content */}
      <div className="px-8 pt-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <PageHeaderWithBadge
            title="Панель администратора"
            description="Управление пользователями приложения и контролем доступа"
            className="mb-6"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl">
            {ADMIN_SECTIONS.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="group flex items-center gap-4 rounded-[14px] bg-white/[0.04] hover:bg-white/[0.07] px-5 py-4 transition-colors"
              >
                <span className="w-11 h-11 shrink-0 rounded-[12px] bg-white/[0.06] flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-white/80" strokeWidth={1.75} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-base font-bold text-white">{section.title}</span>
                  <span className="block text-sm text-white/50 truncate">{section.description}</span>
                </span>
                <ChevronRight className="w-5 h-5 shrink-0 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
