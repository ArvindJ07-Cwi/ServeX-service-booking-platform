const mysql = require('./node_modules/mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedTiDB() {
  try {
    console.log('Connecting to TiDB Cloud to seed data...');
    const connection = await mysql.createConnection({
      host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '4FriZZXko2LDZrp.root',
      password: 'uzb9CrIYTFYrZhdG',
      database: 'service_booking_db',
      ssl: { rejectUnauthorized: false },
      connectTimeout: 20000
    });

    console.log('Creating database tables...');

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Payouts Table
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

    // Messages Table
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

    // Agent Services Table
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

    console.log('Tables created. Checking default users...');
    const [users] = await connection.query('SELECT * FROM users');
    if (users.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      const testPassword = await bcrypt.hash('test567', salt);

      await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['Admin User', 'admin@example.com', hashedPassword, 'admin']);
      await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['Agent One', 'agent@example.com', hashedPassword, 'agent']);
      await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['John Doe', 'user@example.com', hashedPassword, 'user']);
      await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['Arvind Jadhav', 'arvjjj@test.com', testPassword, 'user']);
      console.log('Users seeded!');
    }

    console.log('Checking default services...');
    const [services] = await connection.query('SELECT * FROM services');
    if (services.length === 0) {
      const servicesData = [
        ['Deep Home Cleaning', 'Thorough cleaning of your entire home including kitchen, bathrooms, bedrooms and living areas. Our professional cleaners use eco-friendly products.', 999, 'Cleaning', '3-4 hrs', 'https://images.unsplash.com/photo-1527515637462-cee1395c0c76?w=800&auto=format&fit=crop&q=80'],
        ['Kitchen Deep Cleaning', 'Complete kitchen cleaning including chimney, stove, cabinets, and appliances. Remove grease and grime effectively.', 799, 'Cleaning', '2-3 hrs', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&auto=format&fit=crop&q=80'],
        ['Bathroom Cleaning', 'Deep cleaning of bathrooms including tiles, fixtures, drains, and sanitization. Removes tough stains and odors.', 499, 'Cleaning', '1-2 hrs', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80'],
        ['AC Service & Repair', 'Complete AC servicing including gas refill, deep cleaning, and performance check. Covers all brands and models.', 599, 'Appliance', '1-2 hrs', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80'],
        ['Washing Machine Repair', 'Expert repair and maintenance for all types of washing machines. Quick diagnosis and genuine spare parts.', 399, 'Appliance', '1 hr', 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&auto=format&fit=crop&q=80'],
        ['Refrigerator Repair', 'Professional refrigerator repair service for cooling issues, noise problems, and general maintenance.', 499, 'Appliance', '1-2 hrs', 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&auto=format&fit=crop&q=80'],
        ['Electrical Wiring', 'Professional electrical wiring, switch installation and repair by certified electricians. Safe and reliable work.', 399, 'Electrical', '1-3 hrs', 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&auto=format&fit=crop&q=80'],
        ['Light & Fan Installation', 'Installation and repair of lights, fans, and other electrical fixtures. Includes wiring and safety checks.', 299, 'Electrical', '1 hr', 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&auto=format&fit=crop&q=80'],
        ['MCB & Switchboard Repair', 'Repair and replacement of MCBs, fuses, and switchboards. Emergency electrical services available.', 349, 'Electrical', '1-2 hrs', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80'],
        ['Full Home Painting', 'Complete interior and exterior painting with premium paints and professional painters. Includes wall preparation.', 2499, 'Painting', '2-3 days', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80'],
        ['Single Room Painting', 'Professional painting service for one room. Includes ceiling, walls, and door frames with quality finish.', 899, 'Painting', '1 day', 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&auto=format&fit=crop&q=80'],
        ['Exterior Wall Painting', 'Weather-resistant exterior painting for your home. Protects against rain, sun, and pollution.', 1999, 'Painting', '2-3 days', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80'],
        ['Plumbing Services', 'Expert plumbing services for leaks, installations, drain cleaning and bathroom fitting. Available 24/7.', 299, 'Plumbing', '1-2 hrs', 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&auto=format&fit=crop&q=80'],
        ['Tap & Mixer Installation', 'Installation and repair of taps, mixers, and faucets. Includes leak fixing and replacement.', 249, 'Plumbing', '1 hr', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80'],
        ['Drain Cleaning', 'Professional drain and pipe cleaning service. Removes blockages and prevents future clogs.', 399, 'Plumbing', '1-2 hrs', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80'],
        ['Salon at Home - Women', 'Professional salon services at your doorstep — haircut, facial, manicure, pedicure and more for women.', 599, 'Salon', '2-3 hrs', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80'],
        ['Salon at Home - Men', 'Complete grooming services for men including haircut, shave, facial, and massage at home.', 399, 'Salon', '1-2 hrs', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80'],
        ['Bridal Makeup', 'Professional bridal makeup and hairstyling at your home. Includes trial session and touch-ups.', 2999, 'Salon', '3-4 hrs', 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop&q=80'],
        ['Furniture Assembly', 'Professional assembly and installation of furniture. Includes beds, wardrobes, tables, and chairs.', 499, 'Carpentry', '2-3 hrs', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&auto=format&fit=crop&q=80'],
        ['Door & Window Repair', 'Repair and maintenance of wooden doors, windows, and frames. Includes hinge replacement and alignment.', 399, 'Carpentry', '1-2 hrs', 'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=800&auto=format&fit=crop&q=80'],
        ['Custom Furniture', 'Custom-made furniture design and installation. Tailored to your space and requirements.', 3999, 'Carpentry', '3-5 days', 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&auto=format&fit=crop&q=80'],
        ['General Pest Control', 'Comprehensive pest control for cockroaches, ants, spiders, and other common pests. Safe for family and pets.', 799, 'Pest Control', '2-3 hrs', 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&auto=format&fit=crop&q=80'],
        ['Termite Control', 'Professional termite treatment and prevention. Protects your furniture and wooden structures.', 1499, 'Pest Control', '3-4 hrs', 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&auto=format&fit=crop&q=80'],
        ['Bed Bug Treatment', 'Effective bed bug elimination service. Includes mattress treatment and preventive measures.', 999, 'Pest Control', '2-3 hrs', 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&auto=format&fit=crop&q=80']
      ];
      for (const s of servicesData) {
        await connection.query('INSERT INTO services (name, description, price, category, duration, image, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)', [s[0], s[1], s[2], s[3], s[4], s[5], s[5]]);
      }
      console.log('24 Services seeded!');
    }

    const [finalSvc] = await connection.query('SELECT COUNT(*) as count FROM services');
    console.log(`🎉 Seeding complete! Total services in database: ${finalSvc[0].count}`);

    await connection.end();
  } catch (err) {
    console.error('❌ Seeding Error:', err.message, err.stack);
  }
}

seedTiDB();
