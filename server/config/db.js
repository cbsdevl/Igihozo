const path = require('path');
const fs = require('fs');
require('dotenv').config();

let driver;

function getDriver() {
  if (!driver) {
    try {
      driver = {
        name: 'better-sqlite3',
        ctor: require('better-sqlite3'),
      };
    } catch (error) {
      const { DatabaseSync } = require('node:sqlite');
      driver = {
        name: 'node:sqlite',
        ctor: DatabaseSync,
      };
    }
  }

  return driver;
}

const dbPath = path.resolve(__dirname, process.env.DB_PATH || '../../database/gihozo.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;

function wrapStatement(statement) {
  return {
    get(...args) {
      return statement.get(...args);
    },
    all(...args) {
      return statement.all(...args);
    },
    run(...args) {
      return statement.run(...args);
    },
    iterate(...args) {
      return statement.iterate(...args);
    },
    columns() {
      return statement.columns ? statement.columns() : [];
    },
  };
}

function wrapConnection(connection) {
  return {
    prepare(sql) {
      return wrapStatement(connection.prepare(sql));
    },
    exec(sql) {
      return connection.exec(sql);
    },
    pragma(sql) {
      return connection.exec(`PRAGMA ${sql}`);
    },
    transaction(fn) {
      return (...args) => {
        connection.exec('BEGIN');
        try {
          const result = fn(...args);
          connection.exec('COMMIT');
          return result;
        } catch (error) {
          connection.exec('ROLLBACK');
          throw error;
        }
      };
    },
    close() {
      return connection.close();
    },
  };
}

function openConnection(filePath) {
  const selectedDriver = getDriver();

  if (selectedDriver.name === 'node:sqlite') {
    return new selectedDriver.ctor(filePath);
  }

  try {
    return new selectedDriver.ctor(filePath, {
      verbose: process.env.NODE_ENV === 'development' ? undefined : undefined,
    });
  } catch (error) {
    if (error && /bindings|native/i.test(error.message)) {
      const { DatabaseSync } = require('node:sqlite');
      driver = { name: 'node:sqlite', ctor: DatabaseSync };
      return new DatabaseSync(filePath);
    }

    throw error;
  }
}

function getDB() {
  if (!db) {
    const connection = openConnection(dbPath);
    db = wrapConnection(connection);

    // Performance pragmas
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = -64000'); // 64MB cache
    db.pragma('temp_store = MEMORY');
    db.pragma('mmap_size = 268435456'); // 256MB mmap
  }
  return db;
}

function closeDB() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDB, closeDB };
