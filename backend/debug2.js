const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function check() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        const [bookings] = await connection.query("SELECT id, status, payment_status, service_id, service_category, agent_id FROM bookings ORDER BY id DESC LIMIT 5");
        fs.writeFileSync('debug_recent.txt', JSON.stringify(bookings, null, 2));

        await connection.end();
    } catch (err) {
        console.error(err);
    }
}
check();
