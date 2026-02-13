/**
 * Task Manager Application
 * A browser-based task management utility with CRUD operations
 * Uses localStorage for data persistence
 */

// ============================================================================
// VALIDATION MODULE
// ============================================================================

const Validator = {
    /**
     * Validate task title
     * @param {string} title - The task title
     * @returns {Object} - { valid: boolean, error: string|null }
     */
    validateTitle: function(title) {
        if (!title || typeof title !== 'string') {
            return { valid: false, error: 'Title is required' };
        }
        const trimmed = title.trim();
        if (trimmed.length === 0) {
            return { valid: false, error: 'Title cannot be empty' };
        }
        if (trimmed.length > 100) {
            return { valid: false, error: 'Title must be 100 characters or less' };
        }
        return { valid: true, error: null };
    },

    /**
     * Validate task description
     * @param {string} description - The task description
     * @returns {Object} - { valid: boolean, error: string|null }
     */
    validateDescription: function(description) {
        if (description && description.length > 1000) {
            return { valid: false, error: 'Description must be 1000 characters or less' };
        }
        return { valid: true, error: null };
    },

    /**
     * Validate task status
     * @param {string} status - The task status
     * @returns {Object} - { valid: boolean, error: string|null }
     */
    validateStatus: function(status) {
        const validStatuses = ['pending', 'in-progress', 'completed'];
        if (status && !validStatuses.includes(status)) {
            return { valid: false, error: 'Invalid status. Must be: pending, in-progress, or completed' };
        }
        return { valid: true, error: null };
    },

    /**
     * Validate task priority
     * @param {string} priority - The task priority
     * @returns {Object} - { valid: boolean, error: string|null }
     */
    validatePriority: function(priority) {
        const validPriorities = ['low', 'medium', 'high'];
        if (priority && !validPriorities.includes(priority)) {
            return { valid: false, error: 'Invalid priority. Must be: low, medium, or high' };
        }
        return { valid: true, error: null };
    },

    /**
     * Validate due date
     * @param {string} dueDate - The due date string
     * @returns {Object} - { valid: boolean, error: string|null }
     */
    validateDueDate: function(dueDate) {
        if (!dueDate) {
            return { valid: true, error: null };
        }
        const date = new Date(dueDate);
        if (isNaN(date.getTime())) {
            return { valid: false, error: 'Invalid date format' };
        }
        return { valid: true, error: null };
    },

    /**
     * Validate tags
     * @param {Array} tags - Array of tags
     * @returns {Object} - { valid: boolean, error: string|null }
     */
    validateTags: function(tags) {
        if (!tags) {
            return { valid: true, error: null };
        }
        if (!Array.isArray(tags)) {
            return { valid: false, error: 'Tags must be an array' };
        }
        for (let i = 0; i < tags.length; i++) {
            if (typeof tags[i] !== 'string') {
                return { valid: false, error: 'Each tag must be a string' };
            }
            if (tags[i].length > 30) {
                return { valid: false, error: 'Each tag must be 30 characters or less' };
            }
        }
        return { valid: true, error: null };
    },

    /**
     * Validate entire task object
     * @param {Object} task - The task object
     * @returns {Object} - { valid: boolean, errors: Array }
     */
    validateTask: function(task) {
        const errors = [];

        const titleResult = this.validateTitle(task.title);
        if (!titleResult.valid) errors.push(titleResult.error);

        const descResult = this.validateDescription(task.description);
        if (!descResult.valid) errors.push(descResult.error);

        const statusResult = this.validateStatus(task.status);
        if (!statusResult.valid) errors.push(statusResult.error);

        const priorityResult = this.validatePriority(task.priority);
        if (!priorityResult.valid) errors.push(priorityResult.error);

        const dateResult = this.validateDueDate(task.dueDate);
        if (!dateResult.valid) errors.push(dateResult.error);

        const tagsResult = this.validateTags(task.tags);
        if (!tagsResult.valid) errors.push(tagsResult.error);

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
};

// ============================================================================
// STORAGE MODULE (Async wrapper for localStorage)
// ============================================================================

const Storage = {
    STORAGE_KEY: 'taskManager_tasks',

    /**
     * Get all tasks from storage
     * @returns {Promise<Array>} - Array of tasks
     */
    getTasks: function() {
        return new Promise(function(resolve, reject) {
            try {
                const data = localStorage.getItem(this.STORAGE_KEY);
                const tasks = data ? JSON.parse(data) : [];
                resolve(tasks);
            } catch (error) {
                reject(new Error('Failed to read from storage: ' + error.message));
            }
        }.bind(this));
    },

    /**
     * Save tasks to storage
     * @param {Array} tasks - Array of tasks to save
     * @returns {Promise<void>}
     */
    saveTasks: function(tasks) {
        return new Promise(function(resolve, reject) {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
                resolve();
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    reject(new Error('Storage quota exceeded. Please delete some tasks.'));
                } else {
                    reject(new Error('Failed to save to storage: ' + error.message));
                }
            }
        }.bind(this));
    },

    /**
     * Clear all tasks from storage
     * @returns {Promise<void>}
     */
    clearTasks: function() {
        return new Promise(function(resolve, reject) {
            try {
                localStorage.removeItem(this.STORAGE_KEY);
                resolve();
            } catch (error) {
                reject(new Error('Failed to clear storage: ' + error.message));
            }
        }.bind(this));
    }
};

