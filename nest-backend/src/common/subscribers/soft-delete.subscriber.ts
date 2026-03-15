import { EntitySubscriberInterface, EventSubscriber } from 'typeorm';

/**
 * Soft Delete Subscriber
 *
 * This subscriber automatically handles soft delete filtering for all entities
 * that extend BaseEntity. It ensures that soft-deleted records are automatically
 * excluded from standard queries.
 *
 * TypeORM's @DeleteDateColumn decorator automatically handles the soft delete
 * filtering - this subscriber is for additional custom logic if needed.
 */
@EventSubscriber()
export class SoftDeleteSubscriber implements EntitySubscriberInterface<unknown> {
  /**
   * Called after entity is loaded from the database.
   * Use this to add custom logic after entities are loaded.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  afterLoad(_entity: unknown): void {
    // Custom logic after entity load can be added here
    // For example, adding computed properties based on deletedAt
  }
}
