/**
 * Brand marks for known projects, matched by project key.
 * Shown as a square icon on the title line instead of the key badge;
 * projects without an entry keep the regular key badge.
 */
export interface ProjectBrand {
  /** Square-ish brand mark (icon), cut from the full logo */
  mark: string;
  alt: string;
}

const PROJECT_BRANDS: Record<string, ProjectBrand> = {
  '5RP': { mark: '/brands/gta5rp-mark.png', alt: 'GTA5RP' },
  MAJESTIC: { mark: '/brands/majestic-mark.svg', alt: 'Majestic RP' },
};

export function getProjectBrand(projectKey: string | null | undefined): ProjectBrand | null {
  return projectKey ? PROJECT_BRANDS[projectKey.trim().toUpperCase()] ?? null : null;
}
