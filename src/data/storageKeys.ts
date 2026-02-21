/**
 * Storage Keys
 * Centralized storage key constants with namespace prefix
 */

/** Namespace prefix for all storage keys */
export const STORAGE_NAMESPACE = 'tnolva_';

/** Storage key for tasks collection */
export const STORAGE_KEY_TASKS = `${STORAGE_NAMESPACE}tasks`;

/** Storage key for task relationships */
export const STORAGE_KEY_TASK_RELATIONSHIPS = `${STORAGE_NAMESPACE}task_relationships`;

/** Get namespaced key */
export function getNamespacedKey(key: string): string {
  return `${STORAGE_NAMESPACE}${key}`;
}
