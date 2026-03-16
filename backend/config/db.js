const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();

let dbInstance;

/**
 * Initializes and returns the SQLite database connection.
 * Ensures foreign keys are enabled.
 */
const getDb = async () => {
  if (dbInstance) return dbInstance;

  const dbPath = path.join(__dirname, '..', 'database.sqlite');

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable Foreign Keys (crucial for ON DELETE CASCADE safety)
  await dbInstance.run('PRAGMA foreign_keys = ON');

  return dbInstance;
};

/**
 * Wrapper to mimic mysql2 pool interface.
 * Allows controllers to use the same logic: const [rows] = await pool.query(sql, params);
 */
const pool = {
  query: async (sql, params = []) => {
    try {
      const db = await getDb();
      const normalizedSql = sql.trim();
      const upperSql = normalizedSql.toUpperCase();

      // Check if it's a SELECT query
      if (upperSql.startsWith('SELECT') || upperSql.startsWith('PRAGMA')) {
        const rows = await db.all(sql, params);
        return [rows, []]; // Return as [rows, fields] tuple
      } else {
        // INSERT, UPDATE, DELETE
        const result = await db.run(sql, params);
        // sqlite result structure: { stmt, lastID, changes }
        // Map to mysql2 result structure: { insertId, affectedRows }
        return [{
          insertId: result.lastID,
          affectedRows: result.changes
        }, []]; // Return as [result, fields] tuple
      }
    } catch (error) {
      console.error('Database Query Error:', error);
      throw error;
    }
  },
  // Mock getConnection for initialization logic in other files if any
  getConnection: async () => {
    return {
      query: pool.query,
      release: () => { } // No-op for SQLite
    };
  }
};

const initializeDatabase = async () => {
  try {
    const db = await getDb();
    console.log('Connected to SQLite database.');

    // Users Table
    // Note: AUTO_INCREMENT -> AUTOINCREMENT for SQLite
    // ENUM -> TEXT with CHECK constraint
    await db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user' CHECK(role IN ('user', 'agent', 'admin')),
                phone TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

    // Services Table
    await db.run(`
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                category TEXT,
                duration TEXT,
                image TEXT,
                image_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

    // Ensure legacy databases get an image_url column if missing
    try {
      const cols = await db.all("PRAGMA table_info(services)");
      const hasImageUrl = cols.find(c => c.name === 'image_url');
      if (!hasImageUrl) {
        await db.run('ALTER TABLE services ADD COLUMN image_url TEXT');
      }
    } catch (err) {
      // Non-fatal; log and continue
      console.warn('Could not ensure image_url column:', err.message || err);
    }

    // Bookings Table
    await db.run(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                service_id INTEGER NOT NULL,
                agent_id INTEGER,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'accepted', 'in_progress', 'completed', 'cancelled')),
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                address TEXT NOT NULL,
                notes TEXT,
                subtotal REAL NOT NULL,
                tax REAL NOT NULL,
                platform_fee REAL DEFAULT 49.00,
                total_price REAL NOT NULL,
                payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed')),
                payment_id TEXT,
                order_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
                FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

    // Migration: ensure payment columns exist on legacy databases
    try {
      const bookingCols = await db.all("PRAGMA table_info(bookings)");
      const hasPaymentStatus = bookingCols.find(c => c.name === 'payment_status');
      if (!hasPaymentStatus) {
        await db.run("ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed'))");
      }
      const hasPaymentId = bookingCols.find(c => c.name === 'payment_id');
      if (!hasPaymentId) {
        await db.run('ALTER TABLE bookings ADD COLUMN payment_id TEXT');
      }
      const hasOrderId = bookingCols.find(c => c.name === 'order_id');
      if (!hasOrderId) {
        await db.run('ALTER TABLE bookings ADD COLUMN order_id TEXT');
      }
    } catch (err) {
      console.warn('Could not ensure payment columns on bookings:', err.message || err);
    }

    // Notifications Table
    await db.run(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                booking_id INTEGER,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                is_read INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
            )
        `);

    console.log('Database tables verified/created successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

module.exports = { pool, initializeDatabase };
