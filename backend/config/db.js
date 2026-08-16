const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * MySQL Connection Pool
 * Uses mysql2/promise for async/await support
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'service_booking_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 30000,
  // Enable SSL for cloud-hosted MySQL (Railway, PlanetScale, Aiven, etc.)
  // Railway uses self-signed certs, so rejectUnauthorized must be false
  ...(process.env.NODE_ENV === 'production' && {
    ssl: { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTH === 'true' }
  }),
});

// Automatic query retry wrapper for handling cloud database connection drops
const originalQuery = pool.query.bind(pool);
pool.query = async function (sql, values) {
  try {
    return await originalQuery(sql, values);
  } catch (err) {
    const isConnError = [
      'PROTOCOL_CONNECTION_LOST',
      'ECONNRESET',
      'ETIMEDOUT',
      'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
      'COMMUNICATION_ERROR',
      'ER_CON_COUNT_ERROR',
      'PROTOCOL_PACKETS_OUT_OF_ORDER',
    ].includes(err?.code) || (err?.message && (err.message.includes('Connection lost') || err.message.includes('closed')));

    if (isConnError) {
      console.warn(`[DB] Connection dropped (${err.code || err.message}). Auto-retrying query...`);
      await new Promise((res) => setTimeout(res, 500));
      return await originalQuery(sql, values);
    }
    throw err;
  }
};


