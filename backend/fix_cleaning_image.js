const mysql = require('./node_modules/mysql2/promise');

async function fixImage() {
  try {
    const connection = await mysql.createConnection({
      host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '4FriZZXko2LDZrp.root',
      password: 'uzb9CrIYTFYrZhdG',
      database: 'service_booking_db',
      ssl: { rejectUnauthorized: false }
    });

    const newUrl = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80';

    await connection.query(
      'UPDATE services SET image = ?, image_url = ? WHERE name = ?',
      [newUrl, newUrl, 'Deep Home Cleaning']
    );

    console.log('✅ Successfully updated Deep Home Cleaning image URL in TiDB Database!');

    const [svc] = await connection.query('SELECT id, name, image, image_url FROM services WHERE name = ?', ['Deep Home Cleaning']);
    console.table(svc);

    await connection.end();
  } catch (err) {
    console.error('Error fixing image:', err.message);
  }
}

fixImage();
