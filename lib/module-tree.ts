/**
 * Helpers for the folder (folder) tree. Folders reference their parent via `parentId`;
 * a missing or unknown parent means top level.
 */

export interface TreeModule {
  id: string;
  name: string;
  parentId?: string | null;
  order?: number;
}

export const MODULE_PATH_SEPARATOR = ' / ';

function byOrderThenName(a: TreeModule, b: TreeModule) {
  return (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, 'ru');
}

/** Parent id if that parent exists in the list, otherwise null (top level) */
export function effectiveParentId<T extends TreeModule>(folder: T, byId: Map<string, T>): string | null {
  return folder.parentId && byId.has(folder.parentId) && folder.parentId !== folder.id ? folder.parentId : null;
}

/** children lists keyed by parent id ('' = top level), each sorted */
export function groupChildren<T extends TreeModule>(modules: T[]): Map<string, T[]> {
  const byId = new Map(modules.map((m) => [m.id, m]));
  const children = new Map<string, T[]>();
  for (const folder of modules) {
    const key = effectiveParentId(folder, byId) ?? '';
    children.set(key, [...(children.get(key) ?? []), folder]);
  }
  for (const list of children.values()) list.sort(byOrderThenName);
  return children;
}

/** Tree order (parents before children) with depth, e.g. for pickers and selects */
export function flattenModuleTree<T extends TreeModule>(modules: T[]): Array<{ folder: T; depth: number }> {
  const children = groupChildren(modules);
  const result: Array<{ folder: T; depth: number }> = [];
  const visited = new Set<string>();
  const walk = (parentKey: string, depth: number) => {
    for (const folder of children.get(parentKey) ?? []) {
      if (visited.has(folder.id)) continue;
      visited.add(folder.id);
      result.push({ folder, depth });
      walk(folder.id, depth + 1);
    }
  };
  walk('', 0);
  return result;
}

/** Ancestors of a folder, top level first (the folder itself not included) */
export function getModuleAncestors<T extends TreeModule>(moduleId: string, modules: T[]): T[] {
  const byId = new Map(modules.map((m) => [m.id, m]));
  const ancestors: T[] = [];
  const seen = new Set([moduleId]);
  let current = byId.get(moduleId);
  while (current) {
    const parentId = effectiveParentId(current, byId);
    if (!parentId || seen.has(parentId)) break;
    seen.add(parentId);
    current = byId.get(parentId);
    if (current) ancestors.unshift(current);
  }
  return ancestors;
}

/** "Parent / Child / Folder" */
export function getModulePath<T extends TreeModule>(moduleId: string, modules: T[]): string {
  const folder = modules.find((m) => m.id === moduleId);
  if (!folder) return '';
  return [...getModuleAncestors(moduleId, modules), folder].map((m) => m.name).join(MODULE_PATH_SEPARATOR);
}

/** The folder and all folders nested in it */
export function getDescendantIds<T extends TreeModule>(moduleId: string, modules: T[]): Set<string> {
  const children = groupChildren(modules);
  const result = new Set<string>([moduleId]);
  const stack = [moduleId];
  while (stack.length) {
    for (const child of children.get(stack.pop()!) ?? []) {
      if (!result.has(child.id)) {
        result.add(child.id);
        stack.push(child.id);
      }
    }
  }
  return result;
}

/** Select options in tree order, labelled with the full path */
export function moduleSelectOptions<T extends TreeModule>(modules: T[]): Array<{ value: string; label: string }> {
  return flattenModuleTree(modules).map(({ folder }) => ({
    value: folder.id,
    label: getModulePath(folder.id, modules),
  }));
}
