const mysql = require('./node_modules/mysql2/promise');
const bcrypt = require('bcryptjs');

async function addUsers() {
  try {
    const connection = await mysql.createConnection({
      host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '4FriZZXko2LDZrp.root',
      password: 'uzb9CrIYTFYrZhdG',
      database: 'service_booking_db',
      ssl: { rejectUnauthorized: false }
    });

    const salt = await bcrypt.genSalt(10);
    const pass123456 = await bcrypt.hash('123456', salt);
    const passTest567 = await bcrypt.hash('test567', salt);

    // Upsert Pablo@example.com
    await connection.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ['Pablo', 'pablo@example.com', pass123456, 'user']
    );

    // Upsert JohnAgent@test.com
    await connection.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ['John Agent', 'johnagent@test.com', pass123456, 'agent']
    );

    console.log('✅ Successfully added/updated Pablo@example.com and JohnAgent@test.com!');

    const [allUsers] = await connection.query('SELECT id, name, email, role FROM users');
    console.table(allUsers);

    await connection.end();
  } catch (err) {
    console.error('Error adding users:', err.message);
  }
}

addUsers();