// ============================================================================
// TASK MANAGER CLASS
// ============================================================================

/**
 * TaskManager class handles all CRUD operations for tasks
 */
class TaskManager {
    constructor() {
        this.tasks = [];
        this.initialized = false;
    }

    /**
     * Initialize the task manager by loading tasks from storage
     * @returns {Promise<void>}
     */
    async init() {
        try {
            this.tasks = await Storage.getTasks();
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize TaskManager:', error);
            throw error;
        }
    }

    /**
     * Generate a unique ID for a task
     * @returns {string} - Unique ID
     */
    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Add a new task
     * @param {Object} taskData - Task data
     * @returns {Promise<Object>} - The created task
     */
    async addTask(taskData) {
        return new Promise(function(resolve, reject) {
            setTimeout(async function() {
                try {
                    // Validate task data
                    const validation = Validator.validateTask(taskData);
                    if (!validation.valid) {
                        reject(new Error('Validation failed: ' + validation.errors.join(', ')));
                        return;
                    }

                    // Create task object
                    const task = {
                        id: this.generateId(),
                        title: taskData.title.trim(),
                        description: taskData.description ? taskData.description.trim() : '',
                        status: taskData.status || 'pending',
                        priority: taskData.priority || 'medium',
                        dueDate: taskData.dueDate || null,
                        tags: taskData.tags || [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    // Add to tasks array
                    this.tasks.push(task);

                    // Save to storage
                    await Storage.saveTasks(this.tasks);

                    resolve(task);
                } catch (error) {
                    reject(error);
                }
            }.bind(this), 10);
        }.bind(this));
    }

    /**
     * Get all tasks
     * @returns {Promise<Array>} - Array of all tasks
     */
    async listTasks() {
        return new Promise(function(resolve) {
            setTimeout(function() {
                resolve([...this.tasks]);
            }.bind(this), 10);
        }.bind(this));
    }

    /**
     * Get a single task by ID
     * @param {string} id - Task ID
     * @returns {Promise<Object|null>} - The task or null if not found
     */
    async getTask(id) {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                if (!id || typeof id !== 'string') {
                    reject(new Error('Invalid task ID'));
                    return;
                }
                const task = this.tasks.find(function(t) { return t.id === id; });
                resolve(task ? { ...task } : null);
            }.bind(this), 10);
        }.bind(this));
    }

    /**
     * Update a task
     * @param {string} id - Task ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} - The updated task
     */
    async updateTask(id, updates) {
        return new Promise(function(resolve, reject) {
            setTimeout(async function() {
                try {
                    if (!id || typeof id !== 'string') {
                        reject(new Error('Invalid task ID'));
                        return;
                    }

                    const index = this.tasks.findIndex(function(t) { return t.id === id; });
                    if (index === -1) {
                        reject(new Error('Task not found'));
                        return;
                    }

                    // Create updated task object
                    const updatedTask = { ...this.tasks[index] };

                    // Apply updates with validation
                    if (updates.title !== undefined) {
                        const result = Validator.validateTitle(updates.title);
                        if (!result.valid) {
                            reject(new Error(result.error));
                            return;
                        }
                        updatedTask.title = updates.title.trim();
                    }

                    if (updates.description !== undefined) {
                        const result = Validator.validateDescription(updates.description);
                        if (!result.valid) {
                            reject(new Error(result.error));
                            return;
                        }
                        updatedTask.description = updates.description ? updates.description.trim() : '';
                    }

                    if (updates.status !== undefined) {
                        const result = Validator.validateStatus(updates.status);
                        if (!result.valid) {
                            reject(new Error(result.error));
                            return;
                        }
                        updatedTask.status = updates.status;
                    }

                    if (updates.priority !== undefined) {
                        const result = Validator.validatePriority(updates.priority);
                        if (!result.valid) {
                            reject(new Error(result.error));
                            return;
                        }
                        updatedTask.priority = updates.priority;
                    }

                    if (updates.dueDate !== undefined) {
                        const result = Validator.validateDueDate(updates.dueDate);
                        if (!result.valid) {
                            reject(new Error(result.error));
                            return;
                        }
                        updatedTask.dueDate = updates.dueDate || null;
                    }

                    if (updates.tags !== undefined) {
                        const result = Validator.validateTags(updates.tags);
                        if (!result.valid) {
                            reject(new Error(result.error));
                            return;
                        }
                        updatedTask.tags = updates.tags || [];
                    }

                    updatedTask.updatedAt = new Date().toISOString();

                    // Update tasks array
                    this.tasks[index] = updatedTask;

                    // Save to storage
                    await Storage.saveTasks(this.tasks);

                    resolve({ ...updatedTask });
                } catch (error) {
                    reject(error);
                }
            }.bind(this), 10);
        }.bind(this));
    }

    /**
     * Delete a task
     * @param {string} id - Task ID
     * @returns {Promise<boolean>} - True if deleted
     */
    async deleteTask(id) {
        return new Promise(function(resolve, reject) {
            setTimeout(async function() {
                try {
                    if (!id || typeof id !== 'string') {
                        reject(new Error('Invalid task ID'));
                        return;
                    }

                    const index = this.tasks.findIndex(function(t) { return t.id === id; });
                    if (index === -1) {
                        reject(new Error('Task not found'));
                        return;
                    }

                    // Remove from array
                    this.tasks.splice(index, 1);

                    // Save to storage
                    await Storage.saveTasks(this.tasks);

                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            }.bind(this), 10);
        }.bind(this));
    }

    /**
     * Filter tasks by status or priority
     * @param {string} field - Field to filter by (status or priority)
     * @param {string} value - Value to filter by
     * @returns {Promise<Array>} - Filtered tasks
     */
    async filterTasks(field, value) {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                if (field !== 'status' && field !== 'priority') {
                    reject(new Error('Invalid filter field. Use "status" or "priority"'));
                    return;
                }

                const filtered = this.tasks.filter(function(task) {
                    return task[field] === value;
                });

                resolve(filtered);
            }.bind(this), 10);
        }.bind(this));
    }

    /**
     * Search tasks by title, description, or tags
     * @param {string} query - Search query
     * @returns {Promise<Array>} - Matching tasks
     */
    async searchTasks(query) {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                if (!query || typeof query !== 'string') {
                    reject(new Error('Invalid search query'));
                    return;
                }

                const searchTerm = query.toLowerCase().trim();
                const results = this.tasks.filter(function(task) {
                    const titleMatch = task.title.toLowerCase().includes(searchTerm);
                    const descMatch = task.description.toLowerCase().includes(searchTerm);
                    const tagMatch = task.tags.some(function(tag) {
                        return tag.toLowerCase().includes(searchTerm);
                    });
                    return titleMatch || descMatch || tagMatch;
                });

                resolve(results);
            }.bind(this), 10);
        }.bind(this));
    }

    /**
     * Get task statistics
     * @returns {Promise<Object>} - Statistics object
     */
    async getStats() {
        return new Promise(function(resolve) {
            setTimeout(function() {
                const stats = {
                    total: this.tasks.length,
                    pending: 0,
                    inProgress: 0,
                    completed: 0,
                    highPriority: 0,
                    overdue: 0
                };

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                this.tasks.forEach(function(task) {
                    // Count by status
                    if (task.status === 'pending') stats.pending++;
                    else if (task.status === 'in-progress') stats.inProgress++;
                    else if (task.status === 'completed') stats.completed++;

                    // Count high priority
                    if (task.priority === 'high') stats.highPriority++;

                    // Count overdue
                    if (task.dueDate && task.status !== 'completed') {
                        const dueDate = new Date(task.dueDate);
                        if (dueDate < today) stats.overdue++;
                    }
                });

                resolve(stats);
            }.bind(this), 10);
        }.bind(this));
    }
}

