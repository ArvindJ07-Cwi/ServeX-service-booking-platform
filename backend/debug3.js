const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // Change booking 19 to electrical so agent 16 can see it
        await connection.query("UPDATE bookings SET service_category = 'electrical', service_id = 7 WHERE id = 19;");
        console.log("Updated Booking 19 to electrical!");

        await connection.end();
    } catch (err) {
        console.error(err);
    }
}
check();
