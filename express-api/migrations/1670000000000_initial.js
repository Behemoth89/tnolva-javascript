exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: 'gen_random_uuid()'
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true
    },
    password: {
      type: 'varchar(255)',
      notNull: true
    },
    first_name: {
      type: 'varchar(255)',
      notNull: false
    },
    last_name: {
      type: 'varchar(255)',
      notNull: false
    },
    refresh_token: {
      type: 'text',
      notNull: false
    },
    created_at: {
      type: 'timestamp',
      default: 'current_timestamp'
    }
  });

  pgm.createTable('todo_priorities', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: 'gen_random_uuid()'
    },
    priority_name: {
      type: 'varchar(255)',
      notNull: true
    },
    priority_sort: {
      type: 'integer',
      default: 0
    },
    sync_dt: {
      type: 'timestamp',
      default: 'current_timestamp'
    }
  });

  pgm.createTable('todo_categories', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: 'gen_random_uuid()'
    },
    category_name: {
      type: 'varchar(255)',
      notNull: true
    },
    category_sort: {
      type: 'integer',
      default: 0
    },
    tag: {
      type: 'varchar(255)',
      notNull: false
    },
    sync_dt: {
      type: 'timestamp',
      default: 'current_timestamp'
    }
  });

  pgm.createTable('todo_tasks', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: 'gen_random_uuid()'
    },
    task_name: {
      type: 'varchar(255)',
      notNull: false
    },
    task_sort: {
      type: 'integer',
      default: 0
    },
    created_dt: {
      type: 'timestamp',
      default: 'current_timestamp'
    },
    due_dt: {
      type: 'timestamp',
      notNull: false
    },
    is_completed: {
      type: 'boolean',
      default: false
    },
    is_archived: {
      type: 'boolean',
      default: false
    },
    todo_category_id: {
      type: 'uuid',
      references: 'todo_categories(id)',
      onDelete: 'SET NULL',
      notNull: false
    },
    todo_priority_id: {
      type: 'uuid',
      references: 'todo_priorities(id)',
      onDelete: 'SET NULL',
      notNull: false
    },
    sync_dt: {
      type: 'timestamp',
      default: 'current_timestamp'
    }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('todo_tasks');
  pgm.dropTable('todo_categories');
  pgm.dropTable('todo_priorities');
  pgm.dropTable('users');
};