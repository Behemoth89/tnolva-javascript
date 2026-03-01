import type { IStorageAdapter } from '../adapters/IStorageAdapter.js';
import type { IRecurrenceTemplate } from '../../interfaces/IRecurrenceTemplate.js';
import { BaseRepository } from './BaseRepository.js';
import { RecurrenceTemplate } from '../../domain/RecurrenceTemplate.js';
import { STORAGE_KEY_TASKS, STORAGE_KEY_RECURRENCE_TEMPLATES } from '../storageKeys.js';
import { generateGuid } from '../../utils/index.js';

/**
 * Default recurrence templates
 */
const DEFAULT_TEMPLATES: IRecurrenceTemplate[] = [
  {
    id: 'default-daily',
    name: 'Daily',
    intervals: [{ value: 1, unit: 'days' }],
  },
  {
    id: 'default-weekly',
    name: 'Weekly',
    intervals: [{ value: 1, unit: 'weeks' }],
  },
  {
    id: 'default-biweekly',
    name: 'Bi-weekly',
    intervals: [{ value: 2, unit: 'weeks' }],
  },
  {
    id: 'default-monthly',
    name: 'Monthly',
    intervals: [{ value: 1, unit: 'months' }],
  },
  {
    id: 'default-quarterly',
    name: 'Quarterly',
    intervals: [{ value: 3, unit: 'months' }],
  },
  {
    id: 'default-yearly',
    name: 'Yearly',
    intervals: [{ value: 1, unit: 'years' }],
  },
  {
    id: 'default-first-monday',
    name: 'First Monday of month',
    intervals: [{ value: 1, unit: 'months' }],
    weekday: 1,
    occurrenceInMonth: 1,
  },
  {
    id: 'default-last-friday',
    name: 'Last Friday of month',
    intervals: [{ value: 1, unit: 'months' }],
    weekday: 5,
    occurrenceInMonth: -1,
  },
];

/**
 * RecurrenceTemplateRepository Class
 * Provides CRUD operations for recurrence templates
 */
export class RecurrenceTemplateRepository extends BaseRepository<RecurrenceTemplate> {
  private initialized: boolean = false;

  /**
   * Creates a new RecurrenceTemplateRepository instance
   * @param storage - Storage adapter
   */
  constructor(storage: IStorageAdapter) {
    super(storage, STORAGE_KEY_RECURRENCE_TEMPLATES);
  }

  /**
   * Get entity ID
   */
  protected getEntityId(entity: RecurrenceTemplate): string {
    return entity.id;
  }

  /**
   * Set entity ID
   */
  protected setEntityId(entity: RecurrenceTemplate, id: string): void {
    entity.id = id;
  }

  /**
   * Initialize repository with default templates if empty
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const templates = this.getAll();
    if (templates.length === 0) {
      // Create default templates
      for (const template of DEFAULT_TEMPLATES) {
        const entity = new RecurrenceTemplate({
          ...template,
          id: template.id || generateGuid(),
        });
        await this.createAsync(entity);
      }
    }
    this.initialized = true;
  }

  /**
   * Create a new recurrence template
   */
  async createAsync(template: IRecurrenceTemplate): Promise<RecurrenceTemplate> {
    const entity = new RecurrenceTemplate({
      ...template,
      id: template.id || generateGuid(),
    });
    return super.createAsync(entity);
  }

  /**
   * Update an existing recurrence template
   */
  async updateAsync(
    id: string,
    updates: Partial<IRecurrenceTemplate>
  ): Promise<RecurrenceTemplate | null> {
    const existing = await this.getByIdAsync(id);
    if (!existing) {
      return null;
    }

    const updated = new RecurrenceTemplate({
      ...existing.toObject(),
      ...updates,
      id: existing.id,
    });

    return super.updateAsync(id, updated);
  }

  /**
   * Delete a recurrence template
   * @param id - ID of template to delete
   * @returns true if deleted, false if not found
   * @throws Error if template is referenced by tasks
   */
  async deleteAsync(id: string): Promise<boolean> {
    const existing = await this.getByIdAsync(id);
    if (!existing) {
      return false;
    }

    // Check if any tasks reference this template
    const tasks = await this.storage.getItemAsync<{ recurrenceTemplateId?: string }[]>(STORAGE_KEY_TASKS);
    const isReferenced = tasks?.some((task) => task.recurrenceTemplateId === id);
    if (isReferenced) {
      throw new Error('Cannot delete recurrence template: it is referenced by existing tasks');
    }

    return super.deleteAsync(id);
  }

  /**
   * Get all templates
   */
  async getAllAsync(): Promise<RecurrenceTemplate[]> {
    const data = await this.storage.getItemAsync<IRecurrenceTemplate[]>(this.storageKey);
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((t) => new RecurrenceTemplate(t));
  }

  /**
   * Get template by ID
   */
  async getByIdAsync(id: string): Promise<RecurrenceTemplate | null> {
    const items = await this.getAllAsync();
    return items.find((t) => t.id === id) || null;
  }

  /**
   * Get all templates (synchronous - for backward compatibility)
   * @deprecated Use getAllAsync() instead
   */
  getAll(): RecurrenceTemplate[] {
    const data = this.storage.getItem<IRecurrenceTemplate[]>(this.storageKey);
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((t) => new RecurrenceTemplate(t));
  }

  /**
   * Get template by ID (synchronous - for backward compatibility)
   * @deprecated Use getByIdAsync() instead
   */
  getById(id: string): RecurrenceTemplate | null {
    const items = this.getAll();
    return items.find((t) => t.id === id) || null;
  }
}
