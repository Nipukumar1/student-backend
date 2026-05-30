const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Get cart
router.get('/', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        res.json(user.cart || []);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cart' });
    }
});

// Add to cart
router.post('/add', verifyToken, async (req, res) => {
    try {
        const { productId, name, price, icon, quantity = 1 } = req.body;
        
        const user = await User.findById(req.userId);
        const existingItem = user.cart.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            user.cart.push({ productId, name, price, icon, quantity });
        }
        
        await user.save();
        res.json({ message: 'Added to cart', cart: user.cart });
    } catch (error) {
        res.status(500).json({ message: 'Error adding to cart' });
    }
});

// Update cart item quantity
router.put('/update/:productId', verifyToken, async (req, res) => {
    try {
        const { quantity } = req.body;
        const user = await User.findById(req.userId);
        
        const item = user.cart.find(item => item.productId == req.params.productId);
        if (item) {
            item.quantity = quantity;
            if (item.quantity <= 0) {
                user.cart = user.cart.filter(item => item.productId != req.params.productId);
            }
            await user.save();
        }
        
        res.json({ message: 'Cart updated', cart: user.cart });
    } catch (error) {
        res.status(500).json({ message: 'Error updating cart' });
    }
});

// Remove from cart
router.delete('/remove/:productId', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        user.cart = user.cart.filter(item => item.productId != req.params.productId);
        await user.save();
        
        res.json({ message: 'Removed from cart', cart: user.cart });
    } catch (error) {
        res.status(500).json({ message: 'Error removing from cart' });
    }
});

// Clear cart
router.delete('/clear', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        user.cart = [];
        await user.save();
        
        res.json({ message: 'Cart cleared', cart: [] });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing cart' });
    }
});

module.exports = router;