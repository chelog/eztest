/**
 * Custom logos for known projects, matched by project key.
 * Projects without an entry keep the regular key badge.
 */
export interface ProjectBrand {
  logo: string;
  alt: string;
  /** Logo height in px on project cards (the images have different padding) */
  height: number;
  /** width / height of the image file */
  aspect: number;
  /** Vertical shift so the lettering sits on the title's center line (GTA5RP has a star above the text) */
  offsetY?: number;
}

const PROJECT_BRANDS: Record<string, ProjectBrand> = {
  '5RP': { logo: '/brands/gta5rp.png', alt: 'GTA5RP', height: 36, aspect: 241 / 76, offsetY: -9 },
  MAJESTIC: { logo: '/brands/majestic.svg', alt: 'Majestic RP', height: 19, aspect: 120 / 32, offsetY: 2 },
};

export function getProjectBrand(projectKey: string | null | undefined): ProjectBrand | null {
  return projectKey ? PROJECT_BRANDS[projectKey.trim().toUpperCase()] ?? null : null;
}
