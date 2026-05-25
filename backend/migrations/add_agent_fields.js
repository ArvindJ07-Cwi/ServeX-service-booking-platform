/**
 * Migration: Add location, availability_status, service_category to users table
 *            Add location to bookings table
 *            Create agent_services mapping table
 * 
 * Run: node migrations/add_agent_fields.js
 */
const { pool } = require('../config/db');

async function migrate() {
    const connection = await pool.getConnection();
    try {
        console.log('🔄 Starting migration: add agent fields...\n');

        // 1. Add location column to users table
        try {
            await connection.query(`ALTER TABLE users ADD COLUMN location VARCHAR(100) DEFAULT NULL`);
            console.log('✅ Added "location" column to users table');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭️  "location" column already exists in users');
            else throw e;
        }

        // 2. Add availability_status column to users table
        try {
            await connection.query(`ALTER TABLE users ADD COLUMN availability_status BOOLEAN DEFAULT TRUE`);
            console.log('✅ Added "availability_status" column to users table');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭️  "availability_status" column already exists in users');
            else throw e;
        }

        // 3. Add service_category column to users table (for agents)
        try {
            await connection.query(`ALTER TABLE users ADD COLUMN service_category VARCHAR(100) DEFAULT NULL`);
            console.log('✅ Added "service_category" column to users table');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭️  "service_category" column already exists in users');
            else throw e;
        }

        // 4. Create agent_services mapping table (for agents with multiple service categories)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS agent_services (
                id INT AUTO_INCREMENT PRIMARY KEY,
                agent_id INT NOT NULL,
                service_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_agent_service (agent_id, service_id),
                FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created agent_services table (or already exists)');

        // 5. Add location column to bookings table
        try {
            await connection.query(`ALTER TABLE bookings ADD COLUMN location VARCHAR(100) DEFAULT NULL`);
            console.log('✅ Added "location" column to bookings table');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('⏭️  "location" column already exists in bookings');
            else throw e;
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
