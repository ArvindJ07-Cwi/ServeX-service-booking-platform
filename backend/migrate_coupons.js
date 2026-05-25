const mysql = require('mysql2/promise');
require('dotenv').config();

async function runCouponMigration() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        console.log('Connected to DB');

        // Check columns in bookings
        const [rows] = await connection.query(`
            SELECT COUNT(*) AS count 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'coupon_code'
        `, [process.env.DB_NAME]);

        if (rows[0].count === 0) {
            await connection.query('ALTER TABLE bookings ADD COLUMN coupon_code VARCHAR(50) DEFAULT NULL;');
            await connection.query('ALTER TABLE bookings ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0.00;');
            console.log('Coupon columns added to bookings table.');
        } else {
            console.log('Coupon columns already exist in bookings table.');
        }

        // Create coupons table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS coupons (
              id INT AUTO_INCREMENT PRIMARY KEY,
              code VARCHAR(50) NOT NULL UNIQUE,
              discount_type ENUM('percentage', 'flat') NOT NULL,
              discount_value DECIMAL(10, 2) NOT NULL,
              max_discount DECIMAL(10, 2),
              min_order_value DECIMAL(10, 2) DEFAULT 0,
              usage_limit INT DEFAULT NULL,
              used_count INT DEFAULT 0,
              valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              valid_to TIMESTAMP NULL,
              user_limit INT DEFAULT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Coupons table created or already exists.');

        // Insert SERVEX50
        const [couponCheck] = await connection.query(`SELECT * FROM coupons WHERE code = 'SERVEX50'`);
        if (couponCheck.length === 0) {
            await connection.query(`
                INSERT INTO coupons (code, discount_type, discount_value, min_order_value, user_limit)
                VALUES ('SERVEX50', 'flat', 50.00, 200.00, 2)
            `);
            console.log('SERVEX50 coupon inserted.');
        } else {
            console.log('SERVEX50 coupon already exists.');
        }

        await connection.end();
        console.log('Migration completed.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

runCouponMigration();
