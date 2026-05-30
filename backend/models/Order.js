const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const router = express.Router();

// ---- inline auth middleware ----
function protect(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
        return res.status(401).json({ message: 'Not authorized' });
    try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        User.findById(decoded.id).select('-password').then(user => {
            if (!user) return res.status(401).json({ message: 'User not found' });
            req.user = user;
            next();
        }).catch(err => res.status(500).json({ message: err.message }));
    } catch (err) {
        res.status(401).json({ message: 'Token invalid' });
    }
}

function adminOnly(req, res, next) {
    if (req.user && req.user.role === 'admin') return next();
    res.status(403).json({ message: 'Admin access only' });
}

// Place new order
router.post('/', protect, async (req, res) => {
    try {
        const {
            customerName, customerEmail, customerPhone,
            customerAddress, city, state, pincode, country,
            items, subtotal, gst, total, paymentMethod
        } = req.body;

        if (!items || !items.length)
            return res.status(400).json({ message: 'No items in order' });

        const order = await Order.create({
            user: req.user._id,
            customerName, customerEmail, customerPhone,
            customerAddress, city, state, pincode, country,
            items, subtotal, gst, total, paymentMethod,
            status: 'Processing',
            trackingEvents: [{ stage: 'Order Placed', date: new Date().toLocaleString('en-IN'), completed: true }],
            estimatedDelivery: new Date(Date.now() + 5 * 86400000).toLocaleDateString('en-IN')
        });

        res.status(201).json({ message: 'Order placed successfully', order });
    } catch (err) {
        console.error('Order error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get my orders
router.get('/my', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// ADMIN - Get ALL orders
router.get('/admin/all', protect, adminOnly, async (req, res) => {
    try {
        const { status, search } = req.query;
        let filter = {};
        if (status && status !== 'all') filter.status = status;
        if (search) {
            filter.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerEmail: { $regex: search, $options: 'i' } }
            ];
        }
        const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200);
        const revenueAgg = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);
        const stats = {
            total: await Order.countDocuments(),
            Processing: await Order.countDocuments({ status: 'Processing' }),
            Shipped: await Order.countDocuments({ status: 'Shipped' }),
            'Out for Delivery': await Order.countDocuments({ status: 'Out for Delivery' }),
            Delivered: await Order.countDocuments({ status: 'Delivered' }),
            Cancelled: await Order.countDocuments({ status: 'Cancelled' }),
            revenue: revenueAgg[0]?.total || 0
        };
        res.json({ orders, stats });
    } catch (err) {
        console.error('Admin orders error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// ADMIN - Update status
router.put('/admin/:orderId/status', protect, adminOnly, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        order.status = status;
        order.trackingEvents.push({ stage: status, date: new Date().toLocaleString('en-IN'), completed: true });
        await order.save();
        res.json({ message: 'Status updated', order });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// ADMIN - Delete order
router.delete('/admin/:orderId', protect, adminOnly, async (req, res) => {
    try {
        await Order.findOneAndDelete({ orderId: req.params.orderId });
        res.json({ message: 'Order deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get single order
router.get('/:orderId', protect, async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId, user: req.user._id });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json({ order });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;