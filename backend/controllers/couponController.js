const { pool } = require('../config/db');

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
const getCoupons = async (req, res) => {
    try {
        const [coupons] = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
        return res.json(coupons);
    } catch (error) {
        console.error('Get coupons error:', error);
        return res.status(500).json({ message: 'Server error fetching coupons' });
    }
};

// @desc    Create coupon (Admin)
// @route   POST /api/coupons
const createCoupon = async (req, res) => {
    try {
        const { code, discount_type, discount_value, max_discount, min_order_value, usage_limit, valid_to } = req.body;
        if (!code || !discount_type || !discount_value) {
            return res.status(400).json({ message: 'Code, discount type, and discount value are required' });
        }
        await pool.query(
            `INSERT INTO coupons (code, discount_type, discount_value, max_discount, min_order_value, usage_limit, valid_to, used_count)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
            [code.toUpperCase(), discount_type, discount_value, max_discount || null, min_order_value || 0, usage_limit || null, valid_to || null]
        );
        return res.status(201).json({ message: 'Coupon created successfully' });
    } catch (error) {
        console.error('Create coupon error:', error);
        return res.status(500).json({ message: 'Server error creating coupon' });
    }
};

// @desc    Delete coupon (Admin)
// @route   DELETE /api/coupons/:id
const deleteCoupon = async (req, res) => {
    try {
        await pool.query('DELETE FROM coupons WHERE id = ?', [req.params.id]);
        return res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Delete coupon error:', error);
        return res.status(500).json({ message: 'Server error deleting coupon' });
    }
};

// @desc    Apply coupon
// @route   POST /api/coupons/apply
const applyCoupon = async (req, res) => {
    try {
        const { code, amount } = req.body;
        if (!code) {
            return res.status(400).json({ message: 'Coupon code is required' });
        }

        const [coupons] = await pool.query('SELECT * FROM coupons WHERE code = ?', [code]);
        if (!coupons.length) {
            return res.status(400).json({ message: 'Invalid or Expired Coupon' });
        }

        const coupon = coupons[0];

        // Check if expired
        if (coupon.valid_to && new Date() > new Date(coupon.valid_to)) {
            return res.status(400).json({ message: 'Invalid or Expired Coupon' });
        }

        if (coupon.valid_from && new Date() < new Date(coupon.valid_from)) {
            return res.status(400).json({ message: 'Coupon is not active yet' });
        }

        // Check overall usage limit
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            return res.status(400).json({ message: 'Invalid or Expired Coupon' });
        }

        // Check min order value
        if (amount < coupon.min_order_value) {
            return res.status(400).json({ message: `Minimum order value for this coupon is ₹${coupon.min_order_value}` });
        }

        // Check user limit (e.g. first 2 bookings only)
        if (coupon.user_limit) {
            const [userBookings] = await pool.query('SELECT count(*) as count FROM bookings WHERE user_id = ?', [req.user.id]);
            if (userBookings[0].count >= coupon.user_limit) {
                return res.status(400).json({ message: 'You are not eligible for this coupon' });
            }
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discount_type === 'percentage') {
            discount = (amount * coupon.discount_value) / 100;
            if (coupon.max_discount && discount > coupon.max_discount) {
                discount = coupon.max_discount;
            }
        } else {
            discount = coupon.discount_value;
        }

        // Make sure discount isn't more than the actual amount
        if (discount > amount) {
            discount = amount;
        }

        return res.json({
            message: 'Coupon Applied Successfully 🎉',
            discount_amount: discount,
            coupon_code: code,
            final_amount: amount - discount
        });
    } catch (error) {
        console.error('Apply coupon error:', error);
        return res.status(500).json({ message: 'Server error applying coupon' });
    }
}

module.exports = { applyCoupon, getCoupons, createCoupon, deleteCoupon };
