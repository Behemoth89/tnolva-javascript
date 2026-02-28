import type { IEntityId } from './IEntityId.js';

/**
 * IBaseEntity Interface
 * Base interface for all entities with timestamp fields
 * Extends IEntityId to include the id property
 */
export interface IBaseEntity extends IEntityId {
  /** Creation timestamp in ISO 8601 format */
  createdAt: string;
  /** Last update timestamp in ISO 8601 format */
  updatedAt: string;
}
