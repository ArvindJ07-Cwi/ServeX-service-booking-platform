const { pool, initializeDatabase } = require('./config/db');
const bcrypt = require('bcryptjs');

const seedData = async () => {
    try {
        console.log('Seeding data...');
        // Ensure tables exist
        await initializeDatabase();

        // Clear existing data? Maybe careful here.
        // await pool.query('DELETE FROM bookings');
        // await pool.query('DELETE FROM services');
        // await pool.query('DELETE FROM users');

        // Check if users exist
        const [users] = await pool.query('SELECT * FROM users');
        if (users.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);

            await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['Admin User', 'admin@example.com', hashedPassword, 'admin']);
            await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['Agent One', 'agent@example.com', hashedPassword, 'agent']);
            await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['John Doe', 'user@example.com', hashedPassword, 'user']);
            console.log('Users created');
        }

        // Check if services exist
        const [services] = await pool.query('SELECT * FROM services');
        if (services.length === 0) {
            const servicesData = [
                // Cleaning Services
                ['Deep Home Cleaning', 'Thorough cleaning of your entire home including kitchen, bathrooms, bedrooms and living areas. Our professional cleaners use eco-friendly products.', 999, 'Cleaning', '3-4 hrs', 'https://images.unsplash.com/photo-1527515637462-cee1395c0c76?w=800&auto=format&fit=crop&q=80'],
                ['Kitchen Deep Cleaning', 'Complete kitchen cleaning including chimney, stove, cabinets, and appliances. Remove grease and grime effectively.', 799, 'Cleaning', '2-3 hrs', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&auto=format&fit=crop&q=80'],
                ['Bathroom Cleaning', 'Deep cleaning of bathrooms including tiles, fixtures, drains, and sanitization. Removes tough stains and odors.', 499, 'Cleaning', '1-2 hrs', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80'],

                // Appliance Services
                ['AC Service & Repair', 'Complete AC servicing including gas refill, deep cleaning, and performance check. Covers all brands and models.', 599, 'Appliance', '1-2 hrs', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80'],
                ['Washing Machine Repair', 'Expert repair and maintenance for all types of washing machines. Quick diagnosis and genuine spare parts.', 399, 'Appliance', '1 hr', 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&auto=format&fit=crop&q=80'],
                ['Refrigerator Repair', 'Professional refrigerator repair service for cooling issues, noise problems, and general maintenance.', 499, 'Appliance', '1-2 hrs', 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&auto=format&fit=crop&q=80'],

                // Electrical Services
                ['Electrical Wiring', 'Professional electrical wiring, switch installation and repair by certified electricians. Safe and reliable work.', 399, 'Electrical', '1-3 hrs', 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&auto=format&fit=crop&q=80'],
                ['Light & Fan Installation', 'Installation and repair of lights, fans, and other electrical fixtures. Includes wiring and safety checks.', 299, 'Electrical', '1 hr', 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&auto=format&fit=crop&q=80'],
                ['MCB & Switchboard Repair', 'Repair and replacement of MCBs, fuses, and switchboards. Emergency electrical services available.', 349, 'Electrical', '1-2 hrs', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80'],

                // Painting Services
                ['Full Home Painting', 'Complete interior and exterior painting with premium paints and professional painters. Includes wall preparation.', 2499, 'Painting', '2-3 days', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80'],
                ['Single Room Painting', 'Professional painting service for one room. Includes ceiling, walls, and door frames with quality finish.', 899, 'Painting', '1 day', 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&auto=format&fit=crop&q=80'],
                ['Exterior Wall Painting', 'Weather-resistant exterior painting for your home. Protects against rain, sun, and pollution.', 1999, 'Painting', '2-3 days', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80'],

                // Plumbing Services
                ['Plumbing Services', 'Expert plumbing services for leaks, installations, drain cleaning and bathroom fitting. Available 24/7.', 299, 'Plumbing', '1-2 hrs', 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&auto=format&fit=crop&q=80'],
                ['Tap & Mixer Installation', 'Installation and repair of taps, mixers, and faucets. Includes leak fixing and replacement.', 249, 'Plumbing', '1 hr', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80'],
                ['Drain Cleaning', 'Professional drain and pipe cleaning service. Removes blockages and prevents future clogs.', 399, 'Plumbing', '1-2 hrs', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80'],

                // Salon Services
                ['Salon at Home - Women', 'Professional salon services at your doorstep — haircut, facial, manicure, pedicure and more for women.', 599, 'Salon', '2-3 hrs', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80'],
                ['Salon at Home - Men', 'Complete grooming services for men including haircut, shave, facial, and massage at home.', 399, 'Salon', '1-2 hrs', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80'],
                ['Bridal Makeup', 'Professional bridal makeup and hairstyling at your home. Includes trial session and touch-ups.', 2999, 'Salon', '3-4 hrs', 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop&q=80'],

                // Carpentry Services
                ['Furniture Assembly', 'Professional assembly and installation of furniture. Includes beds, wardrobes, tables, and chairs.', 499, 'Carpentry', '2-3 hrs', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&auto=format&fit=crop&q=80'],
                ['Door & Window Repair', 'Repair and maintenance of wooden doors, windows, and frames. Includes hinge replacement and alignment.', 399, 'Carpentry', '1-2 hrs', 'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=800&auto=format&fit=crop&q=80'],
                ['Custom Furniture', 'Custom-made furniture design and installation. Tailored to your space and requirements.', 3999, 'Carpentry', '3-5 days', 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&auto=format&fit=crop&q=80'],

                // Pest Control
                ['General Pest Control', 'Comprehensive pest control for cockroaches, ants, spiders, and other common pests. Safe for family and pets.', 799, 'Pest Control', '2-3 hrs', 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&auto=format&fit=crop&q=80'],
                ['Termite Control', 'Professional termite treatment and prevention. Protects your furniture and wooden structures.', 1499, 'Pest Control', '3-4 hrs', 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&auto=format&fit=crop&q=80'],
                ['Bed Bug Treatment', 'Effective bed bug elimination service. Includes mattress treatment and preventive measures.', 999, 'Pest Control', '2-3 hrs', 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&auto=format&fit=crop&q=80']
            ];

            for (const s of servicesData) {
                await pool.query('INSERT INTO services (name, description, price, category, duration, image) VALUES (?, ?, ?, ?, ?, ?)', s);
            }
            console.log('Services created');
        } else {
            // Update existing services that are missing images
            const imageMap = {
                'Deep Home Cleaning': 'https://images.unsplash.com/photo-1527515637462-cee1395c0c76?w=800&auto=format&fit=crop&q=80',
                'Kitchen Deep Cleaning': 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&auto=format&fit=crop&q=80',
                'Bathroom Cleaning': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
                'AC Service & Repair': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
                'Washing Machine Repair': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&auto=format&fit=crop&q=80',
                'Refrigerator Repair': 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&auto=format&fit=crop&q=80',
                'Electrical Wiring': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&auto=format&fit=crop&q=80',
                'Light & Fan Installation': 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&auto=format&fit=crop&q=80',
                'MCB & Switchboard Repair': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&auto=format&fit=crop&q=80',
                'Full Home Painting': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80',
                'Single Room Painting': 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&auto=format&fit=crop&q=80',
                'Exterior Wall Painting': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
                'Plumbing Services': 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&auto=format&fit=crop&q=80',
                'Tap & Mixer Installation': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80',
                'Drain Cleaning': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80',
                'Salon at Home - Women': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
                'Salon at Home - Men': 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
                'Bridal Makeup': 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop&q=80',
                'Furniture Assembly': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&auto=format&fit=crop&q=80',
                'Door & Window Repair': 'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=800&auto=format&fit=crop&q=80',
                'Custom Furniture': 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&auto=format&fit=crop&q=80',
                'General Pest Control': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&auto=format&fit=crop&q=80',
                'Termite Control': 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&auto=format&fit=crop&q=80',
                'Bed Bug Treatment': 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&auto=format&fit=crop&q=80'
            };

            let updated = 0;
            for (const [name, imageUrl] of Object.entries(imageMap)) {
                const [result] = await pool.query(
                    'UPDATE services SET image = ? WHERE name = ? AND (image IS NULL OR image = "")',
                    [imageUrl, name]
                );
                if (result.affectedRows > 0) updated++;
            }
            if (updated > 0) {
                console.log(`Updated ${updated} services with missing images`);
            } else {
                console.log('Services already have images');
            }
        }

        console.log('Seeding complete');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
