'use client';

import { useMemo } from 'react';
import { Navbar } from '@/frontend/reusable-components/layout/Navbar';
import { Breadcrumbs } from '@/frontend/reusable-components/layout/Breadcrumbs';
import { PageHeaderWithBadge } from '@/frontend/reusable-components/layout/PageHeaderWithBadge';
import { Project } from '../types';

interface SettingsHeaderProps {
  project: Project;
  projectId?: string;
}

export function SettingsHeader({ project, projectId }: SettingsHeaderProps) {
  const pid = projectId || project.id;

  const navbarActions = useMemo(() => [
    {
      type: 'signout' as const,
      showConfirmation: true,
    },
  ], []);

  return (
    <>
      {/* Navbar */}
      <Navbar
        brandLabel={null}
        items={[]}
        breadcrumbs={
          <Breadcrumbs 
            items={[
              { label: 'Проекты', href: '/projects' },
              { label: project.name, href: `/projects/${pid}` },
              { label: 'Настройки' },
            ]}
          />
        }
        actions={navbarActions}
      />

      <div className="px-8 pt-2">
        <div className="max-w-6xl mx-auto">
          <PageHeaderWithBadge
            badge={project.key}
            title="Настройки проекта"
            description={`Основные данные и управление проектом ${project.name}`}
            className="mb-6"
          />
        </div>
      </div>
    </>
  );
}
