const { pool } = require('./config/db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('123456', salt);
    
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin'`,
      ['Arvind Jadhav', 'arvindjadhao854@gmail.com', hash, 'admin']
    );

    console.log('✅ Admin user successfully added/updated!');
    
    const [users] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE email = ?',
      ['arvindjadhao854@gmail.com']
    );
    console.table(users);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin user:', err);
    process.exit(1);
  }
}

createAdmin();
