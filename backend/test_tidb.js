const mysql = require('./node_modules/mysql2/promise');

async function testTiDBConnection() {
  try {
    console.log('Testing TiDB Cloud MySQL connection...');
    const connection = await mysql.createConnection({
      host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '4FriZZXko2LDZrp.root',
      password: 'uzb9CrIYTFYrZhdG',
      database: 'sys',
      ssl: { rejectUnauthorized: false },
      connectTimeout: 15000
    });
    console.log('✅ Successfully connected to TiDB Cloud!');
    const [rows] = await connection.query('SELECT VERSION() as version');
    console.log('TiDB Version:', rows[0].version);
    
    // Create database if not exists
    await connection.query('CREATE DATABASE IF NOT EXISTS service_booking_db');
    console.log('Database service_booking_db checked/created.');
    
    await connection.end();
  } catch (err) {
    console.error('❌ TiDB Connection Error:', err.message, err.code);
  }
}

testTiDBConnection();
