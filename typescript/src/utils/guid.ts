/**
 * GUID Utility
 * Provides UUID v4 generation using the Web Crypto API
 */

/**
 * Generate a UUID v4 string using crypto.randomUUID()
 * @returns A UUID v4 string in the format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * @throws Error if crypto.randomUUID() is not available
 */
export function generateGuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID
  // This maintains UUID v4 format but is not cryptographically secure
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
