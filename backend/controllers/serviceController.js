const { pool } = require('../config/db');

// @desc    Fetch all services
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
    try {
        const { category, search } = req.query;
        // Prefer `image_url` when present, otherwise fall back to legacy `image` column
        let query = 'SELECT id as _id, name, description, price, category, duration, COALESCE(image_url, image) as image, created_at FROM services';
        let params = [];

        if (category) {
            query += ' WHERE category = ?';
            params.push(category);
        }

        if (search) {
            query += params.length ? ' AND ' : ' WHERE ';
            query += '(name LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        const [services] = await pool.query(query, params);
        return res.json({ services });
    } catch (error) {
        console.error('Get services error:', error);
        return res.status(500).json({ message: 'Server error fetching services' });
    }
};

// @desc    Fetch single service
// @route   GET /api/services/:id
// @access  Public
const getServiceById = async (req, res) => {
    try {
        const [services] = await pool.query('SELECT id as _id, name, description, price, category, duration, COALESCE(image_url, image) as image, created_at FROM services WHERE id = ?', [req.params.id]);
        const service = services[0];

        if (service) {
            return res.json(service);
        } else {
            return res.status(404).json({ message: 'Service not found' });
        }
    } catch (error) {
        console.error('Get service error:', error);
        return res.status(500).json({ message: 'Server error fetching service' });
    }
};

// @desc    Get all categories
// @route   GET /api/services/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT DISTINCT category FROM services WHERE category IS NOT NULL');
        return res.json(categories.map(c => c.category));
    } catch (error) {
        console.error('Get categories error:', error);
        return res.status(500).json({ message: 'Server error fetching categories' });
    }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Private/Admin
const createService = async (req, res) => {
    try {
        const { name, description, price, category, duration, image, image_url } = req.body;

        const [result] = await pool.query(
            'INSERT INTO services (name, description, price, category, duration, image, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description, price, category, duration, image, image_url]
        );

        const [newService] = await pool.query('SELECT id as _id, name, description, price, category, duration, COALESCE(image_url, image) as image, created_at FROM services WHERE id = ?', [result.insertId]);
        return res.status(201).json(newService[0]);
    } catch (error) {
        console.error('Create service error:', error);
        return res.status(500).json({ message: 'Server error creating service' });
    }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private/Admin
const updateService = async (req, res) => {
    try {

        const { name, description, price, category, duration, image, image_url } = req.body;

        const [service] = await pool.query('SELECT * FROM services WHERE id = ?', [req.params.id]);

        if (service.length === 0) {
            return res.status(404).json({ message: 'Service not found' });
        }

        await pool.query(
            'UPDATE services SET name = ?, description = ?, price = ?, category = ?, duration = ?, image = ?, image_url = ? WHERE id = ?',
            [name, description, price, category, duration, image, image_url, req.params.id]
        );

        const [updatedService] = await pool.query('SELECT id as _id, name, description, price, category, duration, COALESCE(image_url, image) as image, created_at FROM services WHERE id = ?', [req.params.id]);
        return res.json(updatedService[0]);
    } catch (error) {
        console.error('Update service error:', error);
        return res.status(500).json({ message: 'Server error updating service' });
    }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private/Admin
const deleteService = async (req, res) => {
    try {
        const [service] = await pool.query('SELECT * FROM services WHERE id = ?', [req.params.id]);

        if (service.length === 0) {
            return res.status(404).json({ message: 'Service not found' });
        }

        await pool.query('DELETE FROM services WHERE id = ?', [req.params.id]);
        return res.json({ message: 'Service removed' });
    } catch (error) {
        console.error('Delete service error:', error);
        return res.status(500).json({ message: 'Server error deleting service' });
    }
};

module.exports = {
    getServices,
    getServiceById,
    getCategories,
    createService,
    updateService,
    deleteService,
};