// ============================================================================
// UI CONTROLLER
// ============================================================================

const UIController = {
    // DOM Elements
    elements: {
        commandInput: null,
        executeBtn: null,
        taskForm: null,
        taskId: null,
        title: null,
        description: null,
        status: null,
        priority: null,
        dueDate: null,
        tags: null,
        submitBtn: null,
        cancelBtn: null,
        filterStatus: null,
        filterPriority: null,
        searchInput: null,
        clearFiltersBtn: null,
        taskList: null,
        taskCount: null,
        notification: null,
        titleError: null
    },

    /**
     * Initialize UI Controller
     */
    init: function() {
        // Cache DOM elements
        this.elements.commandInput = document.getElementById('commandInput');
        this.elements.executeBtn = document.getElementById('executeBtn');
        this.elements.taskForm = document.getElementById('taskForm');
        this.elements.taskId = document.getElementById('taskId');
        this.elements.title = document.getElementById('title');
        this.elements.description = document.getElementById('description');
        this.elements.status = document.getElementById('status');
        this.elements.priority = document.getElementById('priority');
        this.elements.dueDate = document.getElementById('dueDate');
        this.elements.tags = document.getElementById('tags');
        this.elements.submitBtn = document.getElementById('submitBtn');
        this.elements.cancelBtn = document.getElementById('cancelBtn');
        this.elements.filterStatus = document.getElementById('filterStatus');
        this.elements.filterPriority = document.getElementById('filterPriority');
        this.elements.searchInput = document.getElementById('searchInput');
        this.elements.clearFiltersBtn = document.getElementById('clearFiltersBtn');
        this.elements.taskList = document.getElementById('taskList');
        this.elements.taskCount = document.getElementById('taskCount');
        this.elements.notification = document.getElementById('notification');
        this.elements.titleError = document.getElementById('titleError');
    },

    /**
     * Show notification message
     * @param {string} message - Message to display
     * @param {string} type - Type: success, error, info
     */
    showNotification: function(message, type) {
        const notification = this.elements.notification;
        notification.textContent = message;
        notification.className = 'notification ' + type;
        
        // Auto-hide after 3 seconds
        setTimeout(function() {
            notification.classList.add('hidden');
        }, 3000);
    },

    /**
     * Render task list
     * @param {Array} tasks - Array of tasks to render
     */
    renderTasks: function(tasks) {
        const self = this;
        
        if (tasks.length === 0) {
            this.elements.taskList.innerHTML = '<p class="no-tasks">No tasks found. Add a task to get started!</p>';
            this.elements.taskCount.textContent = '(0)';
            return;
        }

        this.elements.taskCount.textContent = '(' + tasks.length + ')';

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let html = '';
        tasks.forEach(function(task) {
            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
            const isOverdue = dueDate && dueDate < today && task.status !== 'completed';
            const isDueToday = dueDate && dueDate.getTime() === today.getTime();

            let cardClass = 'task-card';
            if (task.status === 'completed') cardClass += ' completed';
            if (isOverdue) cardClass += ' overdue';
            if (isDueToday) cardClass += ' due-today';

            const statusClass = 'status-' + task.status;
            const priorityClass = 'priority-' + task.priority;

            const tagsHtml = task.tags.length > 0 
                ? '<div class="task-tags">' + task.tags.map(function(tag) { 
                    return '<span class="tag">' + self.escapeHtml(tag) + '</span>'; 
                }).join('') + '</div>' 
                : '';

            html += '<div class="' + cardClass + '" data-id="' + task.id + '">' +
                '<div class="task-header">' +
                    '<span class="task-title">' + self.escapeHtml(task.title) + '</span>' +
                    '<div class="task-actions">' +
                        '<button class="edit-btn" data-id="' + task.id + '">Edit</button>' +
                        '<button class="delete-btn" data-id="' + task.id + '">Delete</button>' +
                    '</div>' +
                '</div>' +
                (task.description ? '<p class="task-description">' + self.escapeHtml(task.description) + '</p>' : '') +
                '<div class="task-meta">' +
                    '<span class="task-meta-item"><span class="status-badge ' + statusClass + '">' + task.status + '</span></span>' +
                    '<span class="task-meta-item"><span class="label">Priority:</span> <span class="value ' + priorityClass + '">' + task.priority + '</span></span>' +
                    (task.dueDate ? '<span class="task-meta-item"><span class="label">Due:</span> <span class="value">' + self.formatDate(task.dueDate) + '</span></span>' : '') +
                '</div>' +
                tagsHtml +
            '</div>';
        });

        this.elements.taskList.innerHTML = html;
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Format date for display
     * @param {string} dateStr - Date string
     * @returns {string} - Formatted date
     */
    formatDate: function(dateStr) {
        const date = new Date(dateStr);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    },

    /**
     * Get form data
     * @returns {Object} - Form data object
     */
    getFormData: function() {
        const tagsValue = this.elements.tags.value.trim();
        const tags = tagsValue ? tagsValue.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t; }) : [];

        return {
            id: this.elements.taskId.value || null,
            title: this.elements.title.value,
            description: this.elements.description.value,
            status: this.elements.status.value,
            priority: this.elements.priority.value,
            dueDate: this.elements.dueDate.value || null,
            tags: tags
        };
    },

    /**
     * Set form data for editing
     * @param {Object} task - Task object
     */
    setFormData: function(task) {
        this.elements.taskId.value = task.id;
        this.elements.title.value = task.title;
        this.elements.description.value = task.description || '';
        this.elements.status.value = task.status;
        this.elements.priority.value = task.priority;
        this.elements.dueDate.value = task.dueDate || '';
        this.elements.tags.value = task.tags.join(', ');
        this.elements.submitBtn.textContent = 'Update Task';
        this.elements.cancelBtn.style.display = 'inline-block';
    },

    /**
     * Reset form to default state
     */
    resetForm: function() {
        this.elements.taskForm.reset();
        this.elements.taskId.value = '';
        this.elements.submitBtn.textContent = 'Add Task';
        this.elements.cancelBtn.style.display = 'none';
        this.elements.titleError.textContent = '';
    },

    /**
     * Show form validation error
     * @param {string} field - Field name
     * @param {string} message - Error message
     */
    showError: function(field, message) {
        if (field === 'title') {
            this.elements.titleError.textContent = message;
        }
    },

    /**
     * Clear form errors
     */
    clearErrors: function() {
        this.elements.titleError.textContent = '';
    }
};

