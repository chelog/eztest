/** Russian display names of system roles (role.name stays the English key in the DB). */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Администратор',
  PROJECT_MANAGER: 'Менеджер проекта',
  TESTER: 'Тестировщик',
  VIEWER: 'Наблюдатель',
};

export function getRoleLabel(roleName: string | null | undefined): string {
  if (!roleName) return '';
  return ROLE_LABELS[roleName] ?? roleName;
}

/** Text color of a role label (Tailwind classes) */
export const ROLE_TEXT_COLORS: Record<string, string> = {
  ADMIN: 'text-red-400',
  PROJECT_MANAGER: 'text-sky-400',
  TESTER: 'text-emerald-400',
  VIEWER: 'text-white/50',
};

export function getRoleTextColor(roleName: string | null | undefined): string {
  return ROLE_TEXT_COLORS[roleName ?? ''] ?? 'text-white/60';
}
