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

        const [users] = await connection.query("SELECT id, name, service_category FROM users WHERE role='agent'");
        let out = "AGENTS:\n" + JSON.stringify(users, null, 2) + "\n\n";

        const [services] = await connection.query("SELECT id, name, category FROM services");
        out += "SERVICES:\n" + JSON.stringify(services, null, 2) + "\n\n";

        const [bookings] = await connection.query("SELECT id, user_id, service_id, service_category, status, payment_status, agent_id FROM bookings");
        out += "BOOKINGS:\n" + JSON.stringify(bookings, null, 2) + "\n\n";

        fs.writeFileSync('debug_json.txt', out, 'utf-8');

        await connection.end();
    } catch (err) {
        console.error(err);
    }
}
check();
