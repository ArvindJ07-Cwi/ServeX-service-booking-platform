const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixAgents() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // Hardcode some updates to test agents so they have a category
        // In realistic environments, they'd set this on profile edit
        const sql = `
            UPDATE users SET service_category = CASE 
                WHEN id = 3 THEN 'Appliance'
                WHEN id = 4 THEN 'Plumbing'
                WHEN id = 5 THEN 'Cleaning'
                WHEN id = 6 THEN 'Plumbing'
                WHEN id = 8 THEN 'Appliance'
                WHEN id = 11 THEN 'Appliance'
                WHEN id = 13 THEN 'Appliance'
                WHEN id = 14 THEN 'Electrical'
                WHEN id = 15 THEN 'Cleaning'
                WHEN id = 16 THEN 'Electrical'
                WHEN id = 17 THEN 'Painting'
                WHEN id = 18 THEN 'Salon'
                ELSE service_category 
            END
            WHERE role = 'agent';
        `;

        await connection.query(sql);
        console.log("Agents updated with default categories securely.");

        await connection.end();
    } catch (err) {
        console.error(err);
    }
}
fixAgents();
