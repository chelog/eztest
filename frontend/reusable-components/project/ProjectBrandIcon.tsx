import { cn } from '@/lib/utils';
import { getProjectBrand } from '@/lib/project-brand';

const SIZES = {
  sm: { tile: 'h-5 w-5 rounded-[6px]', image: 'h-3.5 w-3.5' },
  md: { tile: 'h-6 w-6 rounded-[7px]', image: 'h-4 w-4' },
  lg: { tile: 'h-10 w-10 rounded-[11px]', image: 'h-6 w-6' },
} as const;

interface ProjectBrandIconProps {
  projectKey: string | null | undefined;
  size?: keyof typeof SIZES;
  className?: string;
}

/**
 * Square brand mark of a known project (GTA5RP, Majestic RP).
 * Renders nothing for other projects, so callers can fall back to the key badge.
 */
export function ProjectBrandIcon({ projectKey, size = 'md', className }: ProjectBrandIconProps) {
  const brand = getProjectBrand(projectKey);
  if (!brand) return null;
  const s = SIZES[size];
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center bg-white/[0.07]', s.tile, className)}
      title={brand.alt}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={brand.mark} alt={brand.alt} className={cn('object-contain', s.image)} />
    </span>
  );
}