/**
 * Initialize the database tables if they don't exist.
 * Creates all tables using proper MySQL syntax.
 */
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database.');

    // Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('user', 'agent', 'admin') DEFAULT 'user',
        phone VARCHAR(20),
        location VARCHAR(100) DEFAULT NULL,
        city VARCHAR(100) DEFAULT NULL,
        area VARCHAR(100) DEFAULT NULL,
        availability_status BOOLEAN DEFAULT TRUE,
        service_category VARCHAR(100) DEFAULT NULL,
        reset_password_token VARCHAR(255) DEFAULT NULL,
        reset_password_expires DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Services Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        duration VARCHAR(100),
        image VARCHAR(500),
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bookings Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        service_id INT NOT NULL,
        agent_id INT,
        status ENUM('pending', 'confirmed', 'accepted', 'assigned', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
        date DATE NOT NULL,
        time VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        location VARCHAR(100) DEFAULT NULL,
        city VARCHAR(100) DEFAULT NULL,
        area VARCHAR(100) DEFAULT NULL,
        service_category VARCHAR(100) DEFAULT NULL,
        notes TEXT,
        subtotal DECIMAL(10, 2) NOT NULL,
        tax DECIMAL(10, 2) NOT NULL,
        platform_fee DECIMAL(10, 2) DEFAULT 49.00,
        total_price DECIMAL(10, 2) NOT NULL,
        payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
        escrow_status ENUM('none','held','released','refunded') DEFAULT 'none',
        otp_code VARCHAR(6) DEFAULT NULL,
        otp_expires_at DATETIME DEFAULT NULL,
        otp_verified BOOLEAN DEFAULT FALSE,
        payment_id VARCHAR(255),
        order_id VARCHAR(255),
        coupon_code VARCHAR(50) DEFAULT NULL,
        discount_amount DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Safe column migration for existing deployments
    const safeAddColumn = async (table, column, definition) => {
      try {
        await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`[DB Migration] Added column ${column} to ${table}`);
      } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME' && !e.message?.includes('Duplicate column')) {
          // ignore duplicate column errors
        }
      }
    };

    await safeAddColumn('bookings', 'coupon_code', 'VARCHAR(50) DEFAULT NULL');
    await safeAddColumn('bookings', 'discount_amount', 'DECIMAL(10, 2) DEFAULT 0.00');

    // Payouts Table — tracks money owed to agents after service completion
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payouts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL UNIQUE,
        agent_id INT NOT NULL,
        gross_amount DECIMAL(10, 2) NOT NULL,
        platform_commission DECIMAL(10, 2) NOT NULL,
        agent_amount DECIMAL(10, 2) NOT NULL,
        status ENUM('pending','paid','failed') DEFAULT 'pending',
        payout_reference VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP NULL,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Notifications Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        booking_id INT,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
      )
    `);

    // Reviews Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL UNIQUE,
        user_id INT NOT NULL,
        service_id INT NOT NULL,
        agent_id INT NOT NULL,
        rating INT NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Messages Table for realtime chat
    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        sender_id INT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Agent-Services mapping table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS agent_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agent_id INT NOT NULL,
        service_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_agent_service (agent_id, service_id),
        FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      )
    `);

    // Coupons Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        discount_type ENUM('percentage', 'fixed') NOT NULL,
        discount_value DECIMAL(10, 2) NOT NULL,
        max_discount DECIMAL(10, 2) DEFAULT NULL,
        min_order_value DECIMAL(10, 2) DEFAULT 0,
        usage_limit INT DEFAULT NULL,
        used_count INT DEFAULT 0,
        valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
        valid_to DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Performance indexes (ignore if already exist)
    const safeIndex = async (sql) => {
      try { await connection.query(sql); } catch (e) { if (e.code !== 'ER_DUP_KEYNAME') throw e; }
    };
    await safeIndex(`CREATE INDEX idx_users_city ON users(city)`);
    await safeIndex(`CREATE INDEX idx_users_service_category ON users(service_category)`);
    await safeIndex(`CREATE INDEX idx_bookings_city ON bookings(city)`);
    await safeIndex(`CREATE INDEX idx_bookings_service_category ON bookings(service_category)`);

    // Auto seed services if table is empty
    const [svcCheck] = await connection.query('SELECT COUNT(*) as count FROM services');
    if (svcCheck[0]?.count === 0) {
      console.log('🌱 Seeding initial service catalog...');
      const servicesData = [
        ['Deep Home Cleaning', 'Thorough cleaning of your entire home including kitchen, bathrooms, bedrooms and living areas.', 999, 'Cleaning', '3-4 hrs', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80'],
        ['Kitchen Deep Cleaning', 'Complete kitchen cleaning including chimney, stove, cabinets, and appliances.', 799, 'Cleaning', '2-3 hrs', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&auto=format&fit=crop&q=80'],
        ['Bathroom Cleaning', 'Deep cleaning of bathrooms including tiles, fixtures, drains, and sanitization.', 499, 'Cleaning', '1-2 hrs', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80'],
        ['AC Service & Repair', 'Complete AC servicing including gas refill, deep cleaning, and performance check.', 599, 'Appliance', '1-2 hrs', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80'],
        ['Washing Machine Repair', 'Expert repair and maintenance for all types of washing machines.', 399, 'Appliance', '1 hr', 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&auto=format&fit=crop&q=80'],
        ['Refrigerator Repair', 'Professional refrigerator repair service for cooling issues and maintenance.', 499, 'Appliance', '1-2 hrs', 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&auto=format&fit=crop&q=80'],
        ['Electrical Wiring', 'Professional electrical wiring, switch installation and repair by certified electricians.', 399, 'Electrical', '1-3 hrs', 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&auto=format&fit=crop&q=80'],
        ['Light & Fan Installation', 'Installation and repair of lights, fans, and other electrical fixtures.', 299, 'Electrical', '1 hr', 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&auto=format&fit=crop&q=80'],
        ['MCB & Switchboard Repair', 'Repair and replacement of MCBs, fuses, and switchboards.', 349, 'Electrical', '1-2 hrs', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80'],
        ['Full Home Painting', 'Complete interior and exterior painting with premium paints and professional painters.', 2499, 'Painting', '2-3 days', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80'],
        ['Single Room Painting', 'Professional painting service for one room.', 899, 'Painting', '1 day', 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&auto=format&fit=crop&q=80'],
        ['Exterior Wall Painting', 'Weather-resistant exterior painting for your home.', 1999, 'Painting', '2-3 days', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80'],
        ['Plumbing Services', 'Expert plumbing services for leaks, installations, drain cleaning and bathroom fitting.', 299, 'Plumbing', '1-2 hrs', 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&auto=format&fit=crop&q=80'],
        ['Tap & Mixer Installation', 'Installation and repair of taps, mixers, and faucets.', 249, 'Plumbing', '1 hr', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80'],
        ['Drain Cleaning', 'Professional drain and pipe cleaning service.', 399, 'Plumbing', '1-2 hrs', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80'],
        ['Salon at Home - Women', 'Professional salon services at your doorstep.', 599, 'Salon', '2-3 hrs', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80'],
        ['Salon at Home - Men', 'Complete grooming services for men at home.', 399, 'Salon', '1-2 hrs', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80'],
        ['Bridal Makeup', 'Professional bridal makeup and hairstyling at your home.', 2999, 'Salon', '3-4 hrs', 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop&q=80'],
        ['Furniture Assembly', 'Professional assembly and installation of furniture.', 499, 'Carpentry', '2-3 hrs', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&auto=format&fit=crop&q=80'],
        ['Door & Window Repair', 'Repair and maintenance of wooden doors, windows, and frames.', 399, 'Carpentry', '1-2 hrs', 'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=800&auto=format&fit=crop&q=80'],
        ['Custom Furniture', 'Custom-made furniture design and installation.', 3999, 'Carpentry', '3-5 days', 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&auto=format&fit=crop&q=80'],
        ['General Pest Control', 'Comprehensive pest control for cockroaches, ants, spiders, and common pests.', 799, 'Pest Control', '2-3 hrs', 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&auto=format&fit=crop&q=80'],
        ['Termite Control', 'Professional termite treatment and prevention.', 1499, 'Pest Control', '3-4 hrs', 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&auto=format&fit=crop&q=80'],
        ['Bed Bug Treatment', 'Effective bed bug elimination service.', 999, 'Pest Control', '2-3 hrs', 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&auto=format&fit=crop&q=80']
      ];
      for (const s of servicesData) {
        await connection.query('INSERT INTO services (name, description, price, category, duration, image, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)', [s[0], s[1], s[2], s[3], s[4], s[5], s[5]]);
      }
      console.log('✅ Seeded initial service catalog.');
    }

    // Auto seed coupons if table is empty
    const [cpnCheck] = await connection.query('SELECT COUNT(*) as count FROM coupons');
    if (cpnCheck[0]?.count === 0) {
      console.log('🌱 Seeding initial coupons...');
      await connection.query(`
        INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_discount) VALUES
        ('SERVEX50', 'fixed', 50.00, 200.00, 50.00),
        ('WELCOME10', 'percentage', 10.00, 100.00, 100.00)
      `);
      console.log('✅ Seeded initial coupons.');
    }

    connection.release();
    console.log('Database tables verified/created successfully.');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.error('   DB_HOST:', process.env.DB_HOST || 'NOT SET (defaulting to localhost)');
    console.error('   DB_USER:', process.env.DB_USER || 'NOT SET (defaulting to root)');
    console.error('   DB_NAME:', process.env.DB_NAME || 'NOT SET');
    console.error('   DB_PORT:', process.env.DB_PORT || '3306');
    console.error('   NODE_ENV:', process.env.NODE_ENV || 'development');
    console.error('   Error code:', error.code);
    // Don\'t crash the server — health endpoints will report the issue
  }
};

module.exports = { pool, initializeDatabase };
