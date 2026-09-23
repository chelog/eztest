/**
 * The project pinned in the sidebar, remembered per user across browser sessions.
 * Stored in localStorage; every access is guarded because storage can be unavailable.
 */

const keyFor = (userEmail: string) => `eztest-active-project:${userEmail}`;

export const ACTIVE_PROJECT_EVENT = 'eztest:active-project';

export function getActiveProjectId(userEmail: string | null | undefined): string | null {
  if (!userEmail || typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(keyFor(userEmail));
  } catch {
    return null;
  }
}

export function setActiveProjectId(userEmail: string | null | undefined, projectId: string | null) {
  if (!userEmail || typeof window === 'undefined') return;
  try {
    if (projectId) {
      localStorage.setItem(keyFor(userEmail), projectId);
      sessionStorage.setItem('lastProjectId', projectId);
    } else {
      localStorage.removeItem(keyFor(userEmail));
      sessionStorage.removeItem('lastProjectId');
    }
  } catch {
    // storage unavailable — the choice just won't persist
  }
  window.dispatchEvent(new CustomEvent(ACTIVE_PROJECT_EVENT, { detail: projectId }));
}
