const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log('Connected to DB');

        // Check if column exists first to be safe
        const [rows] = await connection.query(`
            SELECT COUNT(*) AS count 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'bookings' 
            AND COLUMN_NAME = 'service_category'
        `, [process.env.DB_NAME]);

        if (rows[0].count === 0) {
            await connection.query('ALTER TABLE bookings ADD COLUMN service_category VARCHAR(100) DEFAULT NULL;');
            console.log('Column service_category added to bookings table.');
            
            // To backfill old bookings, copy from services
            await connection.query(`
                UPDATE bookings b 
                JOIN services s ON b.service_id = s.id 
                SET b.service_category = s.category;
            `);
            console.log('Old bookings updated with service categories.');
        } else {
            console.log('Column service_category already exists.');
        }

        await connection.end();
        console.log('Migration completed.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

runMigration();
