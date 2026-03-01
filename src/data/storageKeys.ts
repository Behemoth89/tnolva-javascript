/**
 * Storage Keys
 * Centralized storage key constants with namespace prefix
 */

/** Namespace prefix for all storage keys */
export const STORAGE_NAMESPACE = 'tasky_';

/** Storage key for tasks collection */
export const STORAGE_KEY_TASKS = `${STORAGE_NAMESPACE}tasks`;

/** Storage key for task relationships */
export const STORAGE_KEY_TASK_RELATIONSHIPS = `${STORAGE_NAMESPACE}task_relationships`;

/** Storage key for categories collection */
export const STORAGE_KEY_CATEGORIES = `${STORAGE_NAMESPACE}categories`;

/** Storage key for task-category assignments (junction table) */
export const STORAGE_KEY_CATEGORY_ASSIGNMENTS = `${STORAGE_NAMESPACE}category_assignments`;

/** Storage key for recurrence templates */
export const STORAGE_KEY_RECURRENCE_TEMPLATES = `${STORAGE_NAMESPACE}recurrence_templates`;

/** Storage key for recurring tasks */
export const STORAGE_KEY_RECURRING_TASKS = `${STORAGE_NAMESPACE}recurring_tasks`;

/** Storage key for task-recurring link junction table */
export const STORAGE_KEY_TASK_RECURRING_LINKS = `${STORAGE_NAMESPACE}task_recurring_links`;

/** Get namespaced key */
export function getNamespacedKey(key: string): string {
  return `${STORAGE_NAMESPACE}${key}`;
}
