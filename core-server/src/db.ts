import { Database } from 'bun:sqlite';

const db = new Database('perfomantia.sqlite');

// Create tables if they do not exist
db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );
`).run();

db.query(`
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`).run();

db.query(`
  CREATE TABLE IF NOT EXISTS alert_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    smtp_host TEXT,
    smtp_port INTEGER,
    smtp_user TEXT,
    smtp_pass TEXT,
    email_to TEXT,
    cpu_threshold INTEGER DEFAULT 80,
    mem_threshold INTEGER DEFAULT 85,
    cooldown_mins INTEGER DEFAULT 15,
    enabled BOOLEAN DEFAULT 0
  );
`).run();

const configCount = db.query('SELECT COUNT(*) as count FROM alert_settings;').get() as { count: number };
if (configCount.count === 0) {
  db.query('INSERT INTO alert_settings (id) VALUES (1);').run();
}

try {
  db.query('ALTER TABLE alert_settings ADD COLUMN disk_threshold INTEGER DEFAULT 85;').run();
} catch(e) {}

try {
  db.query('ALTER TABLE alert_settings ADD COLUMN mongo_uri TEXT;').run();
} catch(e) {}

db.query(`
  CREATE TABLE IF NOT EXISTS server_databases (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     type TEXT NOT NULL,
     uri TEXT NOT NULL,
     enabled INTEGER DEFAULT 1
  );
`).run();

// Seed default user if empty
const count = db.query('SELECT COUNT(*) as count FROM users;').get() as { count: number };
if (count.count === 0) {
  // Pass: admin123
  // Using basic hashing strategy. In prod we'll use Bun.password.hash
  Bun.password.hash('admin123').then(hash => {
    db.query('INSERT INTO users (username, password_hash) VALUES (?, ?);').run('admin', hash);
    console.log('✅ Default user created (admin / admin123)');
  });
}

export default db;
