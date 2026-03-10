/**
 * TemplateFrequencyBreakdown Interface
 * Distribution of templates by recurrence frequency
 */
export interface TemplateFrequencyBreakdown {
  /** Frequency type (e.g., 'daily', 'weekly', 'monthly', 'yearly') */
  frequency: string;
  /** Count of templates with this frequency */
  count: number;
}

/**
 * IRecurringTaskStatistics Interface
 * Provides statistics about recurring task patterns and templates
 */
export interface IRecurringTaskStatistics {
  /** Count of active recurrence templates */
  activeTemplates: number;
  /** Count of generated recurring tasks per template */
  generatedTasksPerTemplate: {
    templateId: string;
    templateName: string;
    taskCount: number;
  }[];
  /** Count of manually created tasks */
  manuallyCreatedTasks: number;
  /** Count of generated recurring tasks */
  generatedRecurringTasks: number;
  /** Distribution of templates by frequency */
  frequencyBreakdown: TemplateFrequencyBreakdown[];
}
