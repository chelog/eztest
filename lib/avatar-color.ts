/**
 * Stable avatar color per person, independent of the UI theme/accent.
 * The same name always maps to the same muted color.
 */
const AVATAR_COLORS = ['#4f7fd9', '#8a6bd8', '#d0665c', '#2f9e7d', '#c98f35', '#c25f94', '#3e9fb5', '#6b8f3c'];

export function getAvatarColor(seed: string | null | undefined): string {
  const text = (seed ?? '').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
