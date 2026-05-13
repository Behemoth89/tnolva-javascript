require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

class MigrationRunner {
  constructor(client) {
    this.client = client;
  }

  createTable(name, columns) {
    const cols = Object.entries(columns).map(([colName, colDef]) => {
      let colStr = `"${colName}" ${colDef.type}`;
      if (colDef.primaryKey) colStr += ' PRIMARY KEY';
      if (colDef.notNull) colStr += ' NOT NULL';
      if (colDef.unique) colStr += ' UNIQUE';
      if (colDef.default) colStr += ` DEFAULT ${colDef.default}`;
      if (colDef.references) colStr += ` REFERENCES ${colDef.references}`;
      if (colDef.onDelete) colStr += ` ON DELETE ${colDef.onDelete}`;
      return colStr;
    });
    return this.client.query(`CREATE TABLE ${name} (${cols.join(', ')})`);
  }

  dropTable(name) {
    return this.client.query(`DROP TABLE IF EXISTS ${name}`);
  }

  addColumn(table, column, options) {
    return this.client.query(`ALTER TABLE ${table} ADD COLUMN "${column}" ${options.type}`);
  }

  dropColumn(table, column) {
    return this.client.query(`ALTER TABLE ${table} DROP COLUMN "${column}"`);
  }

  func(fn) {
    return fn;
  }
}

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const migrationTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'pgmigrations'
      );
    `);

    if (!migrationTableExists.rows[0].exists) {
      await client.query(`
        CREATE TABLE pgmigrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT current_timestamp
        );
      `);
    }

    const files = fs.readdirSync(path.join(__dirname, '..', 'migrations'))
      .filter(f => f.endsWith('.js'))
      .sort();

    for (const file of files) {
      const alreadyRun = await client.query(
        'SELECT * FROM pgmigrations WHERE name = $1',
        [file]
      );

      if (alreadyRun.rows.length === 0) {
        console.log(`Running migration: ${file}`);
        const runner = new MigrationRunner(client);
        const migration = require(path.join(__dirname, '..', 'migrations', file));
        await migration.up(runner);
        await client.query('INSERT INTO pgmigrations (name) VALUES ($1)', [file]);
        console.log(`Completed: ${file}`);
      }
    }

    await client.query('COMMIT');
    console.log('All migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(() => process.exit(1));