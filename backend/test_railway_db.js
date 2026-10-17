const mysql = require('./node_modules/mysql2/promise');

async function testConnection() {
  try {
    console.log('Testing with SSL rejectUnauthorized: false...');
    const connection = await mysql.createConnection({
      host: 'kodama.proxy.rlwy.net',
      user: 'root',
      password: 'iGSXctJsyawdPofTaViIuIGSbXCaopdz',
      database: 'railway',
      port: 49032,
      ssl: { rejectUnauthorized: false },
      connectTimeout: 10000
    });
    console.log('Successfully connected to Railway MySQL database with SSL!');
    const [rows] = await connection.query('SHOW TABLES');
    console.log('Tables:', rows);
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log('Users count:', users[0].count);
    const [services] = await connection.query('SELECT COUNT(*) as count FROM services');
    console.log('Services count:', services[0].count);
    await connection.end();
  } catch (err) {
    console.error('Railway DB SSL Connection Error:', err.message, err.code);
  }
}

testConnection();
