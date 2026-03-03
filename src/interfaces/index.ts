/**
 * Interfaces Index
 * Exports all interfaces and types from a single file
 */

// Entity Interfaces
export type { IEntityId } from './entities/IEntityId.js';
export type { IBaseEntity } from './entities/IBaseEntity.js';
export type { ITaskEntity } from './entities/ITaskEntity.js';
export type { ITaskCategoryEntity } from './entities/ITaskCategoryEntity.js';
export type { ITaskCategoryAssignmentEntity } from './entities/ITaskCategoryAssignmentEntity.js';
export type { IInterval } from './entities/IInterval.js';
export type { IRecurrenceTemplateEntity } from './entities/IRecurrenceTemplateEntity.js';
export type { IRecurringTaskEntity } from './entities/IRecurringTaskEntity.js';
export type { ITaskRecurringLinkEntity } from './entities/ITaskRecurringLinkEntity.js';
export type { ITaskDependencyEntity } from './entities/ITaskDependencyEntity.js';
export type { ISubtaskTemplate } from './entities/ISubtaskTemplate.js';

// DTO Interfaces
export type { ITaskCreateDto } from './dtos/ITaskCreateDto.js';
export type { ITaskUpdateDto } from './dtos/ITaskUpdateDto.js';
export type { ITaskCategoryCreateDto } from './dtos/ITaskCategoryCreateDto.js';
export type { ITaskCategoryUpdateDto } from './dtos/ITaskCategoryUpdateDto.js';
export type { IRecurringTaskCreateDto } from './dtos/IRecurringTaskCreateDto.js';
export type { IRecurringTaskUpdateDto } from './dtos/IRecurringTaskUpdateDto.js';
export type { ITaskDependencyCreateDto } from './dtos/ITaskDependencyCreateDto.js';
export type { ISubtaskTemplateCreateDto } from './dtos/ISubtaskTemplateCreateDto.js';

// Repository Interfaces
export type { IRepository } from './repositories/IRepository.js';
export type { ITaskRepository } from './repositories/ITaskRepository.js';
export type { ICategoryRepository } from './repositories/ICategoryRepository.js';
export type { IRecurrenceTemplateRepository } from './repositories/IRecurrenceTemplateRepository.js';
export type { IRecurringTaskRepository } from './repositories/IRecurringTaskRepository.js';
export type { ITaskDependencyRepository } from './repositories/ITaskDependencyRepository.js';
export type { ITaskRecurringLinkRepository } from './repositories/ITaskRecurringLinkRepository.js';

// Unit of Work Interfaces
export type { IUnitOfWork } from './IUnitOfWork.js';
export type { IUnitOfWorkFactory } from './IUnitOfWorkFactory.js';

// Statistics Interfaces
export type { ITaskStatusStatistics } from './statistics/ITaskStatusStatistics.js';
export type { ITaskPriorityStatistics } from './statistics/ITaskPriorityStatistics.js';
export type { ITaskTimeStatistics } from './statistics/ITaskTimeStatistics.js';
export type { ICategoryStatistics, CategoryTaskCount } from './statistics/ICategoryStatistics.js';
export type { IRecurringTaskStatistics, TemplateFrequencyBreakdown } from './statistics/IRecurringTaskStatistics.js';
export type { IDependencyStatistics, DependencyCountDistribution } from './statistics/IDependencyStatistics.js';
export type { IStatisticsSummary } from './statistics/IStatisticsSummary.js';