// ============================================================================
// COMMAND PARSER
// ============================================================================

const CommandParser = {
    /**
     * Parse command string
     * @param {string} input - Command input string
     * @returns {Object} - { command: string, args: Array }
     */
    parse: function(input) {
        const trimmed = input.trim();
        if (!trimmed) {
            return { command: null, args: [] };
        }

        // Split by spaces but preserve quoted strings
        const parts = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';

        for (let i = 0; i < trimmed.length; i++) {
            const char = trimmed[i];

            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = '';
            } else if (char === ' ' && !inQuotes) {
                if (current) {
                    parts.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
        if (current) {
            parts.push(current);
        }

        const command = parts[0] ? parts[0].toLowerCase() : null;
        const args = parts.slice(1);

        return { command: command, args: args };
    }
};

// ============================================================================
// APPLICATION CONTROLLER
// ============================================================================

const App = {
    taskManager: null,

    /**
     * Initialize the application
     */
    init: async function() {
        const self = this;

        // Initialize UI Controller
        UIController.init();

        // Initialize Task Manager
        this.taskManager = new TaskManager();
        try {
            await this.taskManager.init();
        } catch (error) {
            UIController.showNotification('Failed to initialize: ' + error.message, 'error');
            return;
        }

        // Load and display tasks
        await this.loadTasks();

        // Set up event listeners
        this.setupEventListeners();
    },

    /**
     * Set up all event listeners
     */
    setupEventListeners: function() {
        const self = this;

        // Form submission
        UIController.elements.taskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            self.handleFormSubmit();
        });

        // Cancel button
        UIController.elements.cancelBtn.addEventListener('click', function() {
            UIController.resetForm();
        });

        // Command execution
        UIController.elements.executeBtn.addEventListener('click', function() {
            self.handleCommand(UIController.elements.commandInput.value);
        });

        UIController.elements.commandInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                self.handleCommand(UIController.elements.commandInput.value);
            }
        });

        // Filter controls
        UIController.elements.filterStatus.addEventListener('change', function() {
            self.applyFilters();
        });

        UIController.elements.filterPriority.addEventListener('change', function() {
            self.applyFilters();
        });

        UIController.elements.searchInput.addEventListener('input', function() {
            self.applyFilters();
        });

        UIController.elements.clearFiltersBtn.addEventListener('click', function() {
            UIController.elements.filterStatus.value = '';
            UIController.elements.filterPriority.value = '';
            UIController.elements.searchInput.value = '';
            self.loadTasks();
        });

        // Task list event delegation
        UIController.elements.taskList.addEventListener('click', function(e) {
            if (e.target.classList.contains('edit-btn')) {
                const id = e.target.getAttribute('data-id');
                self.editTask(id);
            } else if (e.target.classList.contains('delete-btn')) {
                const id = e.target.getAttribute('data-id');
                self.deleteTask(id);
            }
        });
    },

    /**
     * Load and display all tasks
     */
    loadTasks: async function() {
        try {
            const tasks = await this.taskManager.listTasks();
            // Sort by creation date (newest first)
            tasks.sort(function(a, b) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            UIController.renderTasks(tasks);
        } catch (error) {
            UIController.showNotification('Failed to load tasks: ' + error.message, 'error');
        }
    },

    /**
     * Handle form submission (add or update)
     */
    handleFormSubmit: async function() {
        const self = this;
        UIController.clearErrors();

        const formData = UIController.getFormData();

        // Validate title
        const titleValidation = Validator.validateTitle(formData.title);
        if (!titleValidation.valid) {
            UIController.showError('title', titleValidation.error);
            return;
        }

        try {
            if (formData.id) {
                // Update existing task
                await this.taskManager.updateTask(formData.id, {
                    title: formData.title,
                    description: formData.description,
                    status: formData.status,
                    priority: formData.priority,
                    dueDate: formData.dueDate,
                    tags: formData.tags
                });
                UIController.showNotification('Task updated successfully!', 'success');
            } else {
                // Add new task
                await this.taskManager.addTask({
                    title: formData.title,
                    description: formData.description,
                    status: formData.status,
                    priority: formData.priority,
                    dueDate: formData.dueDate,
                    tags: formData.tags
                });
                UIController.showNotification('Task added successfully!', 'success');
            }

            UIController.resetForm();
            await this.loadTasks();
        } catch (error) {
            UIController.showNotification(error.message, 'error');
        }
    },

    /**
     * Edit a task
     * @param {string} id - Task ID
     */
    editTask: async function(id) {
        try {
            const task = await this.taskManager.getTask(id);
            if (task) {
                UIController.setFormData(task);
                UIController.elements.title.focus();
            } else {
                UIController.showNotification('Task not found', 'error');
            }
        } catch (error) {
            UIController.showNotification('Failed to load task: ' + error.message, 'error');
        }
    },

    /**
     * Delete a task
     * @param {string} id - Task ID
     */
    deleteTask: async function(id) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            await this.taskManager.deleteTask(id);
            UIController.showNotification('Task deleted successfully!', 'success');
            await this.loadTasks();
        } catch (error) {
            UIController.showNotification(error.message, 'error');
        }
    },

    /**
     * Apply filters and search
     */
    applyFilters: async function() {
        const statusFilter = UIController.elements.filterStatus.value;
        const priorityFilter = UIController.elements.filterPriority.value;
        const searchQuery = UIController.elements.searchInput.value.trim();

        try {
            let tasks = await this.taskManager.listTasks();

            // Apply status filter
            if (statusFilter) {
                tasks = tasks.filter(function(t) { return t.status === statusFilter; });
            }

            // Apply priority filter
            if (priorityFilter) {
                tasks = tasks.filter(function(t) { return t.priority === priorityFilter; });
            }

            // Apply search
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                tasks = tasks.filter(function(t) {
                    return t.title.toLowerCase().includes(query) ||
                           t.description.toLowerCase().includes(query) ||
                           t.tags.some(function(tag) { return tag.toLowerCase().includes(query); });
                });
            }

            // Sort by creation date
            tasks.sort(function(a, b) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            UIController.renderTasks(tasks);
        } catch (error) {
            UIController.showNotification('Failed to filter tasks: ' + error.message, 'error');
        }
    },

    /**
     * Handle command input
     * @param {string} input - Command string
     */
    handleCommand: async function(input) {
        const self = this;
        const parsed = CommandParser.parse(input);

        if (!parsed.command) {
            UIController.showNotification('Please enter a command', 'error');
            return;
        }

        UIController.elements.commandInput.value = '';

        try {
            switch (parsed.command) {
                case 'add':
                    await this.handleAddCommand(parsed.args);
                    break;

                case 'list':
                    await this.loadTasks();
                    UIController.showNotification('Tasks loaded', 'info');
                    break;

                case 'update':
                    await this.handleUpdateCommand(parsed.args);
                    break;

                case 'delete':
                    await this.handleDeleteCommand(parsed.args);
                    break;

                case 'filter':
                    await this.handleFilterCommand(parsed.args);
                    break;

                case 'search':
                    await this.handleSearchCommand(parsed.args);
                    break;

                case 'help':
                    this.showHelp();
                    break;

                default:
                    UIController.showNotification('Unknown command: ' + parsed.command, 'error');
            }
        } catch (error) {
            UIController.showNotification(error.message, 'error');
        }
    },

    /**
     * Handle add command
     * @param {Array} args - Command arguments
     */
    handleAddCommand: async function(args) {
        if (args.length < 1) {
            throw new Error('Usage: add "title" "description" priority dueDate tags');
        }

        const title = args[0];
        const description = args[1] || '';
        const priority = args[2] || 'medium';
        const dueDate = args[3] || null;
        const tags = args[4] ? args[4].split(',').map(function(t) { return t.trim(); }) : [];

        await this.taskManager.addTask({
            title: title,
            description: description,
            status: 'pending',
            priority: priority,
            dueDate: dueDate,
            tags: tags
        });

        UIController.showNotification('Task added successfully!', 'success');
        await this.loadTasks();
    },

    /**
     * Handle update command
     * @param {Array} args - Command arguments
     */
    handleUpdateCommand: async function(args) {
        if (args.length < 3) {
            throw new Error('Usage: update id field value');
        }

        const id = args[0];
        const field = args[1];
        const value = args.slice(2).join(' ');

        const validFields = ['title', 'description', 'status', 'priority', 'dueDate', 'tags'];
        if (!validFields.includes(field)) {
            throw new Error('Invalid field. Valid fields: ' + validFields.join(', '));
        }

        let updateValue = value;
        if (field === 'tags') {
            updateValue = value.split(',').map(function(t) { return t.trim(); });
        }

        await this.taskManager.updateTask(id, { [field]: updateValue });
        UIController.showNotification('Task updated successfully!', 'success');
        await this.loadTasks();
    },

    /**
     * Handle delete command
     * @param {Array} args - Command arguments
     */
    handleDeleteCommand: async function(args) {
        if (args.length < 1) {
            throw new Error('Usage: delete id');
        }

        await this.taskManager.deleteTask(args[0]);
        UIController.showNotification('Task deleted successfully!', 'success');
        await this.loadTasks();
    },

    /**
     * Handle filter command
     * @param {Array} args - Command arguments
     */
    handleFilterCommand: async function(args) {
        if (args.length < 2) {
            throw new Error('Usage: filter status|priority value');
        }

        const field = args[0];
        const value = args[1];

        const tasks = await this.taskManager.filterTasks(field, value);
        UIController.renderTasks(tasks);
        UIController.showNotification('Filtered ' + tasks.length + ' tasks', 'info');
    },

    /**
     * Handle search command
     * @param {Array} args - Command arguments
     */
    handleSearchCommand: async function(args) {
        if (args.length < 1) {
            throw new Error('Usage: search query');
        }

        const query = args.join(' ');
        const tasks = await this.taskManager.searchTasks(query);
        UIController.renderTasks(tasks);
        UIController.showNotification('Found ' + tasks.length + ' tasks', 'info');
    },

    /**
     * Show help information
     */
    showHelp: function() {
        UIController.showNotification('Commands: add, list, update, delete, filter, search', 'info');
    }
};

// ============================================================================
// INITIALIZE APPLICATION
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
