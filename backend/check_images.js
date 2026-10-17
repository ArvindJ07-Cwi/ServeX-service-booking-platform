const mysql = require('./node_modules/mysql2/promise');

async function checkImages() {
  try {
    const connection = await mysql.createConnection({
      host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '4FriZZXko2LDZrp.root',
      password: 'uzb9CrIYTFYrZhdG',
      database: 'service_booking_db',
      ssl: { rejectUnauthorized: false }
    });

    const [services] = await connection.query('SELECT id, name, category, image, image_url FROM services');
    console.table(services);
    await connection.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkImages();
