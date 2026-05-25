/**
 * Migration: Add city + area columns to users and bookings tables
 *            Add performance indexes on city and service_category
 *
 * Safe migration — only adds columns if they don't already exist.
 * Run: node migrations/add_location_fields.js
 */
const { pool } = require('../config/db');

async function migrate() {
    const connection = await pool.getConnection();
    try {
        console.log('🔄 Starting migration: add city/area location fields...\n');

        // ── users table ──────────────────────────────────────────────
        const userCols = [
            { col: 'city', sql: `ALTER TABLE users ADD COLUMN city VARCHAR(100) DEFAULT NULL AFTER location` },
            { col: 'area', sql: `ALTER TABLE users ADD COLUMN area VARCHAR(100) DEFAULT NULL AFTER city` },
        ];

        for (const { col, sql } of userCols) {
            try {
                await connection.query(sql);
                console.log(`✅ Added "${col}" column to users table`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log(`⏭️  "${col}" column already exists in users`);
                } else {
                    throw e;
                }
            }
        }

        // ── bookings table ───────────────────────────────────────────
        const bookingCols = [
            { col: 'city',  sql: `ALTER TABLE bookings ADD COLUMN city VARCHAR(100) DEFAULT NULL AFTER location` },
            { col: 'area',  sql: `ALTER TABLE bookings ADD COLUMN area VARCHAR(100) DEFAULT NULL AFTER city` },
        ];

        for (const { col, sql } of bookingCols) {
            try {
                await connection.query(sql);
                console.log(`✅ Added "${col}" column to bookings table`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log(`⏭️  "${col}" column already exists in bookings`);
                } else {
                    throw e;
                }
            }
        }

        // ── Performance indexes ──────────────────────────────────────
        const indexes = [
            { name: 'idx_users_city', sql: `CREATE INDEX idx_users_city ON users(city)` },
            { name: 'idx_users_service_category', sql: `CREATE INDEX idx_users_service_category ON users(service_category)` },
            { name: 'idx_bookings_city', sql: `CREATE INDEX idx_bookings_city ON bookings(city)` },
            { name: 'idx_bookings_service_category', sql: `CREATE INDEX idx_bookings_service_category ON bookings(service_category)` },
        ];

        for (const { name, sql } of indexes) {
            try {
                await connection.query(sql);
                console.log(`✅ Created index: ${name}`);
            } catch (e) {
                // ER_DUP_KEYNAME = index already exists
                if (e.code === 'ER_DUP_KEYNAME') {
                    console.log(`⏭️  Index ${name} already exists`);
                } else {
                    throw e;
                }
            }
        }

        console.log('\n🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        connection.release();
        process.exit(0);
    }
}

migrate();
