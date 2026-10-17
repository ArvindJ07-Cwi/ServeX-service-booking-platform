const mysql = require('./node_modules/mysql2/promise');

async function listUsers() {
  try {
    const connection = await mysql.createConnection({
      host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '4FriZZXko2LDZrp.root',
      password: 'uzb9CrIYTFYrZhdG',
      database: 'service_booking_db',
      ssl: { rejectUnauthorized: false }
    });

    const [users] = await connection.query('SELECT id, name, email, role, created_at FROM users');
    console.log('--- ALL USERS IN DATABASE ---');
    console.table(users);
    await connection.end();
  } catch (err) {
    console.error('Error fetching users:', err.message);
  }
}

listUsers();
