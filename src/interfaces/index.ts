/**
 * Interfaces Index
 * Exports all interfaces from a single file
 */
export type { IEntityId } from './IEntityId.js';
export type { IBaseEntity } from './IBaseEntity.js';
export type { ITask } from './ITask.js';
export type { ITaskCreateDto } from './ITaskCreateDto.js';
export type { ITaskUpdateDto } from './ITaskUpdateDto.js';
export type { ITaskCategory } from './ITaskCategory.js';
export type { ITaskCategoryCreateDto } from './ITaskCategoryCreateDto.js';
export type { ITaskCategoryUpdateDto } from './ITaskCategoryUpdateDto.js';
export type { ITaskCategoryAssignment } from './ITaskCategoryAssignment.js';
export type { ICategoryRepository } from './ICategoryRepository.js';

// DAL Interfaces
export type { IRepository } from './IRepository.js';
export type { ITaskRepository } from './ITaskRepository.js';
export type { IUnitOfWork } from './IUnitOfWork.js';
export type { IUnitOfWorkFactory } from './IUnitOfWorkFactory.js';
